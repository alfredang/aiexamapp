'use client';
import { ShareButtons } from './share-buttons';
import { Share2 } from 'lucide-react';

export function ShareScore({
  attemptId,
  examTitle,
  score,
  passed
}: {
  attemptId: string;
  examTitle: string;
  score: number;
  passed: boolean;
}) {
  // Compute origin client-side so links use the live host.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/results/${attemptId}/share`;
  const text = passed
    ? `I just scored ${score}% on ${examTitle} on ExamNova!`
    : `I'm preparing for ${examTitle} on ExamNova — scored ${score}% so far.`;

  return (
    <div className="mt-6 card p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Share2 className="h-4 w-4 text-blue-600" />
        Share your result
      </div>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-300">
        Brag a little — your followers might be studying for the same exam.
      </p>
      <ShareButtons url={url} text={text} />
    </div>
  );
}
