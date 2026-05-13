import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canUserReview, ReviewInputSchema } from '@/lib/reviews';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const examId = url.searchParams.get('examId');
  if (!examId) return NextResponse.json({ ok: false, error: 'examId required' }, { status: 400 });
  const take = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10));
  const skip = Math.max(0, Number(url.searchParams.get('skip')) || 0);
  const reviews = await db.review.findMany({
    where: { examId, status: 'APPROVED', deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take,
    skip,
    select: {
      id: true, rating: true, title: true, body: true, createdAt: true,
      user: { select: { name: true, email: true } },
      attemptId: true
    }
  });
  const items = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt,
    verified: !!r.attemptId,
    authorName: r.user.name || maskEmail(r.user.email)
  }));
  return NextResponse.json({ ok: true, items });
}

function maskEmail(e: string): string {
  const [u, d] = e.split('@');
  if (!u || !d) return 'Anonymous';
  return `${u.slice(0, 2)}…@${d}`;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const rl = rateLimit(`review:${userId}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited', retryAfter: rl.retryAfter }, { status: 429 });

  const body = ReviewInputSchema.parse(await req.json());
  const ok = await canUserReview(userId, body.examId);
  if (!ok) return NextResponse.json({ ok: false, error: 'not_eligible' }, { status: 403 });

  const data = {
    userId,
    examId: body.examId,
    rating: body.rating,
    title: body.title?.trim() || null,
    body: body.body?.trim() || null,
    attemptId: body.attemptId?.trim() || null,
    status: 'PENDING' as const
  };

  const review = await db.review.upsert({
    where: { userId_examId: { userId, examId: body.examId } },
    create: data,
    update: { ...data }
  });

  return NextResponse.json({ ok: true, review: { id: review.id, status: review.status } });
}
