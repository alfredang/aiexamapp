import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { auth, SUPER_ADMIN_EMAIL, isSuperAdmin } from '@/lib/auth';

async function grantAccess(formData: FormData) {
  'use server';
  const userId = String(formData.get('userId'));
  const examId = String(formData.get('examId'));
  if (!userId || !examId) return;
  await db.entitlement.upsert({
    where: { userId_examId_tier: { userId, examId, tier: 'ADMIN_GRANT' } },
    update: {},
    create: { userId, examId, tier: 'ADMIN_GRANT' }
  });
  revalidatePath('/admin/users');
}

async function setActive(formData: FormData) {
  'use server';
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return;
  const userId = String(formData.get('userId'));
  const active = formData.get('active') === '1';
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return;
  if (isSuperAdmin(target.email)) return; // never deactivate super-admin
  await db.user.update({ where: { id: userId }, data: { active } });
  await db.adminLog.create({
    data: {
      adminId: (session!.user as any).id,
      action: active ? 'user.reactivate' : 'user.deactivate',
      targetType: 'User',
      targetId: userId
    }
  });
  revalidatePath('/admin/users');
}

async function setRole(formData: FormData) {
  'use server';
  const session = await auth();
  const me = session?.user as any;
  if (!isSuperAdmin(me?.email)) return; // only super-admin can change roles
  const userId = String(formData.get('userId'));
  const role = formData.get('role') === 'ADMIN' ? 'ADMIN' : 'USER';
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return;
  if (isSuperAdmin(target.email)) return; // super-admin role is immutable
  await db.user.update({ where: { id: userId }, data: { role } });
  await db.adminLog.create({
    data: {
      adminId: me.id,
      action: role === 'ADMIN' ? 'user.promote' : 'user.demote',
      targetType: 'User',
      targetId: userId
    }
  });
  revalidatePath('/admin/users');
}

type Filter = 'all' | 'users' | 'admins';

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  const me = session?.user as any;
  const superAdmin = isSuperAdmin(me?.email);

  const sp = await searchParams;
  const filter: Filter =
    sp.filter === 'users' ? 'users' : sp.filter === 'admins' ? 'admins' : 'all';
  const where =
    filter === 'admins' ? { role: 'ADMIN' as const } : filter === 'users' ? { role: 'USER' as const } : {};

  const [users, exams, counts] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { _count: { select: { entitlements: true, orders: true, attempts: true } } }
    }),
    db.exam.findMany({ orderBy: { title: 'asc' } }),
    Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'USER' } }),
      db.user.count({ where: { role: 'ADMIN' } })
    ])
  ]);
  const [allCount, userCount, adminCount] = counts;

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allCount },
    { key: 'users', label: 'Users', count: userCount },
    { key: 'admins', label: 'Admins', count: adminCount }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="text-xs text-slate-500">
          {superAdmin ? (
            <span>Signed in as super admin ({SUPER_ADMIN_EMAIL})</span>
          ) : (
            <span>Role changes require super admin ({SUPER_ADMIN_EMAIL})</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'all' ? '/admin/users' : `/admin/users?filter=${t.key}`}
            className={`rounded-md px-3 py-1.5 ${
              filter === t.key
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {t.label} <span className="opacity-70">({t.count})</span>
          </Link>
        ))}
      </div>

      <div className="card mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {users.map((u) => {
          const targetIsSuper = isSuperAdmin(u.email);
          return (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  <span className="truncate">{u.name || u.email}</span>
                  {targetIsSuper && (
                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800">
                      SUPER ADMIN
                    </span>
                  )}
                  {u.role === 'ADMIN' && !targetIsSuper && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                      ADMIN
                    </span>
                  )}
                  {!u.active && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                      DEACTIVATED
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {u.email} · {u._count.orders} orders · {u._count.entitlements} exams ·{' '}
                  {u._count.attempts} attempts
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <form action={grantAccess} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <select name="examId" className="input">
                    <option value="">Grant exam access…</option>
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.code} — {e.title}
                      </option>
                    ))}
                  </select>
                  <button className="btn-outline">Grant</button>
                </form>

                {superAdmin && !targetIsSuper && (
                  <form action={setRole}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="role" value={u.role === 'ADMIN' ? 'USER' : 'ADMIN'} />
                    <button className="btn-outline text-xs">
                      {u.role === 'ADMIN' ? 'Revoke admin' : 'Make admin'}
                    </button>
                  </form>
                )}

                {!targetIsSuper && (
                  <form action={setActive}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="active" value={u.active ? '0' : '1'} />
                    <button
                      className={`text-xs ${
                        u.active ? 'btn-outline text-red-600' : 'btn-outline text-emerald-700'
                      }`}
                    >
                      {u.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {users.length === 0 && <p className="p-4 text-sm text-slate-500">No users match this filter.</p>}
      </div>
    </div>
  );
}
