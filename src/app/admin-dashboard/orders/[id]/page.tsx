import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fulfillOrder } from '@/lib/fulfill';
import { sendTemplated } from '@/lib/email/templates';
import { formatPrice, tierLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function markPaid(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  const reference = String(formData.get('reference') || '').trim() || null;
  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.status === 'PAID') return;
  await fulfillOrder(order.id, { manualConfirm: true, reference, byAdminId: user.id }, reference || order.id);
  await db.adminLog.create({
    data: { adminId: user.id, action: 'order.mark-paid', targetType: 'Order', targetId: order.id, metadata: { reference, provider: order.provider } }
  });
  revalidatePath(`/admin-dashboard/orders/${id}`);
}

async function refundOrder(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  const reason = String(formData.get('reason') || '').trim() || null;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return;

  let refundRef: string | null = null;
  let refundError: string | null = null;
  try {
    if (order.provider === 'PAYPAL') {
      const captureId = order.providerCaptureId || order.paypalCaptureId;
      if (!captureId) throw new Error('No PayPal capture id on order');
      const { refundCapture } = await import('@/lib/paypal');
      const result = await refundCapture(captureId, order.amount, order.currency, reason ?? undefined);
      refundRef = result.id;
    } else if (order.provider === 'HITPAY') {
      const paymentId = order.providerCaptureId;
      if (!paymentId) throw new Error('No HitPay payment id on order');
      const { refundPayment } = await import('@/lib/payments/hitpay');
      const result = await refundPayment(paymentId, order.amount);
      refundRef = result.id;
    }
    // PayNow / TEST: no provider call — recorded as a manual refund.
  } catch (e: any) {
    refundError = String(e?.message ?? e);
    // Do not flip status if the provider call failed; let the admin retry or
    // record a manual refund via a follow-up action.
    await db.adminLog.create({
      data: { adminId: user.id, action: 'order.refund-failed', targetType: 'Order', targetId: order.id, metadata: { error: refundError, provider: order.provider } }
    });
    revalidatePath(`/admin-dashboard/orders/${id}`);
    return;
  }

  await db.order.update({
    where: { id },
    data: {
      status: 'REFUNDED',
      refundedAt: new Date(),
      refundReason: reason,
      refundAmount: order.amount,
      refundRef
    }
  });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'order.refund', targetType: 'Order', targetId: order.id, metadata: { reason, provider: order.provider, refundRef } }
  });
  revalidatePath(`/admin-dashboard/orders/${id}`);
}

