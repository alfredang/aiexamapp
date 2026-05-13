import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/page-header';
import TestimonialsAdminClient from './client';

export const dynamic = 'force-dynamic';

export default async function TestimonialsAdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role === 'USER') redirect('/');
  const items = await db.testimonial.findMany({
    where: { deletedAt: null },
    orderBy: [{ published: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { exam: { select: { id: true, code: true, title: true } } }
  });
  const exams = await db.exam.findMany({
    where: { deletedAt: null },
    orderBy: [{ vendorId: 'asc' }, { code: 'asc' }],
    select: { id: true, code: true, title: true }
  });
  const published = items.filter((i) => i.published).length;
  return (
    <div>
      <PageHeader
        title="Testimonials"
        subtitle={`${items.length} total · ${published} published. Published testimonials appear on the landing page.`}
      />
      <TestimonialsAdminClient initial={items as any} exams={exams} />
    </div>
  );
}
