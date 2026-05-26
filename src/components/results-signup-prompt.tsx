'use client';
import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { TeaserGate } from './teaser-gate';

/**
 * Renders the signup gate on the /results/<attemptId> page when the
 * viewer is an anonymous teaser-taker who dismissed the in-attempt
 * modal (clicked "Continue without saving") and proceeded to submit
 * anyway. Reuses the TeaserGate component with results-context copy
 * and a back-to-results redirect after OTP verify.
 *
 * Flow:
 *   1. Component mounts → modal opens immediately (open = true).
 *   2. User can either:
 *        a. Submit email → OTP → on verify, /verify-otp redirects to
 *           /results/<attemptId> and they keep their result + now
 *           have an account that owns the attempt.
 *        b. Click "Continue without saving" → modal closes, page stays
 *           visible, persistent "Save my result" button appears so
 *           they can re-open if they change their mind.
 */
export function ResultsSignupPrompt({
  attemptId,
  examSlug,
  vendorSlug,
  count
}: {
  attemptId: string;
  examSlug: string;
  vendorSlug: string;
  count: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      {open && (
        <TeaserGate
          count={count}
          examSlug={examSlug}
          vendorSlug={vendorSlug}
          onClose={() => setOpen(false)}
          eyebrow="Save your result"
          title="Create an account to keep this attempt"
          description="Sign up so you can revisit this result, see your per-domain breakdown anytime, and unlock the rest of the practice exams. We'll send a 6-digit code to verify your email."
          primaryLabel="Create my account"
          nextUrl={`/results/${attemptId}`}
        />
      )}
      {!open && (
        <div className="card mt-6 flex flex-col items-start gap-2 border-blue-200 bg-blue-50/40 p-5 dark:border-blue-900 dark:bg-blue-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-0.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
              <Share2 className="h-3.5 w-3.5" />
              Don&apos;t lose this result
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Create a free account to keep this result and access the rest of the practice exams.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="btn-primary-grad shrink-0 text-sm"
          >
            Save my result
          </button>
        </div>
      )}
    </>
  );
}
