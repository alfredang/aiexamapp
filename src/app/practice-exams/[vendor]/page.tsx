import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function VendorCatalogPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const vendor = await db.vendor.findUnique({ where: { slug } });
  if (!vendor) notFound();

  // Bundle-only catalog (per project policy): individual exam cards are
  // hidden — customers only purchase bundles.
  const allBundles = await db.bundle.findMany({
    where: { published: true },
    include: { items: { include: { exam: { include: { vendor: true } } } } }
  });
  const bundles = allBundles.filter(b => b.items[0]?.exam.vendor.slug === slug);

  type Card = { kind: 'bundle'; data: (typeof bundles)[number] };
  const cards: Card[] = bundles.map(b => ({ kind: 'bundle' as const, data: b }));

  return (
    <div className="container-app py-10">
      <div className="mb-2 text-sm">
        <Link href="/practice-exams" className="text-blue-600 hover:underline">All exams</Link>
        <span className="text-slate-400"> / </span>
        <span>{vendor.name}</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{vendor.name}</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">{vendor.description}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(card => {
          const b = card.data;
          const first = b.items[0]?.exam;
          const totalQs = b.items.reduce((s, i) => s + i.exam.questionCount, 0);
          return (
            <Link key={`b-${b.id}`} href={first ? `/practice-exams/${first.vendor.slug}/${b.slug}` : `/bundles/${b.slug}`} className="card-hover p-5">
              <div className="mb-2 flex items-center gap-2 text-xs">
                {first && <span className="badge">{first.code}</span>}
                {first && <span className="badge">{first.level}</span>}
              </div>
              <h3 className="font-semibold">{b.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{b.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{totalQs} questions · {b.items.length} practice exams</span>
                <span className="font-semibold text-blue-700 dark:text-blue-300">{b.price === 0 ? 'Free' : `from ${formatPrice(b.price)}`}</span>
              </div>
            </Link>
          );
        })}
        {cards.length === 0 && <p className="text-slate-500">No bundles yet for this vendor.</p>}
      </div>
    </div>
  );
}
