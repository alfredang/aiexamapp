import Link from 'next/link';
import { db } from '@/lib/db';
import { formatPrice, tierLabel } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { fulfillOrder } from '@/lib/fulfill';
import { auth } from '@/lib/auth';
import type { OrderStatus, PaymentProvider, Prisma } from '@prisma/client';

async function refund(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await db.order.update({ where: { id }, data: { status: 'REFUNDED', refundedAt: new Date() } });
  revalidatePath('/admin-dashboard/orders');
}

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
  revalidatePath('/admin-dashboard/orders');
}

const PAGE_SIZE = 25;

type SearchParams = Promise<{ q?: string; status?: string; provider?: string; page?: string }>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const status = sp.status as OrderStatus | undefined;
  const provider = sp.provider as PaymentProvider | undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.OrderWhereInput = {};
  if (status && ['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(status)) where.status = status;
  if (provider && ['PAYPAL', 'PAYNOW', 'HITPAY', 'TEST'].includes(provider)) where.provider = provider;
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { user: { email: { contains: q, mode: 'insensitive' } } }
    ];
  }

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: { user: true, exam: true, bundle: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    })
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  function qs(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    if (provider) p.set('provider', provider);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) p.set(k, v); else p.delete(k);
    }
    const s = p.toString();
    return s ? `?${s}` : '';
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-sm text-slate-500">{total} order{total === 1 ? '' : 's'} total.</p>

      <form method="get" className="card mt-4 grid gap-3 p-4 sm:grid-cols-4">
        <input name="q" defaultValue={q} placeholder="Search email or order id…" className="input sm:col-span-2" />
        <select name="status" defaultValue={status ?? ''} className="input">
          <option value="">All statuses</option>
          <option>PENDING</option>
          <option>PAID</option>
          <option>FAILED</option>
          <option>REFUNDED</option>
        </select>
        <select name="provider" defaultValue={provider ?? ''} className="input">
          <option value="">All providers</option>
          <option>PAYPAL</option>
          <option>HITPAY</option>
          <option>PAYNOW</option>
          <option>TEST</option>
        </select>
        <div className="sm:col-span-4 flex gap-2">
          <button type="submit" className="btn-primary">Apply</button>
          <Link href="/admin-dashboard/orders" className="btn-ghost">Reset</Link>
        </div>
      </form>

      <div className="card mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {orders.map((o) => {
          const productLabel = o.bundle ? `${o.bundle.title} (bundle)` : o.exam?.title ?? '(unknown)';
          const tierLabelText = o.bundle ? 'Bundle' : (o.tier ? tierLabel(o.tier) : '—');
          return (
            <div key={o.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  <Link href={`/admin-dashboard/orders/${o.id}`} className="hover:underline">
                    {o.user.email}
                  </Link>{' '}· {productLabel}
                </div>
                <div className="text-xs text-slate-500">
                  <code className="mr-2">{o.id.slice(0, 8)}</code>
                  {tierLabelText} · {o.createdAt.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-semibold">{formatPrice(o.amount, o.currency)}</div>
                <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{o.provider}</span>
                <span
                  className={`badge ${
                    o.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    o.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    o.status === 'REFUNDED' ? 'bg-amber-100 text-amber-800' : ''
                  }`}
                >
                  {o.status}
                </span>
                {o.status === 'PENDING' && o.provider === 'PAYNOW' && (
                  <form action={markPaid} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={o.id} />
                    <input type="text" name="reference" placeholder="Bank ref" className="input w-32 text-xs" />
                    <button className="btn-primary-grad text-xs">Mark paid</button>
                  </form>
                )}
                {o.status === 'PAID' && (
                  <form action={refund}>
                    <input type="hidden" name="id" value={o.id} />
                    <button className="btn-outline text-xs">Mark refunded</button>
                  </form>
                )}
                <Link href={`/admin-dashboard/orders/${o.id}`} className="text-xs text-blue-600 hover:underline">View →</Link>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="p-4 text-slate-500">No orders match the filters.</p>}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <div>Page {page} of {pages}</div>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin-dashboard/orders${qs({ page: String(page - 1) })}`} className="btn-ghost">← Prev</Link>}
            {page < pages && <Link href={`/admin-dashboard/orders${qs({ page: String(page + 1) })}`} className="btn-ghost">Next →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
