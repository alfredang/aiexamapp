import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/page-header';
import FaqAdminClient from './client';

export const dynamic = 'force-dynamic';

export default async function FaqAdminPage() {
  const session = await auth();
  if ((session?.user as any)?.role === 'USER' || !session?.user) redirect('/');
  const faqs = await db.faq.findMany({ orderBy: { position: 'asc' } });

  return (
    <div>
      <PageHeader
        title="FAQ"
        subtitle={`${faqs.length} entr${faqs.length === 1 ? 'y' : 'ies'}. Published entries appear in the homepage FAQ section. Use {{TEASER_N}} as a placeholder for the configured teaser size.`}
      />
      <FaqAdminClient initial={faqs} />
    </div>
  );
}
