import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export default async function AttemptsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect('/login');
  const attempts = await db.attempt.findMany({
    where: { userId },
    include: { exam: { include: { vendor: true } } },
    orderBy: { startedAt: 'desc' },
    take: 100
  });
  return (
    <>
      <h1 className="text-2xl font-bold">My Attempts</h1>
      <div className="mt-4 card divide-y divide-slate-200 dark:divide-slate-800">
        {attempts.length === 0 && <p className="p-5 text-sm text-slate-500">No attempts yet.</p>}
        {attempts.map(a => {
          const inProgress = !a.submittedAt;
          return (
            <div key={a.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{a.exam.title}</div>
                <div className="text-xs text-slate-500">{a.exam.vendor.name} · {a.mode}{a.isTeaser ? ' · Teaser' : ''} · {a.startedAt.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                {inProgress ? (
                  <Link href={`/exam/${a.id}`} className="btn-primary">Resume</Link>
                ) : (
                  <Link href={`/results/${a.id}`} className={`badge ${a.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.score}%</Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
