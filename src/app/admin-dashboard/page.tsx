import Link from 'next/link';
import { db } from '@/lib/db';
import { formatPrice, tierLabel } from '@/lib/utils';
import { Users, BookOpen, ShoppingBag, FileQuestion, DollarSign, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const [
    userCount,
    examCount,
    publishedExams,
    questionCount,
    draftCount,
    orderCount,
    paidCount,
    paidSum,
    latestUsers,
    latestOrders,
    popularOrders
  ] = await Promise.all([
    db.user.count(),
    db.exam.count(),
    db.exam.count({ where: { published: true } }),
    db.question.count(),
    db.question.count({ where: { status: 'DRAFT' } }),
    db.order.count(),
    db.order.count({ where: { status: 'PAID' } }),
    db.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true }
    }),
    db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: true, exam: true, bundle: true }
    }),
    db.order.groupBy({
      by: ['examId'],
      where: { status: 'PAID', examId: { not: null } },
      _count: { examId: true },
      orderBy: { _count: { examId: 'desc' } },
      take: 5
    })
  ]);

  const popularExamIds = popularOrders.map((p) => p.examId!).filter(Boolean);
  const popularExams = popularExamIds.length
    ? await db.exam.findMany({
        where: { id: { in: popularExamIds } },
        include: { vendor: true }
      })
    : [];
  const popularExamMap = new Map(popularExams.map((e) => [e.id, e]));

  const kpis = [
    { label: 'Users', value: userCount.toLocaleString(), icon: Users, accent: 'blue', href: '/admin-dashboard/users' },
    {
      label: 'Practice exams',
      value: examCount.toLocaleString(),
      sub: `${publishedExams} published`,
      icon: BookOpen,
      accent: 'purple',
      href: '/admin-dashboard/exams'
    },
    {
      label: 'Orders',
      value: orderCount.toLocaleString(),
      sub: `${paidCount} paid`,
      icon: ShoppingBag,
      accent: 'emerald',
      href: '/admin-dashboard/orders'
    },
    {
      label: 'Revenue (paid)',
      value: formatPrice(paidSum._sum.amount || 0),
      icon: DollarSign,
      accent: 'amber',
      href: '/admin-dashboard/orders'
    },
    {
      label: 'Questions',
      value: questionCount.toLocaleString(),
      icon: FileQuestion,
      accent: 'slate',
      href: '/admin-dashboard/questions'
    },
    {
      label: 'Drafts pending',
      value: draftCount.toLocaleString(),
      icon: AlertCircle,
      accent: 'rose',
      href: '/admin-dashboard/questions'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Activity across the platform.</p>

      {/* KPI cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="card flex items-center gap-4 p-4 hover:shadow-md">
            <KpiIcon icon={k.icon} accent={k.accent as any} />
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.label}</div>
              <div className="text-2xl font-bold tracking-tight">{k.value}</div>
              {k.sub && <div className="text-xs text-slate-500">{k.sub}</div>}
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column lists */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest users</h2>
            <Link href="/admin-dashboard/users" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {latestUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.name || u.email}</div>
                  <div className="truncate text-xs text-slate-500">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {u.role === 'ADMIN' && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                      ADMIN
                    </span>
                  )}
                  {!u.active && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                      OFF
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{u.createdAt.toLocaleDateString()}</span>
                </div>
              </li>
            ))}
            {latestUsers.length === 0 && <li className="py-4 text-sm text-slate-500">No users yet.</li>}
          </ul>
        </section>

        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest orders</h2>
            <Link href="/admin-dashboard/orders" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {latestOrders.map((o) => {
              const product = o.bundle ? `${o.bundle.title} (bundle)` : o.exam?.title ?? '(unknown)';
              const tier = o.bundle ? 'Bundle' : o.tier ? tierLabel(o.tier) : '—';
              return (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{product}</div>
                    <div className="truncate text-xs text-slate-500">
                      {o.user.email} · {tier}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-semibold">{formatPrice(o.amount, o.currency)}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        o.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : o.status === 'REFUNDED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </li>
              );
            })}
            {latestOrders.length === 0 && <li className="py-4 text-sm text-slate-500">No orders yet.</li>}
          </ul>
        </section>
      </div>

      {/* Popular practice exams */}
      <section className="mt-8 card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Popular practice exams</h2>
          <Link href="/admin-dashboard/exams" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Manage exams →
          </Link>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {popularOrders.map((p, i) => {
            const exam = popularExamMap.get(p.examId!);
            if (!exam) return null;
            return (
              <li key={p.examId} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{exam.title}</div>
                    <div className="truncate text-xs text-slate-500">
                      {exam.vendor.name} · {exam.code}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">{p._count.examId} paid orders</div>
              </li>
            );
          })}
          {popularOrders.length === 0 && (
            <li className="py-4 text-sm text-slate-500">No paid orders yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function KpiIcon({
  icon: Icon,
  accent
}: {
  icon: any;
  accent: 'blue' | 'purple' | 'emerald' | 'amber' | 'slate' | 'rose';
}) {
  const accents: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
  };
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${accents[accent]}`}>
      <Icon className="h-6 w-6" />
    </div>
  );
}
