'use client';
import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';

export function ReviewFormModal({
  examId,
  examTitle,
  attemptId,
  existing,
  trigger,
  onSubmitted
}: {
  examId: string;
  examTitle: string;
  attemptId?: string;
  existing?: { rating: number; title: string | null; body: string | null; status: 'PENDING' | 'APPROVED' | 'REJECTED' } | null;
  trigger?: React.ReactNode;
  onSubmitted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  async function submit() {
    if (rating < 1) {
      setErr('Pick a star rating.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ examId, rating, title, body, attemptId })
      });
      const d = await r.json();
      if (!d.ok) {
        setErr(d.error === 'not_eligible' ? 'You need to purchase or attempt this exam first.' : (d.error || 'Failed to submit.'));
        return;
      }
      setOk(true);
      onSubmitted?.();
      setTimeout(() => setOpen(false), 1200);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to submit.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex">
        {trigger ?? <span className="btn-outline">Write a review</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="font-semibold">Review {examTitle}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reviews are moderated before they appear publicly.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>

            {existing?.status === 'PENDING' && (
              <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                Your previous review is pending moderation. Editing here will keep it pending.
              </div>
            )}

            <div className="mb-3">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-200">Rating</div>
              <div className="mt-1 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setRating(n)}
                    className="p-0.5"
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`h-7 w-7 ${(hover || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="input-sm mt-1 w-full"
              placeholder="A short headline"
            />

            <label className="mt-3 block text-xs font-medium text-slate-700 dark:text-slate-200">Your review (optional)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="What did you like or wish was different?"
            />

            {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
            {ok && <p className="mt-2 text-xs text-emerald-600">Submitted — pending moderation.</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
              <button type="button" disabled={busy} onClick={submit} className="btn-primary inline-flex items-center gap-1.5">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
