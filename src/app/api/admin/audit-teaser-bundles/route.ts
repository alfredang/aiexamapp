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

  // ── Q3: lonely base-shell exams (this category was missed by the
  //       original audit and bit us on aws-soa-c03 / aws-sap-c02 — both
  //       were published base shells with their sibling variants wired
  //       into a published bundle, so visiting /practice-exams/aws/<base>
  //       rendered as a lonely exam page with the "isn't yet available
  //       in a bundle" CTA instead of falling through to the bundle).
  //
  // A published exam is "lonely" iff:
  //   1. it is published (= currently customer-visible at its detail page)
  //   2. it is NOT in any published bundle's items[] directly
  //   3. BUT at least one sibling exam (`{slug}-p\d+` or `{slug}-practice-\d+`)
  //      IS in a published bundle — meaning the bundle exists for this cert
  //      and is just bypassing the base shell. THIS is what tells us the
  //      fix is "unpublish the base shell" not "wire a new bundle".
  //
  // Bundles are pre-fetched with published-state and items; a tiny helper
  // map gives us O(1) lookup of "is this slug in any published bundle".
  const examIdsInPublishedBundle = new Set<string>();
  for (const b of bundles) {
    if (!b.published) continue;
    for (const i of b.items) examIdsInPublishedBundle.add(i.examId);
  }
  const slugsInPublishedBundle = new Set<string>();
  for (const b of bundles) {
    if (!b.published) continue;
    for (const i of b.items) slugsInPublishedBundle.add(i.exam.slug);
  }
  const VARIANT_RE = /^(.+?)-(?:p|practice-)\d+$/i;
  const lonelyBaseShells = exams
    .filter((e) => e.published)
    .filter((e) => !examIdsInPublishedBundle.has(e.id))
    .map((e) => {
      // Find sibling variants in any published bundle.
      const variantPrefix = `${e.slug}-`;
      const siblings = [...slugsInPublishedBundle].filter((s) => {
        if (!s.startsWith(variantPrefix)) return false;
        const m = s.match(VARIANT_RE);
        return !!m && m[1] === e.slug;
      });
      return { exam: e, siblings };
    })
    .filter((row) => row.siblings.length > 0)
    .map((row) => ({
      vendor: row.exam.vendor.slug,
      slug: row.exam.slug,
      code: row.exam.code,
      title: row.exam.title,
      publishedQuestions: pubBy.get(row.exam.id) || 0,
      siblingsInBundle: row.siblings.sort()
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
