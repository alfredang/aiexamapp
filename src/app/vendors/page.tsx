import Link from 'next/link';
import { db } from '@/lib/db';

// ISR: vendor list + per-vendor exam/bundle counts cache for 10 min.
// Vendor catalog changes infrequently (vendors are added rarely; exam
// publish counts shift on the same cadence as the homepage at most).
export const revalidate = 600;

export default async function VendorsPage() {
  // Count only exams visible to the public (published + has questions)
  // so the "X exams" label is accurate.
  const vendors = await db.vendor.findMany({
    include: { _count: { select: { exams: { where: { published: true, questions: { some: { status: 'PUBLISHED' } } } } } } },
    orderBy: { name: 'asc' }
  });

  // Bundles per vendor — bundle vendor is derived from items[0].exam.vendor.
  const bundles = await db.bundle.findMany({
    where: { published: true },
    select: { id: true, items: { take: 1, select: { exam: { select: { vendor: { select: { slug: true } } } } } } }
  });
  const bundleCountByVendor = new Map<string, number>();
  for (const b of bundles) {
    const vs = b.items[0]?.exam.vendor.slug;
    if (vs) bundleCountByVendor.set(vs, (bundleCountByVendor.get(vs) || 0) + 1);
  }

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">Browse certifications by issuing vendor.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {vendors.map(v => {
          const total = v._count.exams + (bundleCountByVendor.get(v.slug) || 0);
          return (
            <Link key={v.id} href={`/practice-exams/${v.slug}`} className="card-hover flex flex-col items-center justify-center px-4 py-6 text-center">
              <div className="font-medium">{v.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{total} exam{total === 1 ? '' : 's'}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
