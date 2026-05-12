import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatPrice, tierLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      entitlements: {
        include: { exam: { include: { vendor: true } }, delivery: true },
        orderBy: { grantedAt: 'desc' }
      },
      orders: {
        include: { exam: true, bundle: true },
        orderBy: { createdAt: 'desc' }
      },
      billingAddresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }
    }
  });
  if (!user) return notFound();

  const attemptCount = await db.attempt.count({ where: { userId: id } });

  return (
    <div>
      <div className="mb-2 text-sm">
        <Link href="/admin-dashboard/users" className="text-slate-500 hover:underline">← All users</Link>
      </div>
      <h1 className="text-2xl font-bold">{user.email}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {user.name && <span>{user.name}</span>}
        <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{user.role}</span>
        {!user.active && <span className="badge bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">DEACTIVATED</span>}
        {user.nationality && <span>· {user.nationality}</span>}
        <span>· joined {user.createdAt.toLocaleString()}</span>
        <span>· {attemptCount} attempt{attemptCount === 1 ? '' : 's'}</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Entitlements ({user.entitlements.length})</h2>
          {user.entitlements.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">None.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              {user.entitlements.map((e) => (
                <li key={e.id} className="py-2">
                  <div className="font-medium">{e.exam.vendor.name} · {e.exam.code}</div>
                  <div className="text-xs text-slate-500">
                    tier <b>{e.tier}</b> · granted {e.grantedAt.toLocaleString()}
                    {e.voucher && <> · voucher <code>{e.voucher}</code></>}
                  </div>
                  {e.delivery && (
                    <div className="mt-1 text-xs">
                      Delivery: <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{e.delivery.status}</span>
                      {' '}scheduled {e.delivery.scheduledFor.toLocaleString()}
                      {e.delivery.lastError && <span className="ml-2 text-rose-600">{e.delivery.lastError}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Billing addresses ({user.billingAddresses.length})</h2>
          {user.billingAddresses.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">None.</p>
          ) : (
            <ul className="mt-2 space-y-3 text-sm">
              {user.billingAddresses.map((a) => (
                <li key={a.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{a.fullName}{a.company ? ` — ${a.company}` : ''}</div>
                    {a.isDefault && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">DEFAULT</span>}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}{a.state ? `, ${a.state}` : ''} {a.postalCode}, {a.country}
                    {a.phone ? ` · ${a.phone}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Orders ({user.orders.length})</h2>
          {user.orders.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">None.</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Order</th>
                  <th>Product</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {user.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2"><code className="text-xs">{o.id.slice(0, 8)}</code><br /><span className="text-xs text-slate-500">{o.createdAt.toLocaleDateString()}</span></td>
                    <td>{o.bundle?.title ?? o.exam?.title ?? '—'}{o.tier && ` · ${tierLabel(o.tier)}`}</td>
                    <td><span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{o.provider}</span></td>
                    <td>
                      <span className={`badge ${
                        o.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        o.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        o.status === 'REFUNDED' ? 'bg-amber-100 text-amber-800' : ''
                      }`}>{o.status}</span>
                    </td>
                    <td className="text-right">{formatPrice(o.amount, o.currency)}</td>
                    <td className="text-right"><Link href={`/admin-dashboard/orders/${o.id}`} className="text-xs text-blue-600 hover:underline">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
