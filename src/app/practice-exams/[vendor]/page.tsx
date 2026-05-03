import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils';

export default async function VendorCatalogPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const vendor = await db.vendor.findUnique({
    where: { slug },
    include: {
      exams: {
        where: { published: true },
        include: { _count: { select: { questions: { where: { status: 'PUBLISHED' } } } } }
      }
    }
  });
  if (!vendor) notFound();

  return (
    <div className="container-app py-10">
      <div className="mb-2 text-sm">
        <Link href="/practice-exams" className="text-blue-600 hover:underline">All exams</Link>
        <span className="text-slate-400"> / </span>
        <span>{vendor.name}</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{vendor.name}</h1>
      <p className="mt-1 text-slate-600">{vendor.description}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendor.exams.map(e => (
          <Link key={e.id} href={`/practice-exams/${vendor.slug}/${e.slug}`} className="card-hover p-5">
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="badge">{e.code}</span>
              <span className="badge">{e.level}</span>
            </div>
            <h3 className="font-semibold">{e.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{e.description}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">{e._count.questions} questions</span>
              <span className="font-semibold text-blue-700">from {formatPrice(e.pricePractice)}</span>
            </div>
          </Link>
        ))}
        {vendor.exams.length === 0 && <p className="text-slate-500">No exams yet for this vendor.</p>}
      </div>
    </div>
  );
}
