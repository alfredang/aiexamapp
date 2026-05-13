import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/page-header';
import BlueprintAuthorClient from './blueprint-client';

export const dynamic = 'force-dynamic';

export default async function BlueprintAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
  const { id } = await params;
  const exam = await db.exam.findUnique({ where: { id }, include: { vendor: true } });
  if (!exam) notFound();
  const domains = (exam.domains as { name: string; weight: number }[]) || [];

  return (
    <div>
      <PageHeader
        title="AI Assist — Blueprint generator"
        subtitle={`${exam.vendor.name} · ${exam.code} — Firecrawl scrapes infoUrl; Claude generates questions matching the blueprint weights.`}
        back={{ href: `/admin-dashboard/exams/${id}/author`, label: 'Back to mode chooser' }}
      />
      <BlueprintAuthorClient examId={id} defaultTotal={exam.questionCount || 60} domains={domains} infoUrl={exam.infoUrl} />
    </div>
  );
}
