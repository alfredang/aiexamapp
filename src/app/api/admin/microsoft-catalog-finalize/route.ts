import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint for the final cosmetic cleanup of the Microsoft
 * catalog, after microsoft-catalog-repair handled the urgent items
 * (2026-05-22). Two operations across every `microsoft` vendor exam:
 *
 * 1. SYNC questionCount — set exam.questionCount to the actual count of
 *    PUBLISHED questions. Many legacy exams carry a stale low value
 *    (e.g. 22, 25, 40) that mis-renders the "N questions" label on the
 *    exam card.
 *
 * 2. FIX archived/published inconsistency — an exam with deletedAt set
 *    (archived) but published=true is in an inconsistent state. Force
 *    published=false on those rows.
 *
 * Applies directly (no dry-run) — both operations are cosmetic, low-risk,
 * and trivially reversible. Returns full before/after per changed row
 * and records a single AdminLog entry. Idempotent: a second run reports
 * everything as already-correct.
 */

type Change = {
  slug: string;
  code: string;
  changes: string[];
  before: { questionCount: number; published: boolean; archived: boolean };
  after: { questionCount: number; published: boolean; archived: boolean };
};

export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const vendor = await db.vendor.findUnique({ where: { slug: 'microsoft' } });
  if (!vendor) {
    return NextResponse.json({ error: 'microsoft vendor not found' }, { status: 404 });
  }

  const exams = await db.exam.findMany({
    where: { vendorId: vendor.id },
    select: { id: true, slug: true, code: true, questionCount: true, published: true, deletedAt: true }
  });

  // Actual PUBLISHED question count per exam.
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

    // 1. questionCount sync
    if (e.questionCount !== actual) {
      data.questionCount = actual;
      changes.push(`questionCount ${e.questionCount} -> ${actual}`);
    }

    // 2. archived + published=true inconsistency
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

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'catalog.microsoft_finalize',
      targetType: 'Catalog',
      targetId: 'microsoft-finalize-2026-05-22',
      metadata: { changed } as any
    }
  });

  return NextResponse.json({
    ok: true,
    examsScanned: exams.length,
    examsChanged: changed.length,
    changed
  });
}
