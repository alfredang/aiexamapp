import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth, signOut } from '@/lib/auth';
import { tierLabel } from '@/lib/utils';

export default async function MyContentPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect('/login');

  const [entitlements, recent] = await Promise.all([
    db.entitlement.findMany({ where: { userId }, include: { exam: { include: { vendor: true } } }, orderBy: { grantedAt: 'desc' }, take: 6 }),
    db.attempt.findMany({ where: { userId, submittedAt: { not: null } }, include: { exam: true }, orderBy: { submittedAt: 'desc' }, take: 5 })
  ]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {session!.user!.name || session!.user!.email}</h1>
          <p className="text-slate-600">Resume practice or start a timed exam.</p>
        </div>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
          <button className="btn-ghost">Sign out</button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold">My Exams</h3>
          {entitlements.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No exams yet. <Link href="/practice-exams" className="text-blue-600">Browse catalog →</Link></p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-200">
              {entitlements.map(e => (
                <li key={e.id} className="py-2 text-sm">
                  <Link href={`/practice-exams/${e.exam.vendor.slug}/${e.exam.slug}`} className="font-medium hover:underline">{e.exam.title}</Link>
                  <div className="text-xs text-slate-500">{e.exam.vendor.name} · {tierLabel(e.tier)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold">Recent attempts</h3>
          {recent.length === 0 ? <p className="mt-2 text-sm text-slate-500">No attempts yet.</p> : (
            <ul className="mt-2 divide-y divide-slate-200">
              {recent.map(a => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/results/${a.id}`}>
                    <div className="font-medium hover:underline">{a.exam.title}</div>
                    <div className="text-xs text-slate-500">{a.mode} · {a.submittedAt?.toLocaleDateString()}</div>
                  </Link>
                  <span className={`badge ${a.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.score}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
