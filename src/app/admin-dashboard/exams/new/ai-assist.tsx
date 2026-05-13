'use client';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

/**
 * AI Assist button for the Create Exam form. Reads vendor + code + title
 * from the form, calls /api/admin/exams/lookup, and writes the returned
 * fields back into the form inputs by `name=`. The form on the page is a
 * normal server-action <form>; we mutate the inputs in-place so the user
 * can still review/edit before submitting.
 */
export function CreateExamAiAssist({ vendorMap }: { vendorMap: Record<string, string> }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>('');
  const [ok, setOk] = useState<string>('');

  async function fill() {
    setBusy(true);
    setErr('');
    setOk('');
    try {
      const form = document.querySelector('form[data-create-exam]') as HTMLFormElement | null;
      if (!form) {
        setErr('Could not find the Create Exam form.');
        return;
      }
      const vendorId = (form.querySelector('[name="vendorId"]') as HTMLSelectElement | null)?.value || '';
      const code = (form.querySelector('[name="code"]') as HTMLInputElement | null)?.value || '';
      const title = (form.querySelector('[name="title"]') as HTMLInputElement | null)?.value || '';
      const vendor = vendorMap[vendorId];
      if (!vendor || !code || !title) {
        setErr('Pick a vendor and fill in code + title first.');
        return;
      }
      const res = await fetch('/api/admin/exams/lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ vendor, code, title })
      });
      const d = await res.json();
      if (!d.ok) {
        setErr(d.error || 'Lookup failed');
        return;
      }
      // Fill scalar fields
      const set = (name: string, value: any) => {
        const el = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
        if (el && value !== undefined && value !== null) el.value = String(value);
      };
      if (d.description) set('description', d.description);
      if (d.durationMinutes) set('durationMinutes', d.durationMinutes);
      if (d.passingScore) set('passingScore', d.passingScore);
      if (d.questionCount) set('questionCount', d.questionCount);
      // Domains: we'll surface via a hidden input the server action reads.
      if (d.domains) {
        let hidden = form.querySelector('[name="domainsJson"]') as HTMLInputElement | null;
        if (!hidden) {
          hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = 'domainsJson';
          form.appendChild(hidden);
        }
        hidden.value = JSON.stringify(d.domains);
      }
      const lines = [
        d.description ? '✓ Description' : null,
        d.durationMinutes ? `✓ Duration (${d.durationMinutes} min)` : null,
        d.passingScore ? `✓ Pass score (${d.passingScore}%)` : null,
        d.questionCount ? `✓ Question count (${d.questionCount})` : null,
        d.domains ? `✓ ${d.domains.length} domains with weights` : null,
        d.infoUrl ? `✓ Info URL: ${d.infoUrl}` : null
      ].filter(Boolean);
      setOk(`Pre-filled: ${lines.join(', ')}. Review and Save.`);
    } catch (e: any) {
      setErr(e?.message ?? 'Lookup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="md:col-span-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-medium">AI Assist — auto-fill from official vendor page</div>
          <div className="text-xs text-slate-500">
            After picking a vendor + code + title, click below. Firecrawl scrapes the canonical exam page; Claude returns description, duration, pass %, question count, and the domain blueprint.
          </div>
        </div>
        <button type="button" onClick={fill} disabled={busy} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-violet-600 px-3 text-[12px] font-medium text-white hover:bg-violet-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {busy ? 'Looking up…' : 'AI Assist'}
        </button>
      </div>
      {ok && <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300">{ok}</p>}
      {err && <p className="mt-2 text-[11px] text-red-600">{err}</p>}
    </div>
  );
}
