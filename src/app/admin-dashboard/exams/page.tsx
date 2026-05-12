import Link from 'next/link';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

async function deleteExam(formData: FormData) {
  'use server';
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  if (!id) return;
  const [attempts, orders] = await Promise.all([
    db.attempt.count({ where: { examId: id } }),
    db.order.count({ where: { examId: id } })
  ]);
  if (attempts > 0 || orders > 0) return; // refuse if referenced
  await db.question.deleteMany({ where: { examId: id } });
  await db.entitlement.deleteMany({ where: { examId: id } });
  await db.exam.delete({ where: { id } });
  revalidatePath('/admin-dashboard/exams');
}

const LEVELS = ['Foundational', 'Associate', 'Professional', 'Specialty'];

const PAGE_SIZE = 50;

function buildQS(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== 0) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | 'ellipsis')[] = [];
  const around = new Set([1, total, current - 1, current, current + 1]);
  for (let i = 1; i <= total; i++) {
    if (around.has(i)) out.push(i);
    else if (out[out.length - 1] !== 'ellipsis') out.push('ellipsis');
  }
  return out;
}

export default async function AdminExamsPage({
  searchParams
}: {
  searchParams: Promise<{ vendor?: string; level?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const vendorFilter = sp.vendor || '';
  const levelFilter = sp.level || '';
  const q = (sp.q || '').trim();
  const requestedPage = Math.max(1, Number(sp.page || 1) || 1);

  const where = {
    ...(vendorFilter ? { vendor: { slug: vendorFilter } } : {}),
    ...(levelFilter ? { level: levelFilter } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { code: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {})
  };

  const [vendors, totalCount] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: 'asc' } }),
    db.exam.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const exams = await db.exam.findMany({
    where,
    include: {
      vendor: true,
      _count: { select: { questions: true, attempts: true, orders: true } }
    },
    orderBy: [{ vendor: { name: 'asc' } }, { title: 'asc' }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exam Management</h1>
        <Link href="/admin-dashboard/exams/new" className="btn-primary-grad">+ Create Exam</Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-center gap-2">
        <select name="vendor" defaultValue={vendorFilter} className="input w-44">
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.slug}>{v.name}</option>
          ))}
        </select>
        <select name="level" defaultValue={levelFilter} className="input w-40">
          <option value="">All levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title or code…"
          className="input w-64"
        />
        <button className="btn-primary text-sm">Apply</button>
        {(vendorFilter || levelFilter || q) && (
          <Link href="/admin-dashboard/exams" className="btn-ghost text-sm">Reset</Link>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {totalCount} result{totalCount === 1 ? '' : 's'}
          {totalPages > 1 && ` · page ${page} of ${totalPages}`}
        </span>
      </form>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-max min-w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
            <tr>
              <th className="w-48 px-2 py-2 font-medium">Vendor</th>
              <th className="w-[28rem] px-2 py-2 font-medium">Exam Name</th>
              <th className="w-32 px-2 py-2 font-medium">Code</th>
              <th className="w-36 px-2 py-2 font-medium">Level</th>
              <th className="w-24 px-2 py-2 font-medium">Status</th>
              <th className="w-24 px-2 py-2 font-medium">Questions</th>
              <th className="w-40 px-2 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {exams.map((e) => {
              const canDelete = e._count.attempts === 0 && e._count.orders === 0;
              return (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-700 dark:text-slate-300">
                    {e.vendor.name}
                  </td>
                  <td className="px-2 py-1.5 font-medium">
                    <Link href={`/admin-dashboard/exams/${e.id}`} className="hover:underline">
                      {e.title.split(' — ')[0]}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-500">{e.code}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-500">{e.level}</td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    {e.published ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        PUBLISHED
                      </span>
                    ) : (
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        DRAFT
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-500">{e._count.questions}</td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin-dashboard/exams/${e.id}`}
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Edit
                      </Link>
                      <form action={deleteExam}>
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          disabled={!canDelete}
                          title={
                            canDelete
                              ? 'Delete exam'
                              : 'Cannot delete: exam has attempts or orders'
                          }
                          className="text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {exams.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-sm text-slate-500">
                  No exams match this filter.{' '}
                  <Link
                    href="/admin-dashboard/exams"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Clear
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-1 text-sm">
          {(() => {
            const baseParams = { vendor: vendorFilter, level: levelFilter, q };
            const linkFor = (p: number) =>
              `/admin-dashboard/exams${buildQS({ ...baseParams, page: p === 1 ? undefined : p })}`;
            const PageLink = ({
              p,
              label,
              disabled,
              active
            }: {
              p: number;
              label: string;
              disabled?: boolean;
              active?: boolean;
            }) => {
              const cls = `rounded px-2.5 py-1 text-xs ${
                active
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : disabled
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`;
              if (disabled) return <span className={cls}>{label}</span>;
              return (
                <Link href={linkFor(p)} className={cls}>
                  {label}
                </Link>
              );
            };
            const win = pageWindow(page, totalPages);
            return (
              <>
                <PageLink p={1} label="First" disabled={page === 1} />
                <PageLink p={page - 1} label="Prev" disabled={page === 1} />
                {win.map((w, i) =>
                  w === 'ellipsis' ? (
                    <span key={`e${i}`} className="px-1 text-slate-500">
                      …
                    </span>
                  ) : (
                    <PageLink key={w} p={w} label={String(w)} active={w === page} />
                  )
                )}
                <PageLink p={page + 1} label="Next" disabled={page === totalPages} />
                <PageLink p={totalPages} label="Last" disabled={page === totalPages} />
              </>
            );
          })()}
        </nav>
      )}
    </div>
  );
}
