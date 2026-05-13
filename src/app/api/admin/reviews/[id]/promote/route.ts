import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const adminId = (session?.user as any)?.id as string | undefined;
  if (!adminId || !isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const review = await db.review.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } }, exam: { select: { id: true, title: true } } }
  });
  if (!review) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  const quote = (review.body || review.title || '').trim().slice(0, 800);
  if (!quote) return NextResponse.json({ ok: false, error: 'review_has_no_text' }, { status: 400 });

  const authorName = review.user.name || maskEmail(review.user.email);
  const existing = await db.testimonial.findUnique({ where: { sourceReviewId: review.id } });
  const testimonial = existing
    ? existing
    : await db.testimonial.create({
        data: {
          authorName,
          authorTitle: `${review.exam.title} student`,
          quote,
          rating: review.rating,
          examId: review.examId,
          sourceReviewId: review.id,
          published: false
        }
      });

  await db.adminLog.create({
    data: { adminId, action: 'review.promote', targetType: 'Testimonial', targetId: testimonial.id, metadata: { reviewId: review.id } }
  });
  return NextResponse.json({ ok: true, testimonial });
}

function maskEmail(e: string): string {
  const [u, d] = e.split('@');
  if (!u || !d) return 'Student';
  return `${u.slice(0, 2)}…@${d}`;
}