async function resendConfirmation(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  const order = await db.order.findUnique({
    where: { id },
    include: { user: true, exam: true, bundle: true }
  });
  if (!order || order.status !== 'PAID') return;
  await sendTemplated(
    'ORDER_CONFIRMATION',
    order.user.email,
    {
      productName: order.bundle?.title ?? order.exam?.title ?? '',
      tierLabel: order.bundle ? 'Bundle' : (order.tier ? tierLabel(order.tier) : ''),
      paymentMethod: order.provider,
      voucherPending: order.tier === 'VOUCHER' || order.tier === 'BUNDLE' || !!order.bundleId,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      user: { name: order.user.name, email: order.user.email }
    }
  );
  await db.adminLog.create({
    data: { adminId: user.id, action: 'order.resend-confirmation', targetType: 'Order', targetId: order.id }
  });
  revalidatePath(`/admin-dashboard/orders/${id}`);
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: true,
      exam: { include: { vendor: true } },
      bundle: { include: { items: { include: { exam: true } } } },
      billingAddress: true
    }
  });
  if (!order) return notFound();

  const entitlements = await db.entitlement.findMany({
    where: { userId: order.userId, ...(order.examId ? { examId: order.examId } : {}) },
    include: { exam: true, delivery: true },
    orderBy: { grantedAt: 'desc' }
  });

  return (
    <div>
      <div className="mb-2 text-sm">
        <Link href="/admin-dashboard/orders" className="text-slate-500 hover:underline">← All orders</Link>
      </div>
      <h1 className="text-2xl font-bold">Order <code className="text-base">{order.id}</code></h1>
      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
        <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{order.provider}</span>
        <span className={`badge ${
          order.status === 'PAID' ? 'bg-green-100 text-green-800' :
          order.status === 'FAILED' ? 'bg-red-100 text-red-800' :
          order.status === 'REFUNDED' ? 'bg-amber-100 text-amber-800' : ''
        }`}>{order.status}</span>
        <span>· created {order.createdAt.toLocaleString()}</span>
        {order.capturedAt && <span>· captured {order.capturedAt.toLocaleString()}</span>}
        {order.refundedAt && <span>· refunded {order.refundedAt.toLocaleString()}</span>}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Customer</h2>
          <p className="mt-2">
            <Link href={`/admin-dashboard/users/${order.user.id}`} className="text-blue-600 hover:underline">
              {order.user.email}
            </Link>
            {order.user.name && <span className="ml-1 text-slate-500">— {order.user.name}</span>}
          </p>
          <p className="mt-1 text-xs text-slate-500">user.id: <code>{order.user.id}</code></p>
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Product</h2>
          {order.bundle ? (
            <>
              <p className="mt-2 font-medium">{order.bundle.title} <span className="text-xs text-slate-500">(bundle)</span></p>
              <ul className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {order.bundle.items.map((i) => (
                  <li key={i.id}>• {i.exam.code} — {i.exam.title} <span className="text-xs text-slate-500">[{i.tier}]</span></li>
                ))}
              </ul>
            </>
          ) : order.exam ? (
            <>
              <p className="mt-2 font-medium">{order.exam.title}</p>
              <p className="text-xs text-slate-500">{order.exam.vendor.name} · {order.exam.code}</p>
              <p className="mt-1 text-sm">Tier: {order.tier ? tierLabel(order.tier) : '—'}</p>
            </>
          ) : (
            <p className="mt-2 text-slate-500">No product attached.</p>
          )}
          <p className="mt-2 text-2xl font-semibold">{formatPrice(order.amount, order.currency)}</p>
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Billing address</h2>
          {order.billingAddress ? (
            <address className="mt-2 text-sm not-italic">
              {order.billingAddress.fullName}<br />
              {order.billingAddress.company && <>{order.billingAddress.company}<br /></>}
              {order.billingAddress.line1}<br />
              {order.billingAddress.line2 && <>{order.billingAddress.line2}<br /></>}
              {order.billingAddress.city}{order.billingAddress.state ? `, ${order.billingAddress.state}` : ''} {order.billingAddress.postalCode}<br />
              {order.billingAddress.country}
              {order.billingAddress.phone && <><br />{order.billingAddress.phone}</>}
            </address>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No billing address on this order.</p>
          )}
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Provider details</h2>
          <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
            <dt className="text-slate-500">Provider order id</dt>
            <dd><code>{order.providerOrderId || order.paypalOrderId || '—'}</code></dd>
            <dt className="text-slate-500">Provider capture id</dt>
            <dd><code>{order.providerCaptureId || order.paypalCaptureId || '—'}</code></dd>
          </dl>
          {(order.providerPayload || order.paypalPayload) && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-slate-500">Raw payload</summary>
              <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-100 p-2 dark:bg-slate-900">
                {JSON.stringify(order.providerPayload || order.paypalPayload, null, 2)}
              </pre>
            </details>
          )}
        </section>

        <section className="card p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Entitlements granted</h2>
          {entitlements.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">None yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              {entitlements.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{e.exam.code} — {e.exam.title}</div>
                    <div className="text-xs text-slate-500">
                      tier {e.tier} · granted {e.grantedAt.toLocaleString()}
                      {e.voucher && <> · voucher <code>{e.voucher}</code></>}
                    </div>
                  </div>
                  {e.delivery && (
                    <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      delivery {e.delivery.status} {e.delivery.scheduledFor.toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Actions</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {order.status === 'PENDING' && (
              <form action={markPaid} className="flex items-center gap-2">
                <input type="hidden" name="id" value={order.id} />
                <input type="text" name="reference" placeholder="External ref" className="input w-44 text-sm" />
                <button className="btn-primary-grad text-sm">Mark paid</button>
              </form>
            )}
            {order.status === 'PAID' && (
              <>
                <form action={refundOrder} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="text" name="reason" placeholder="Refund reason" className="input w-56 text-sm" />
                  <button className="btn-outline text-sm">Refund</button>
                </form>
                <form action={resendConfirmation}>
                  <input type="hidden" name="id" value={order.id} />
                  <button className="btn-ghost text-sm">Resend confirmation email</button>
                </form>
              </>
            )}
          </div>
          {order.refundReason && (
            <p className="mt-3 text-xs text-slate-500">Refund reason: {order.refundReason}</p>
          )}
          {order.refundRef && (
            <p className="text-xs text-slate-500">Refund ref: <code>{order.refundRef}</code></p>
          )}
        </section>
      </div>
    </div>
  );
}
