import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { BundleCheckoutClient } from './bundle-checkout-client';

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
  if (!session?.user) redirect(`/login?next=/checkout/bundle/${bundleId}${tierQuery}`);

  const bundle = await db.bundle.findUnique({
    where: { id: bundleId },
    include: { items: { orderBy: { position: 'asc' }, include: { exam: true } } }
  });
  if (!bundle || !bundle.published) notFound();

  const tier: 'PRACTICE' | 'VOUCHER' =
    sp.tier === 'VOUCHER' && bundle.priceVoucher != null ? 'VOUCHER' : 'PRACTICE';
  const amount = tier === 'VOUCHER' ? bundle.priceVoucher! : bundle.price;
  const displayedItems =
    tier === 'VOUCHER' ? bundle.items : bundle.items.filter(i => i.tier === 'PRACTICE');

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="card mt-4 p-6">
        <div className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
          {tier === 'VOUCHER' ? 'Exam Voucher (practice exams included)' : 'Practice Exam'}
        </div>
        <div className="mt-1 font-semibold">{bundle.title}</div>
        <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {displayedItems.map(item => (
            <li key={item.id}>
              • {item.exam.code} — {item.tier === 'VOUCHER' ? 'real exam voucher' : 'practice access'}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-slate-500 dark:text-slate-400">Total</span>
          <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatPrice(amount)}</span>
        </div>
      </div>
      <div className="mt-6">
        <Suspense fallback={<div>Loading PayPal…</div>}>
          <BundleCheckoutClient bundleId={bundle.id} tier={tier} />
        </Suspense>
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">By purchasing you agree that all questions are original practice content for educational use.</p>
    </div>
  );
}
