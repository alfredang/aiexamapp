import { z } from 'zod';
import { db } from '@/lib/db';

export const ReviewInputSchema = z.object({
  examId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal('')),
  body: z.string().trim().max(2000).optional().or(z.literal('')),
  attemptId: z.string().optional().or(z.literal(''))
});

export type ReviewInput = z.infer<typeof ReviewInputSchema>;

/**
 * A user may leave a review on an exam if they hold any Entitlement for it
 * OR have at least one submitted Attempt against it.
 */
export async function canUserReview(userId: string, examId: string): Promise<boolean> {
  const [ent, att] = await Promise.all([
    db.entitlement.count({ where: { userId, examId } }),
    db.attempt.count({ where: { userId, examId, submittedAt: { not: null } } })
  ]);
  return ent > 0 || att > 0;
}

export type RatingSummary = {
  average: number;   // 0..5, rounded to 1 dp
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export async function getExamRatingSummary(examId: string): Promise<RatingSummary> {
  const rows = await db.review.groupBy({
    by: ['rating'],
    where: { examId, status: 'APPROVED', deletedAt: null },
    _count: { _all: true }
  });
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingSummary['distribution'];
  let total = 0;
  let count = 0;
  for (const r of rows) {
    const k = r.rating as 1 | 2 | 3 | 4 | 5;
    distribution[k] = r._count._all;
    count += r._count._all;
    total += r.rating * r._count._all;
  }
  const average = count === 0 ? 0 : Math.round((total / count) * 10) / 10;
  return { average, count, distribution };
}

/** Batched rating summaries for many exams in one query — used on catalog pages. */
export async function getRatingSummariesForExams(examIds: string[]): Promise<Record<string, { average: number; count: number }>> {
  if (examIds.length === 0) return {};
  const rows = await db.review.groupBy({
    by: ['examId', 'rating'],
    where: { examId: { in: examIds }, status: 'APPROVED', deletedAt: null },
    _count: { _all: true }
  });
  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of rows) {
    const a = (acc[r.examId] ||= { sum: 0, count: 0 });
    a.sum += r.rating * r._count._all;
    a.count += r._count._all;
  }
  const out: Record<string, { average: number; count: number }> = {};
  for (const [examId, v] of Object.entries(acc)) {
    out[examId] = { average: Math.round((v.sum / v.count) * 10) / 10, count: v.count };
  }
  return out;
}
