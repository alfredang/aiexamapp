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

  const [exams, bundles, teaserGroups, pubGroups] = await Promise.all([
    db.exam.findMany({
      where: { deletedAt: null },
      include: { vendor: { select: { slug: true, name: true } } },
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
    })
  ]);

  const teaserBy = new Map(teaserGroups.map((g) => [g.examId, g._count._all]));
  const pubBy = new Map(pubGroups.map((g) => [g.examId, g._count._all]));

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

  return NextResponse.json({
    ok: true,
    totals: {
      exams: exams.length,
      publishedExams: examRows.filter((e) => e.published).length,
      bundles: bundles.length
    },
    examsMissingTeaser: noTeaser,
    examsWithLowTeaser: lowTeaser,
    emptyBundles,
    deadBundles
  });
}
