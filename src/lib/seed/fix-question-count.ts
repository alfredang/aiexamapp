/**
 * State-hygiene fix: the stored `Exam.questionCount` field (shown on catalog
 * cards) had drifted from the actual number of PUBLISHED questions on several
 * exams — catalog-health flagged DP-300-P2 (59 vs 60) and all six google
 * PROFESSIONAL-ML-ENGINEER variants (fields 10/10/11/50/47/31 vs actual
 * 37/37/38/60/60/60), among others.
 *
 * Reconciles the field to reality, mirroring the catalog-health flag exactly:
 * for every NON-archived exam that has >=1 published question and whose stored
 * questionCount disagrees, set questionCount = actual published count. Exams
 * with 0 published questions (drafts in progress) are left untouched so we
 * never zero out an in-flight exam.
 *
 * Non-destructive (only the integer field), idempotent — re-running is a no-op.
 * Returns the per-exam before/after for everything it changed.
 */
import type { PrismaClient } from '@prisma/client';

export async function fixQuestionCount(db: PrismaClient) {
  const exams = await db.exam.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, code: true, questionCount: true }
  });

  const grp = await db.question.groupBy({
    by: ['examId'],
    where: { examId: { in: exams.map((e) => e.id) }, status: 'PUBLISHED' },
    _count: { _all: true }
  });
  const pub = new Map(grp.map((r) => [r.examId, r._count._all]));

  const changes: { slug: string; code: string; from: number; to: number }[] = [];
  for (const e of exams) {
    const actual = pub.get(e.id) || 0;
    if (actual > 0 && e.questionCount !== actual) {
      await db.exam.update({ where: { id: e.id }, data: { questionCount: actual } });
      changes.push({ slug: e.slug, code: e.code, from: e.questionCount, to: actual });
    }
  }

  return { fixed: changes.length, changes };
}
