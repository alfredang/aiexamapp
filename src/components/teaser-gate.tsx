'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TeaserGate({ count, examSlug, vendorSlug, onClose }: { count: number; examSlug: string; vendorSlug: string; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/otp/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, purpose: 'TEASER_GATE' }) });
    setBusy(false);
    if (!r.ok) { setErr((await r.json()).error || 'Could not send code'); return; }
    setStep('otp');
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/otp/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, code, purpose: 'TEASER_GATE' }) });
    if (!r.ok) { setBusy(false); setErr((await r.json()).error || 'Verification failed'); return; }
    // Now send a LOGIN OTP and ship the user to /verify-otp to complete sign-in
    await fetch('/api/otp/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, purpose: 'LOGIN' }) });
    router.push(`/verify-otp?email=${encodeURIComponent(email)}&purpose=LOGIN&next=/practice-exams/${vendorSlug}/${examSlug}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-2 text-xs font-semibold uppercase text-blue-700">Great progress!</div>
        <h2 className="text-xl font-bold">You've completed {count} questions</h2>
        <p className="mt-1 text-sm text-slate-600">
          {count >= 30
            ? "You've finished the free teaser. Save your progress and unlock the full exam."
            : 'Save your progress and continue. We will send you a 6-digit code.'}
        </p>

        {step === 'email' && (
          <form onSubmit={send} className="mt-5 space-y-3">
            <input className="input" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="btn-primary-grad w-full" disabled={busy}>{busy ? 'Sending…' : 'Save my progress'}</button>
            <button type="button" onClick={onClose} className="btn-ghost w-full text-sm">Continue without saving</button>
          </form>
        )}
        {step === 'otp' && (
          <form onSubmit={verify} className="mt-5 space-y-3">
            <p className="text-sm text-slate-600">We sent a 6-digit code to <b>{email}</b>.</p>
            <input className="input tracking-[0.4em] text-center" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="btn-primary-grad w-full" disabled={busy}>{busy ? 'Verifying…' : 'Verify and continue'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
