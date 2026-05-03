import Link from 'next/link';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils';

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; level?: string; vendor?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const exams = await db.exam.findMany({
    where: {
      published: true,
      ...(sp.vendor ? { vendor: { slug: sp.vendor } } : {}),
      ...(sp.level ? { level: sp.level } : {}),
      ...(q ? { OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } }
      ] } : {})
    },
    include: { vendor: true, _count: { select: { questions: { where: { status: 'PUBLISHED' } } } } },
    orderBy: { createdAt: 'desc' }
  });
  const vendors = await db.vendor.findMany({ orderBy: { name: 'asc' } });
  const levels = ['Foundational', 'Associate', 'Professional', 'Specialty'];

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Practice exams</h1>
        <p className="mt-1 text-slate-600">Browse certifications across leading vendors. Free 30-question teaser on every exam.</p>
      </div>

      <form className="mb-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search by name or code" className="input max-w-md" />
        <select name="vendor" defaultValue={sp.vendor || ''} className="input max-w-[180px]">
          <option value="">All vendors</option>
          {vendors.map(v => <option key={v.id} value={v.slug}>{v.name}</option>)}
        </select>
        <select name="level" defaultValue={sp.level || ''} className="input max-w-[160px]">
          <option value="">All levels</option>
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button className="btn-primary">Filter</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exams.map(e => (
          <Link key={e.id} href={`/practice-exams/${e.vendor.slug}/${e.slug}`} className="card-hover p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="badge">{e.vendor.name}</span>
              <span className="badge">{e.code}</span>
              <span className="badge">{e.level}</span>
            </div>
            <h3 className="font-semibold">{e.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{e.description}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">{e._count.questions} questions · {e.durationMinutes} min</span>
              <span className="font-semibold text-blue-700">from {formatPrice(e.pricePractice)}</span>
            </div>
          </Link>
        ))}
        {exams.length === 0 && <p className="text-slate-500">No exams found.</p>}
      </div>
    </div>
  );
}
