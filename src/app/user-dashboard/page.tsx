import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getGroupedExams, toListItems } from '@/lib/my-exams';
import { MyExamsList } from '@/components/my-exams-list';
import { Pagination } from '@/components/pagination';
import { BookOpen, ChartBar, Trophy } from 'lucide-react';

const PAGE_SIZE = 9;

export default async function MyContentPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect('/login');

  const [grouped, totalAttempts, allSubmitted] = await Promise.all([
    getGroupedExams(userId),
    db.attempt.count({ where: { userId, submittedAt: { not: null } } }),
    db.attempt.findMany({
      where: { userId, submittedAt: { not: null } },
      select: { score: true }
    })
  ]);

  const allListItems = toListItems(grouped);
  const totalPages = Math.max(1, Math.ceil(allListItems.length / PAGE_SIZE));
  const sp = await searchParams;
  const rawPage = Number.parseInt(sp.page ?? '1', 10);
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(1, rawPage), totalPages) : 1;
  const pagedItems = allListItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalExams = grouped.bundles.length + grouped.standalone.length;
  const avgScore = allSubmitted.length === 0
    ? null
    : Math.round(allSubmitted.reduce((s, a) => s + (a.score ?? 0), 0) / allSubmitted.length);
  const userName = session!.user!.name || session!.user!.email?.split('@')[0] || 'there';

  return (
    <>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Resume practice or start a timed exam.</p>
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

      {/* My Exams — 3 cols, paginated */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Exams</h2>
        </div>
        <MyExamsList items={pagedItems} cols={3} />
        <Pagination page={page} totalPages={totalPages} basePath="/user-dashboard" />
      </section>
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
