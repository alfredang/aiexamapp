import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatPrice, priceForTier, tierLabel } from '@/lib/utils';
import { CheckoutClient } from './checkout-client';
import type { Tier } from '@prisma/client';

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ examId: string }>; searchParams: Promise<{ tier?: string }> }) {
  const { examId } = await params;
  const sp = await searchParams;
  const tier = (sp.tier || 'PRACTICE') as Tier;
  if (!['PRACTICE', 'BUNDLE', 'VOUCHER'].includes(tier)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/login?next=/checkout/${examId}?tier=${tier}`);

  const exam = await db.exam.findUnique({ where: { id: examId }, include: { vendor: true } });
  if (!exam) notFound();
  const price = priceForTier(exam, tier);

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="card mt-4 p-6">
        <div className="text-xs text-slate-500">{exam.vendor.name} · {exam.code}</div>
        <div className="font-semibold">{exam.title}</div>
        <div className="mt-1 text-sm">{tierLabel(tier)}</div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-slate-500">Total</span>
          <span className="text-2xl font-bold text-blue-700">{formatPrice(price)}</span>
        </div>
      </div>
      <div className="mt-6">
        <Suspense fallback={<div>Loading PayPal…</div>}>
          <CheckoutClient examId={exam.id} tier={tier} />
        </Suspense>
      </div>
      <p className="mt-4 text-xs text-slate-500">By purchasing you agree that all questions are original practice content for educational use.</p>
    </div>
  );
}
