import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth, signOut } from '@/lib/auth';
import { getGroupedExams, toListItems } from '@/lib/my-exams';
import { MyExamsList } from '@/components/my-exams-list';
import { BookOpen, ChartBar, Trophy, Play, Hourglass, Calendar } from 'lucide-react';

export default async function MyContentPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect('/login');

  const [grouped, recent, totalAttempts, allSubmitted] = await Promise.all([
    getGroupedExams(userId),
    db.attempt.findMany({
      where: { userId, submittedAt: { not: null } },
      include: { exam: { include: { vendor: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 5
    }),
    db.attempt.count({ where: { userId, submittedAt: { not: null } } }),
    db.attempt.findMany({
      where: { userId, submittedAt: { not: null } },
      select: { score: true }
    })
  ]);

  // Interleave bundles + standalones by grantedAt, cap to 6 cards for the
  // dashboard preview. "View all →" goes to /my-content/exams.
  const allListItems = toListItems(grouped);
  const dashboardItems = allListItems.slice(0, 6);

  // "Exams owned" counts bundles as 1 even though each bundle wraps
  // multiple underlying practice-exam entitlements.
  const totalExams = grouped.bundles.length + grouped.standalone.length;
  const avgScore = allSubmitted.length === 0
    ? null
    : Math.round(allSubmitted.reduce((s, a) => s + (a.score ?? 0), 0) / allSubmitted.length);
  const userName = session!.user!.name || session!.user!.email?.split('@')[0] || 'there';

  return (
    <>
      {/* Welcome header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Resume practice or start a timed exam.</p>
        </div>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
          <button className="btn-ghost text-sm">Sign out</button>
        </form>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Exams owned" value={totalExams.toString()} accent="blue" />
        <StatCard icon={ChartBar} label="Attempts taken" value={totalAttempts.toString()} accent="purple" />
        <StatCard
          icon={Trophy}
          label="Average score"
          value={avgScore !== null ? `${avgScore}%` : '—'}
          accent="emerald"
        />
      </div>

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My Exams — 2 cols. Bundles render as one expandable card. */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Exams</h2>
            {allListItems.length > dashboardItems.length && (
              <Link href="/my-content/exams" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                View all →
              </Link>
            )}
          </div>
          <MyExamsList items={dashboardItems} />
        </section>

        {/* Recent attempts — 1 col */}
        <aside>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent attempts</h2>
            {totalAttempts > recent.length && (
              <Link href="/my-content/attempts" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                All →
              </Link>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="card p-6 text-center">
              <Hourglass className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">No attempts yet.</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Start one from an exam you own.
              </p>
            </div>
          ) : (
            <ul className="card divide-y divide-slate-200 dark:divide-slate-800 p-0 dark:divide-slate-700">
              {recent.map(a => {
                const pct = a.score ?? 0;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/results/${a.id}`}
                      className="flex items-center justify-between gap-3 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-sm font-medium">{a.exam.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            {a.mode === 'EXAM' ? <Hourglass className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            {a.mode === 'EXAM' ? 'Exam' : 'Practice'}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {a.submittedAt?.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          a.passed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                        }`}
                      >
                        {pct}%
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent
}: {
  icon: any;
  label: string;
  value: string;
  accent: 'blue' | 'purple' | 'emerald';
}) {
  const accents: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${accents[accent]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
      </div>
    </div>
  );
}
