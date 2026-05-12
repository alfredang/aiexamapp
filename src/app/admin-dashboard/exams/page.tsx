import Link from 'next/link';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function togglePublish(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const published = formData.get('published') === 'on';
  await db.exam.update({ where: { id }, data: { published } });
  revalidatePath('/admin-dashboard/exams');
}

export default async function AdminExamsPage({
  searchParams
}: {
  searchParams: Promise<{ vendor?: string; level?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const vendorFilter = sp.vendor || '';
  const levelFilter = sp.level || '';
  const q = (sp.q || '').trim();

  const [vendors, exams] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: 'asc' } }),
    db.exam.findMany({
      where: {
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
      },
      include: { vendor: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const LEVELS = ['Foundational', 'Associate', 'Professional', 'Specialty'];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exam Management</h1>
        <Link href="/admin-dashboard/exams/new" className="btn-primary-grad">+ Create Exam</Link>
      </div>

      {/* Compact filter bar */}
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
        <span className="ml-auto text-xs text-slate-500">{exams.length} result{exams.length === 1 ? '' : 's'}</span>
      </form>

      <div className="card mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {exams.map((e) => (
          <div key={e.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{e.title}</div>
              <div className="text-xs text-slate-500">
                {e.vendor.name} · {e.code} · {e.level} · {e._count.questions} questions
              </div>
            </div>
            <form action={togglePublish} className="flex items-center gap-2">
              <input type="hidden" name="id" value={e.id} />
              <label className="text-xs">
                <input type="checkbox" name="published" defaultChecked={e.published} /> published
              </label>
              <button className="btn-outline">Save</button>
              <a href={`/admin-dashboard/exams/${e.id}/generate`} className="btn-primary-grad">
                Generate
              </a>
            </form>
          </div>
        ))}
        {exams.length === 0 && (
          <p className="p-4 text-sm text-slate-500">
            No exams match this filter.{' '}
            <Link href="/admin-dashboard/exams" className="text-blue-600 hover:underline dark:text-blue-400">
              Clear
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
