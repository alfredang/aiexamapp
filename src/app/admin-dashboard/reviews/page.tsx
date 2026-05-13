import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/page-header';
import ReviewsAdminClient from './client';
import type { ReviewStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ReviewsAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role === 'USER') redirect('/');
  const sp = await searchParams;
  const status: ReviewStatus = (['PENDING', 'APPROVED', 'REJECTED'].includes(sp.status as any) ? sp.status : 'PENDING') as ReviewStatus;

  const reviews = await db.review.findMany({
    where: { status, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, email: true, name: true } },
      exam: { select: { id: true, code: true, title: true, slug: true, vendor: { select: { slug: true, name: true } } } }
    }
  });

  const counts = await db.review.groupBy({
    by: ['status'],
    where: { deletedAt: null },
    _count: { _all: true }
  });
  const countMap: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const r of counts) countMap[r.status] = r._count._all;

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle={`Moderate student-submitted reviews. Pending: ${countMap.PENDING} · Approved: ${countMap.APPROVED} · Rejected: ${countMap.REJECTED}.`}
      />
      <ReviewsAdminClient initial={reviews as any} currentStatus={status} counts={countMap} />
    </div>
  );
}
