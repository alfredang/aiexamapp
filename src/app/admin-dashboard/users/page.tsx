import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { auth, isSuperAdmin } from '@/lib/auth';

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
  revalidatePath('/admin-dashboard/users');
}

export default async function AdminUsersPage() {
  const session = await auth();
  const me = session?.user as any;
  const superAdmin = isSuperAdmin(me?.email);

  const [users, exams] = await Promise.all([
    db.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        entitlements: { include: { exam: { select: { code: true, title: true } } } }
      }
    }),
    db.exam.findMany({ orderBy: { title: 'asc' } })
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="text-xs text-slate-500">{users.length} users</div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-max min-w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Exams Purchased</th>
              <th className="px-4 py-3 font-medium">Grant Exam Access</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((u) => {
              const examList = u.entitlements
                .map((e) => `${e.exam.code} — ${e.exam.title}`)
                .join('\n');
              return (
                <tr key={u.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    <Link href={`/admin-dashboard/users/${u.id}`} className="hover:underline">
                      {u.name || '—'}
                    </Link>
                    {!u.active && (
                      <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                        DEACTIVATED
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/admin-dashboard/users/${u.id}`}
                      title={examList || 'No exams'}
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {u.entitlements.length}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <form action={grantAccess} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="examId" className="input" defaultValue="">
                        <option value="">Select exam…</option>
                        {exams.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.code} — {e.title}
                          </option>
                        ))}
                      </select>
                      <button className="btn-outline whitespace-nowrap">Grant</button>
                    </form>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {u.active ? 'Active' : 'Inactive'}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
