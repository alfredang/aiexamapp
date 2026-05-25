import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// Route handler (replaces the prior page.tsx). Next.js 16 disallows writing
// cookies in Server Components, so the guest-token cookie must be set here.
// User flow: link to /practice-exams/{vendor}/{slug}/teaser → GET this handler
// → creates a teaser Attempt and redirects to /exam/{attemptId}.

export async function GET(req: NextRequest, { params }: { params: Promise<{ vendor: string; slug: string }> }) {
  const { vendor: vendorSlug, slug } = await params;

  const exam = await db.exam.findUnique({ where: { slug }, include: { vendor: true } });
  if (!exam || exam.vendor.slug !== vendorSlug) {
    return new NextResponse('Not found', { status: 404 });
  }

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  const c = await cookies();
  let gt = c.get('gt')?.value;
  if (!userId && !gt) {
    gt = `g_${crypto.randomUUID()}`;
    // `secure` over HTTPS in production — the gt token is bearer-equivalent
    // for the guest attempt and must not traverse plain HTTP. (Teaser-audit L1.)
    c.set('gt', gt, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  }

  const teaserQuestions = await db.question.findMany({
    where: { examId: exam.id, isTeaser: true, status: 'PUBLISHED' },
    select: { id: true }
  });
  if (teaserQuestions.length === 0) {
    // No teaser content yet — bounce back to the exam detail page with a notice flag.
    return NextResponse.redirect(new URL(`/practice-exams/${vendorSlug}/${slug}?teaser=unavailable`, req.url));
  }

  // Admin-configurable teaser size (Settings → TEASER_QUESTION_COUNT, default 20).
  const { getSetting } = await import('@/lib/settings');
  const sizeRaw = await getSetting('TEASER_QUESTION_COUNT');
  const teaserSize = Math.max(1, Math.min(50, Number(sizeRaw) || 20));
  const ids = teaserQuestions.map((q) => q.id).sort(() => Math.random() - 0.5).slice(0, teaserSize);

  const attempt = await db.attempt.create({
    data: {
      userId: userId ?? null,
      guestToken: !userId ? gt : null,
      examId: exam.id,
      mode: 'PRACTICE',
      isTeaser: true,
      questionIds: ids,
      durationSec: 0,
      responses: {}
    }
  });
  return NextResponse.redirect(new URL(`/exam/${attempt.id}`, req.url));
}
