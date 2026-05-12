import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/page-header';
import WebAuthorClient from './web-client';

export const dynamic = 'force-dynamic';

export default async function WebAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
  const { id } = await params;
  const exam = await db.exam.findUnique({ where: { id }, include: { vendor: true } });
  if (!exam) notFound();
  const domains = ((exam.domains as any[]) || []).map((d: any) => String(d.name || ''));

  return (
    <div>
      <PageHeader
        title="Author from web pages"
        subtitle={`${exam.vendor.name} · ${exam.code} — paste vendor docs / blog URLs; Firecrawl scrapes; Claude authors grounded questions.`}
        back={{ href: `/admin-dashboard/exams/${id}/author`, label: 'Back to mode chooser' }}
      />
      <WebAuthorClient examId={id} domains={domains} />
    </div>
  );
}
