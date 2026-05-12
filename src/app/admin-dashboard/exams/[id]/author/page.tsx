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
      title: 'Manual',
      desc: 'Type questions yourself in a batch form. Best when you have a small handful of questions to enter or need full control over wording.'
    },
    {
      href: `/admin-dashboard/exams/${id}/author/pdf`,
      icon: FileText,
      title: 'From PDF / e-book',
      desc: 'Upload an exam guide or study PDF. We extract the text and ask Claude to generate questions grounded in it. Approve each question before it lands in your bank.'
    },
    {
      href: `/admin-dashboard/exams/${id}/author/web`,
      icon: Globe2,
      title: 'From web pages',
      desc: 'Paste one or more URLs (vendor exam guides, blog posts, study sites). Firecrawl scrapes the content to clean markdown, then Claude authors questions from it. Approve each one before it ships.'
    },
    {
      href: `/admin-dashboard/exams/${id}/generate`,
      icon: Sparkles,
      title: 'From scratch (Claude)',
      desc: 'Generate questions purely from the exam blueprint with no source document. Useful when you don’t have a study source handy and want broad coverage.'
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
