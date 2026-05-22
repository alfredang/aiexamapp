import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Generic catalog finalize for any vendor. Applies directly (operations
 * are cosmetic / explicitly-requested, low-risk, trivially reversible).
 *
 *   POST /api/admin/catalog-finalize?vendor=aws
 *   POST /api/admin/catalog-finalize?vendor=aws&archive=aws-aip-c01
 *
 * For every exam under the requested vendor:
 *   1. SYNC questionCount — set exam.questionCount to the actual count of
 *      PUBLISHED questions when they disagree.
 *   2. FIX archived/published inconsistency — an archived exam
 *      (deletedAt set) with published=true is forced to published=false.
 *
 * Optionally, `&archive=<comma-separated slugs>` soft-deletes specific
 * exams (deletedAt set, published=false) — used here to retire the
 * aws-aip-c01 duplicate.
 *
 * Returns full before/after per changed row; records one AdminLog entry.
 * Idempotent — a second run reports 0 changes.
 */

type Change = {
  slug: string;
  code: string;
  changes: string[];
  before: { questionCount: number; published: boolean; archived: boolean };
  after: { questionCount: number; published: boolean; archived: boolean };
};

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const vendorSlug = req.nextUrl.searchParams.get('vendor');
  if (!vendorSlug) {
    return NextResponse.json({ error: 'missing required ?vendor=<slug> query param' }, { status: 400 });
  }
  const archiveSlugs = (req.nextUrl.searchParams.get('archive') || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  const vendor = await db.vendor.findUnique({ where: { slug: vendorSlug } });
  if (!vendor) {
    return NextResponse.json({ error: `vendor '${vendorSlug}' not found` }, { status: 404 });
  }

  const exams = await db.exam.findMany({
    where: { vendorId: vendor.id },
    select: { id: true, slug: true, code: true, questionCount: true, published: true, deletedAt: true }
  });

  const grp = await db.question.groupBy({
    by: ['examId'],
    where: { examId: { in: exams.map(e => e.id) }, status: 'PUBLISHED' },
    _count: { _all: true }
  });
  const pubCount = new Map<string, number>(grp.map(r => [r.examId, r._count._all]));

  const changed: Change[] = [];

  for (const e of exams) {
    const actual = pubCount.get(e.id) || 0;
    const archived = e.deletedAt != null;
    const changes: string[] = [];
    const data: { questionCount?: number; published?: boolean } = {};

    if (e.questionCount !== actual) {
      data.questionCount = actual;
      changes.push(`questionCount ${e.questionCount} -> ${actual}`);
    }
    if (archived && e.published) {
      data.published = false;
      changes.push('archived row: published true -> false');
    }
    if (changes.length === 0) continue;

    await db.exam.update({ where: { id: e.id }, data });
    changed.push({
      slug: e.slug,
      code: e.code,
      changes,
      before: { questionCount: e.questionCount, published: e.published, archived },
      after: {
        questionCount: data.questionCount ?? e.questionCount,
        published: data.published ?? e.published,
        archived
      }
    });
  }

  // Optional targeted archive.
  const archivedResults: { slug: string; status: string }[] = [];
  for (const slug of archiveSlugs) {
    const exam = await db.exam.findUnique({ where: { slug }, select: { id: true, deletedAt: true } });
    if (!exam) { archivedResults.push({ slug, status: 'not-found' }); continue; }
    if (exam.deletedAt != null) { archivedResults.push({ slug, status: 'already-archived' }); continue; }
    await db.exam.update({ where: { id: exam.id }, data: { deletedAt: new Date(), published: false } });
    archivedResults.push({ slug, status: 'archived' });
  }

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'catalog.finalize',
      targetType: 'Catalog',
      targetId: `${vendorSlug}-finalize-${new Date().toISOString().slice(0, 10)}`,
      metadata: { vendor: vendorSlug, changed, archivedResults } as any
    }
  });

  return NextResponse.json({
    ok: true,
    vendor: vendorSlug,
    examsScanned: exams.length,
    examsChanged: changed.length,
    changed,
    archived: archivedResults
  });
}
