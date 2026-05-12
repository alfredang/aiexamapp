import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatPrice, priceForTier, tierLabel } from '@/lib/utils';
import { CheckoutClient } from './checkout-client';
import { TestPaymentButton } from '@/components/test-payment-button';
import { Check, Lock, ShieldCheck, Ticket, Zap, ArrowLeft, BookOpen, Hourglass } from 'lucide-react';
import type { Tier } from '@prisma/client';

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ examId: string }>; searchParams: Promise<{ tier?: string }> }) {
  const { examId } = await params;
  const sp = await searchParams;
  const tier = (sp.tier || 'PRACTICE') as Tier;
  if (!['PRACTICE', 'BUNDLE', 'VOUCHER'].includes(tier)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(`/checkout/${examId}?tier=${tier}`)}`);

  const exam = await db.exam.findUnique({ where: { id: examId }, include: { vendor: true } });
  if (!exam) notFound();
  const price = priceForTier(exam, tier);
  const isVoucher = tier === 'VOUCHER' || tier === 'BUNDLE';

  return (
    <div className="container-app max-w-6xl py-10">
      <Link
        href={`/practice-exams/${exam.vendor.slug}/${exam.slug}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exam details
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">Review your order and complete payment.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left: order summary */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="badge-brand">{exam.vendor.name}</span>
              <span className="badge">{exam.code}</span>
              <span className="badge">{exam.level}</span>
              <span className={`badge ${isVoucher ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}>
                {tierLabel(tier)}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">{exam.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{exam.description}</p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">What you're getting</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-100">
              <li className="flex items-start gap-2"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" /> Practice mode — immediate answers + full explanations after each question</li>
              <li className="flex items-start gap-2"><Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" /> Exam mode — {exam.durationMinutes}-minute timed simulation, like the real test</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" /> Mark questions for review and filter by status</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" /> Per-domain breakdown after every attempt</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" /> Lifetime access — no subscription, no expiry</li>
              {isVoucher && (
                <li className="mt-3 flex items-start gap-3 rounded-md bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="flex-1">
                    <div className="font-medium text-emerald-900 dark:text-emerald-100">Real {exam.code} voucher</div>
                    <div className="text-xs text-emerald-800/80 dark:text-emerald-200/80">Delivered by email within 3–5 business days. Redeem with the official vendor for the real cert exam.</div>
                  </div>
                </li>
              )}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-xs dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {exam.questionCount} questions
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Lifetime access
              </div>
            </div>
          </div>
        </div>

        {/* Right: payment + price */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h3 className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-300">Order total</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
                <dd className="font-medium">{formatPrice(price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Tax</dt>
                <dd className="text-slate-500 dark:text-slate-400">$0.00</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
              <span className="text-sm font-semibold">Total (USD)</span>
              <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatPrice(price)}</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Pay securely
            </div>
            <Suspense fallback={<div className="rounded-md border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700">Loading PayPal…</div>}>
              <CheckoutClient examId={exam.id} tier={tier} />
            </Suspense>
            <TestPaymentButton kind="exam" examId={exam.id} tier={tier as 'PRACTICE' | 'BUNDLE' | 'VOUCHER'} />
          </div>

          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p>
                Encrypted payment via PayPal. We never see your card details.{' '}
                {isVoucher && <>Voucher codes are emailed within <b>3–5 business days</b>; practice access unlocks immediately.</>}
                {!isVoucher && <>Practice access unlocks immediately after payment.</>}
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            By purchasing you agree to the original practice content terms and our refund policy.
          </p>
        </aside>
      </div>
    </div>
  );
}
