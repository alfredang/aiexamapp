import { db } from '@/lib/db';
import { formatPrice, tierLabel } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

async function refund(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await db.order.update({ where: { id }, data: { status: 'REFUNDED' } });
  // Real refund would call PayPal /v2/payments/captures/{capture_id}/refund here.
  revalidatePath('/admin/orders');
}

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    include: { user: true, exam: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="card mt-4 divide-y divide-slate-200">
        {orders.map(o => (
          <div key={o.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{o.user.email} · {o.exam.title}</div>
              <div className="text-xs text-slate-500">{tierLabel(o.tier)} · {o.createdAt.toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-semibold">{formatPrice(o.amount, o.currency)}</div>
              <span className={`badge ${o.status === 'PAID' ? 'bg-green-100 text-green-800' : o.status === 'FAILED' ? 'bg-red-100 text-red-800' : o.status === 'REFUNDED' ? 'bg-amber-100 text-amber-800' : ''}`}>{o.status}</span>
              {o.status === 'PAID' && (
                <form action={refund}><input type="hidden" name="id" value={o.id} /><button className="btn-outline text-xs">Mark refunded</button></form>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="p-4 text-slate-500">No orders yet.</p>}
      </div>
    </div>
  );
}
