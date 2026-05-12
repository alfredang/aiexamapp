import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/page-header';
import PdfAuthorClient from './pdf-client';

export const dynamic = 'force-dynamic';

export default async function PdfAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
  const { id } = await params;
  const exam = await db.exam.findUnique({ where: { id }, include: { vendor: true } });
  if (!exam) notFound();
  const domains = ((exam.domains as any[]) || []).map((d: any) => String(d.name || ''));

  return (
    <div>
      <PageHeader
        title="Author from PDF / e-book"
        subtitle={`${exam.vendor.name} · ${exam.code} — upload a study guide; Claude generates grounded questions you can approve.`}
        back={{ href: `/admin-dashboard/exams/${id}/author`, label: 'Back to mode chooser' }}
      />
      <PdfAuthorClient examId={id} domains={domains} />
    </div>
  );
}
