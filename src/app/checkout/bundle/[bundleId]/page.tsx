import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { BundleCheckoutClient } from './bundle-checkout-client';

export default async function BundleCheckoutPage({ params }: { params: Promise<{ bundleId: string }> }) {
  const { bundleId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?next=/checkout/bundle/${bundleId}`);

  const bundle = await db.bundle.findUnique({
    where: { id: bundleId },
    include: { items: { orderBy: { position: 'asc' }, include: { exam: true } } }
  });
  if (!bundle || !bundle.published) notFound();

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold">Checkout · Bundle</h1>
      <div className="card mt-4 p-6">
        <div className="text-xs font-semibold uppercase text-purple-700">Bundle</div>
        <div className="mt-1 font-semibold">{bundle.title}</div>
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {bundle.items.map(item => (
            <li key={item.id}>
              • {item.exam.code} — {item.tier === 'VOUCHER' ? 'real exam voucher' : 'practice access'}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-slate-500">Total</span>
          <span className="text-2xl font-bold text-blue-700">{formatPrice(bundle.price)}</span>
        </div>
      </div>
      <div className="mt-6">
        <Suspense fallback={<div>Loading PayPal…</div>}>
          <BundleCheckoutClient bundleId={bundle.id} />
        </Suspense>
      </div>
      <p className="mt-4 text-xs text-slate-500">By purchasing you agree that all questions are original practice content for educational use.</p>
    </div>
  );
}
