import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

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

export default async function AdminUsersPage() {
  const [users, exams] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { _count: { select: { entitlements: true, orders: true, attempts: true } } } }),
    db.exam.findMany({ orderBy: { title: 'asc' } })
  ]);
  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="card mt-4 divide-y divide-slate-200">
        {users.map(u => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-medium">{u.name || u.email}</div>
              <div className="text-xs text-slate-500">{u.email} · {u.role} · {u._count.orders} orders · {u._count.entitlements} exams · {u._count.attempts} attempts</div>
            </div>
            <form action={grantAccess} className="flex items-center gap-2">
              <input type="hidden" name="userId" value={u.id} />
              <select name="examId" className="input">
                <option value="">Grant exam access…</option>
                {exams.map(e => <option key={e.id} value={e.id}>{e.code} — {e.title}</option>)}
              </select>
              <button className="btn-outline">Grant</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
