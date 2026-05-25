import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin-only read audit answering two operational questions:
 *
 *   Q1. Which published exams have ZERO published teaser questions?
 *       (clicking the teaser CTA on these returns ?teaser=unavailable.)
 *   Q2. Which bundles are empty (no BundleItem rows) or wired only
 *       to unpublished / archived exams?
 *
 * Exists because the prod Postgres is on Coolify's internal Docker
 * network and isn't reachable from a laptop. Hit this endpoint signed
 * in as admin and paste the JSON back to the audit conversation.
 * Pure reads, no mutations.
 *
 * GET /api/admin/audit-teaser-bundles
 */
export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const [exams, bundles, teaserGroups, pubGroups, draftGroups] = await Promise.all([
    db.exam.findMany({
      where: { deletedAt: null },
      // Pulled for the unpublished-drilldown: when was the exam last edited
      // (did someone manually toggle it off, or was it never enabled?) and
      // when was it created.
      include: {
        vendor: { select: { slug: true, name: true } }
      },
      orderBy: [{ vendor: { slug: 'asc' } }, { slug: 'asc' }]
    }),
    // Bundle has no direct vendor relation — derive it from items[0].exam.vendor.
    db.bundle.findMany({
      include: {
        items: {
          include: {
            exam: {
              select: {
                slug: true,
                published: true,
                deletedAt: true,
                vendor: { select: { slug: true } }
              }
            }
          }
        }
      },
      orderBy: { slug: 'asc' }
    }),
    db.question.groupBy({
      by: ['examId'],
      where: { isTeaser: true, status: 'PUBLISHED' },
      _count: { _all: true }
    }),
    db.question.groupBy({
      by: ['examId'],
      where: { status: 'PUBLISHED' },
      _count: { _all: true }
    }),
    db.question.groupBy({
      by: ['examId'],
      where: { status: 'DRAFT' },
      _count: { _all: true }
    })
  ]);

  const teaserBy = new Map(teaserGroups.map((g) => [g.examId, g._count._all]));
  const pubBy = new Map(pubGroups.map((g) => [g.examId, g._count._all]));
  const draftBy = new Map(draftGroups.map((g) => [g.examId, g._count._all]));

  // Which exam IDs are referenced by ANY bundle item — used in the
  // unpublished-exam drill-down to see whether dormant rows are at
  // least wired into a bundle (which is the actual symptom we're
  // chasing) or completely orphan.
  const referencedExamIds = new Set<string>();
  for (const b of bundles) for (const i of b.items) referencedExamIds.add(i.examId);

  const examRows = exams.map((e) => ({
    vendor: e.vendor.slug,
    slug: e.slug,
    code: e.code,
    published: e.published,
    publishedQuestions: pubBy.get(e.id) || 0,
    teaserQuestions: teaserBy.get(e.id) || 0
  }));

  const noTeaser = examRows.filter((e) => e.published && e.teaserQuestions === 0);
  const lowTeaser = examRows
    .filter((e) => e.published && e.teaserQuestions > 0 && e.teaserQuestions < 10)
    .sort((a, b) => a.teaserQuestions - b.teaserQuestions);

  const bundleRows = bundles.map((b) => {
    const items = b.items.map((i) => ({
      slug: i.exam.slug,
      tier: String(i.tier),
      live: i.exam.published && !i.exam.deletedAt
    }));
    // Vendor derived from first item's exam (a bundle always groups one
    // cert from one vendor in this product — see CLAUDE.md "Bundle is the
    // unit of sale").
    const vendor = b.items[0]?.exam.vendor.slug ?? '(no items)';
    return {
      vendor,
      slug: b.slug,
      published: b.published,
      itemCount: b.items.length,
      liveItemCount: items.filter((i) => i.live).length,
      items
    };
  });

  const emptyBundles = bundleRows.filter((b) => b.itemCount === 0);
  const deadBundles = bundleRows.filter((b) => b.itemCount > 0 && b.liveItemCount === 0);

  // ── Q3: lonely exams — published exams that look like they should be
  //       in a bundle but aren't. Two shapes that occur in practice:
  //
  //   (a) Base shell. The exam's slug IS the cert slug (e.g. aws-soa-c03),
  //       its sibling variants `{slug}-p1/-p2/-p3` are wired into a
  //       published bundle, but the base shell itself isn't. Visiting
  //       /practice-exams/aws/aws-soa-c03 then renders the lonely-exam
  //       page with the "isn't yet available in a bundle" CTA instead
  //       of falling through to the bundle. Fix: unpublish the base.
  //       (bit us on aws-soa-c03 / aws-sap-c02 — see PR #54.)
  //
  //   (b) Orphan variant. The exam IS a variant (e.g.
  //       oracle-oci-foundations-1z0-1085-p1), and there's a published
  //       bundle whose slug + `-` is a prefix of this exam's slug (e.g.
  //       oracle-oci-foundations), but the variant isn't in that
  //       bundle's items[]. Common cause: a cert was renamed (here:
  //       2026-05-19 OCI standardisation added the `-1z0-1085-` infix)
  //       but the bundle's BundleItem rows were never repointed. Fix:
  //       repoint the bundle items to the live variant slugs. (Bit us
  //       on oracle-oci-foundations — see PR #58.)
  //
  // A published exam is flagged "lonely" iff:
  //   1. it is published (= customer-visible at its detail page)
  //   2. it is NOT in any published bundle's items[] directly
  //   3. AND there exists a published bundle whose slug + `-` is a
  //      prefix of this exam's slug. The bundle is the cert family;
  //      this exam belongs in it but isn't wired.
  //
  // This generalisation catches both (a) — bundle.slug === exam.slug
  // and the bundle wires sibling variants — and (b) — bundle.slug is a
  // proper prefix of exam.slug.
  const examIdsInPublishedBundle = new Set<string>();
  for (const b of bundles) {
    if (!b.published) continue;
    for (const i of b.items) examIdsInPublishedBundle.add(i.examId);
  }
  // For each published bundle, the slugs of exams that are wired in.
  const bundleSlugsToItemSlugs = new Map<string, string[]>();
  for (const b of bundles) {
    if (!b.published) continue;
    bundleSlugsToItemSlugs.set(b.slug, b.items.map((i) => i.exam.slug));
  }
  // Sorted descending by length so longer/more-specific bundle slugs win
  // over shorter ones if multiple match (e.g. an exam slug that has two
  // related bundle slugs as prefixes — take the more specific one).
  const publishedBundleSlugs = [...bundleSlugsToItemSlugs.keys()].sort(
    (a, b) => b.length - a.length
  );

  const lonelyBaseShells = exams
    .filter((e) => e.published)
    .filter((e) => !examIdsInPublishedBundle.has(e.id))
    .map((e) => {
      // Find the most-specific published bundle whose slug is a prefix
      // of this exam. `bundle.slug + '-'` must be a prefix (or equal
      // the exam slug, in which case the exam IS the base shell). The
      // sort above ensures we pick the longest match first.
      const matchingBundleSlug = publishedBundleSlugs.find((bs) =>
        e.slug === bs || e.slug.startsWith(`${bs}-`)
      );
      if (!matchingBundleSlug) return null;
      const siblings = bundleSlugsToItemSlugs.get(matchingBundleSlug) ?? [];
      return { exam: e, matchingBundleSlug, siblings };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .map((row) => ({
      vendor: row.exam.vendor.slug,
      slug: row.exam.slug,
      code: row.exam.code,
      title: row.exam.title,
      publishedQuestions: pubBy.get(row.exam.id) || 0,
      relatedBundleSlug: row.matchingBundleSlug,
      siblingsInBundle: [...row.siblings].sort()
    }))
    .sort((a, b) => a.vendor.localeCompare(b.vendor) || a.slug.localeCompare(b.slug));

  // Drill-down on the unpublished, non-archived exams (~19 rows on prod
  // at time of writing). The dead-bundle symptom is that these are linked
  // from published bundles. The diagnostic question: do they have content
  // sitting in PUBLISHED or DRAFT (i.e. a flip-the-flag fix) or are they
  // empty (i.e. need to be authored or de-linked)?
  const unpublishedExamDetails = exams
    .filter((e) => !e.published)
    .map((e) => ({
      vendor: e.vendor.slug,
      slug: e.slug,
      code: e.code,
      title: e.title,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      publishedQuestions: pubBy.get(e.id) || 0,
      draftQuestions: draftBy.get(e.id) || 0,
      referencedByBundle: referencedExamIds.has(e.id)
    }))
    .sort((a, b) =>
      // Most-likely-to-be-fixable first: exams with content already
      // (just unpublished) bubble up.
      (b.publishedQuestions + b.draftQuestions) - (a.publishedQuestions + a.draftQuestions)
    );

  return NextResponse.json({
    ok: true,
    totals: {
      exams: exams.length,
      publishedExams: examRows.filter((e) => e.published).length,
      unpublishedExams: examRows.filter((e) => !e.published).length,
      bundles: bundles.length
    },
    examsMissingTeaser: noTeaser,
    examsWithLowTeaser: lowTeaser,
    unpublishedExamDetails,
    lonelyBaseShells,
    emptyBundles,
    deadBundles
  });
}
