import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/page-header';
import { Pencil, FileText, Globe2, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuthorChooserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
  const { id } = await params;
  const exam = await db.exam.findUnique({
    where: { id },
    include: { vendor: true, _count: { select: { questions: true, sources: true } } }
  });
  if (!exam) notFound();

  const modes = [
    {
      href: `/admin-dashboard/exams/${id}/author/manual`,
      icon: Pencil,
      title: '1. Manual',
      desc: 'Type questions yourself in a batch form (5 at a time). Full control over wording, options, per-answer explanations, and difficulty.'
    },
    {
      href: `/admin-dashboard/exams/${id}/author/blueprint`,
      icon: Sparkles,
      title: '2. AI Assist (Blueprint)',
      desc: 'Generate a full exam (e.g. 60 questions) automatically. Firecrawl scrapes the official exam objectives from this exam’s Info URL, then Claude authors questions whose distribution matches the published domain weights.'
    },
    {
      href: `/admin-dashboard/exams/${id}/author/pdf`,
      icon: FileText,
      title: '3. From PDF / e-book',
      desc: 'Upload a vendor study guide or e-book. We extract the text and Claude authors questions grounded in it. Each question links back to the source for audit.'
    },
    {
      href: `/admin-dashboard/exams/${id}/author/web`,
      icon: Globe2,
      title: '4. From web pages (Firecrawl + Tavily)',
      desc: 'Paste one or more URLs (vendor docs, blog posts, study sites). Firecrawl scrapes to clean markdown, then Claude authors questions grounded in the scraped content.'
    }
  ];

  return (
    <div>
      <PageHeader
        title={`Author questions for ${exam.code}`}
        subtitle={`${exam.vendor.name} · ${exam.title} · ${exam._count.questions} questions in bank · ${exam._count.sources} prior source(s)`}
        back={{ href: `/admin-dashboard/exams/${id}`, label: 'Back to exam' }}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {modes.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="card-hover block p-5 transition"
          >
            <div className="flex items-center gap-3">
              <m.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{m.title}</h2>
            </div>
            <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-300">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
