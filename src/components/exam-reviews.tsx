import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { canUserReview, getExamRatingSummary } from '@/lib/reviews';
import { RatingStars } from './rating-stars';
import { ReviewFormModal } from './review-form-modal';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export async function ExamReviews({ examId, examTitle }: { examId: string; examTitle: string }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  const [summary, reviewsRaw, eligible, ownReview] = await Promise.all([
    getExamRatingSummary(examId),
    db.review.findMany({
      where: { examId, status: 'APPROVED', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, rating: true, title: true, body: true, createdAt: true, attemptId: true,
        user: { select: { name: true, email: true } }
      }
    }),
    userId ? canUserReview(userId, examId) : Promise.resolve(false),
    userId
      ? db.review.findUnique({
          where: { userId_examId: { userId, examId } },
          select: { rating: true, title: true, body: true, status: true }
        })
      : Promise.resolve(null)
  ]);

  const reviews = reviewsRaw.map((r) => ({
    ...r,
    authorName: r.user.name || maskEmail(r.user.email)
  }));

  return (
    <section className="mt-8 card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Student reviews</h2>
          {summary.count > 0 ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-200">
              <RatingStars value={summary.average} />
              <span className="font-semibold">{summary.average.toFixed(1)}</span>
              <span className="text-slate-500 dark:text-slate-300">({summary.count} review{summary.count === 1 ? '' : 's'})</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">No reviews yet — be the first to share your experience.</p>
          )}
        </div>

        {userId && eligible ? (
          <ReviewFormModal
            examId={examId}
            examTitle={examTitle}
            existing={ownReview as any}
            trigger={<span className="btn-outline">{ownReview ? 'Edit your review' : 'Write a review'}</span>}
          />
        ) : !userId ? (
          <Link href="/login" className="btn-outline">Sign in to review</Link>
        ) : null}
      </div>

      {reviews.length > 0 && (
        <ul className="mt-5 divide-y divide-slate-200 dark:divide-slate-700">
          {reviews.map((r) => (
            <li key={r.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 text-sm">
                <RatingStars value={r.rating} />
                <span className="font-medium">{r.authorName}</span>
                {r.attemptId && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <ShieldCheck className="h-3 w-3" /> Verified attempt
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.title && <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{r.title}</div>}
              {r.body && <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-200">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function maskEmail(e: string): string {
  const [u, d] = e.split('@');
  if (!u || !d) return 'Anonymous';
  return `${u.slice(0, 2)}…@${d}`;
}
