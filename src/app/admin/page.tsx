import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils';

export default async function AdminOverview() {
  const [users, vendors, exams, questions, drafts, orders, paidOrders, paidSum] = await Promise.all([
    db.user.count(),
    db.vendor.count(),
    db.exam.count(),
    db.question.count(),
    db.question.count({ where: { status: 'DRAFT' } }),
    db.order.count(),
    db.order.count({ where: { status: 'PAID' } }),
    db.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } })
  ]);
  const stats: [string, string | number][] = [
    ['Users', users],
    ['Vendors', vendors],
    ['Exams', exams],
    ['Questions', questions],
    ['Drafts', drafts],
    ['Orders', orders],
    ['Paid orders', paidOrders],
    ['Revenue (paid)', formatPrice(paidSum._sum.amount || 0)]
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="card p-4"><div className="text-xs text-slate-500">{k}</div><div className="text-2xl font-bold">{v}</div></div>
        ))}
      </div>
    </div>
  );
}
