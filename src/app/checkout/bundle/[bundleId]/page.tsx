import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { BundleCheckoutClient } from './bundle-checkout-client';
import { TestPaymentButton } from '@/components/test-payment-button';
import { Check, Lock, ShieldCheck, Ticket, Zap, ArrowLeft } from 'lucide-react';

export default async function BundleCheckoutPage({
  params,
  searchParams
}: {
  params: Promise<{ bundleId: string }>;
  searchParams: Promise<{ tier?: string }>;
}) {
  const { bundleId } = await params;
  const sp = await searchParams;
  const session = await auth();
  const tierQuery = sp.tier === 'VOUCHER' ? `?tier=VOUCHER` : '';
  // Encode the inner URL so its `?tier=…` doesn't break the outer `?next=…`
  // query-string parsing on the login page.
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(`/checkout/bundle/${bundleId}${tierQuery}`)}`);

  const bundle = await db.bundle.findUnique({
    where: { id: bundleId },
    include: { items: { orderBy: { position: 'asc' }, include: { exam: { include: { vendor: true } } } } }
  });
  if (!bundle || !bundle.published) notFound();

  const tier: 'PRACTICE' | 'VOUCHER' =
    sp.tier === 'VOUCHER' && bundle.priceVoucher != null ? 'VOUCHER' : 'PRACTICE';
  const amount = tier === 'VOUCHER' ? bundle.priceVoucher! : bundle.price;
  const displayedPractice = bundle.items.filter(i => i.tier === 'PRACTICE');
  const hasVoucher = tier === 'VOUCHER';
  const vendor = bundle.items[0]?.exam.vendor;
  const firstCode = bundle.items[0]?.exam.code.replace(/-P\d+$/, '');
  const totalQuestions = displayedPractice.reduce((sum, i) => sum + i.exam.questionCount, 0);

  return (
    <div className="container-app max-w-6xl py-10">
      {/* Back link */}
      <Link
        href={vendor ? `/practice-exams/${vendor.slug}/${bundle.slug}` : '/practice-exams'}
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
              {vendor && <span className="badge-brand">{vendor.name}</span>}
              {firstCode && <span className="badge">{firstCode}</span>}
              <span className={`badge ${hasVoucher ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}>
                {hasVoucher ? 'Exam Voucher tier' : 'Practice Exam tier'}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">{bundle.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{bundle.description}</p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">What you're getting</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {displayedPractice.map((item, i) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100">Practice Exam {i + 1}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.exam.questionCount} questions · {item.exam.durationMinutes} min · Practice + Exam modes</div>
                  </div>
                </li>
              ))}
              {hasVoucher && (
                <li className="flex items-start gap-3 rounded-md bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="flex-1">
                    <div className="font-medium text-emerald-900 dark:text-emerald-100">Real {firstCode || 'exam'} voucher</div>
                    <div className="text-xs text-emerald-800/80 dark:text-emerald-200/80">Delivered by email within 3–5 business days. Redeem with the official vendor for the real cert exam.</div>
                  </div>
                </li>
              )}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-xs dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {totalQuestions} questions across {displayedPractice.length} practice exam{displayedPractice.length === 1 ? '' : 's'}
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
                <dd className="font-medium">{formatPrice(amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Tax</dt>
                <dd className="text-slate-500 dark:text-slate-400">$0.00</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
              <span className="text-sm font-semibold">Total (USD)</span>
              <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatPrice(amount)}</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Pay securely
            </div>
            <Suspense fallback={<div className="rounded-md border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700">Loading PayPal…</div>}>
              <BundleCheckoutClient bundleId={bundle.id} tier={tier} />
            </Suspense>
            <TestPaymentButton kind="bundle" bundleId={bundle.id} tier={tier} />
          </div>

          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p>
                Encrypted payment via PayPal. We never see your card details.{' '}
                {hasVoucher && <>Voucher codes are emailed within <b>3–5 business days</b>; practice access unlocks immediately.</>}
                {!hasVoucher && <>Practice access unlocks immediately after payment.</>}
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
