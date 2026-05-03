import Link from 'next/link';
import { db } from '@/lib/db';

export default async function VendorsPage() {
  const vendors = await db.vendor.findMany({ include: { _count: { select: { exams: true } } }, orderBy: { name: 'asc' } });
  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
      <p className="mt-1 text-slate-600">Browse certifications by issuing vendor.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {vendors.map(v => (
          <Link key={v.id} href={`/practice-exams/${v.slug}`} className="card-hover flex flex-col items-center px-4 py-6 text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-purple-50 text-blue-700 text-lg font-semibold">{v.name.slice(0, 2).toUpperCase()}</div>
            <div className="font-medium">{v.name}</div>
            <div className="text-xs text-slate-500">{v._count.exams} exams</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
