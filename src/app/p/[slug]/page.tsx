import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug } });
  if (!page) return { title: 'Not found' };
  return { title: page.title, description: page.excerpt ?? undefined };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug } });
  if (!page || !page.published) return notFound();

  return (
    <div className="container-app max-w-3xl py-12">
      <div className="mb-6 text-sm">
        <Link href="/" className="text-slate-500 hover:underline">← Home</Link>
      </div>
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
        {page.excerpt && (
          <p className="mt-1 text-base text-slate-600 dark:text-slate-400">{page.excerpt}</p>
        )}
        <div
          className="mt-6 text-[0.95rem] leading-7 text-slate-700 dark:text-slate-200"
          dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
        />
      </article>
    </div>
  );
}
