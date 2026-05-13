import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

const Body = z.object({
  examId: z.string(),
  mode: z.enum(['PRACTICE', 'EXAM']),
  teaser: z.boolean().optional()
});

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  const data = Body.parse(await req.json());
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  const exam = await db.exam.findUnique({ where: { id: data.examId } });
  if (!exam || !exam.published) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

  // Access control
  let guestToken: string | undefined;
  if (data.teaser) {
    if (!userId) {
      const c = await cookies();
      guestToken = c.get('gt')?.value;
      if (!guestToken) {
        guestToken = `g_${crypto.randomUUID()}`;
        c.set('gt', guestToken, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
      }
    }
  } else {
    if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    // Either PRACTICE / BUNDLE / ADMIN_GRANT entitlement grants taking exam
    const ent = await db.entitlement.findFirst({
      where: { userId, examId: exam.id, tier: { in: ['PRACTICE', 'BUNDLE', 'ADMIN_GRANT'] } }
    });
    if (!ent) return NextResponse.json({ error: 'Purchase required' }, { status: 402 });
  }

  const where = data.teaser
    ? { examId: exam.id, isTeaser: true, status: 'PUBLISHED' as const }
    : { examId: exam.id, status: 'PUBLISHED' as const };
  const all = await db.question.findMany({ where, select: { id: true } });
  if (all.length === 0) return NextResponse.json({ error: 'No questions available' }, { status: 400 });
  let teaserLimit = 20;
  if (data.teaser) {
    const { getSetting } = await import('@/lib/settings');
    const raw = await getSetting('TEASER_QUESTION_COUNT');
    teaserLimit = Math.max(1, Math.min(50, Number(raw) || 20));
  }
  const limit = data.teaser ? teaserLimit : exam.questionCount;
  // Questions are always shuffled — both practice and exam mode get a
  // randomized order; option ordering is preserved at the Question level
  // (admins author them in a deliberate order for explanation clarity).
  const ids = shuffle(all.map(q => q.id)).slice(0, limit);

  const attempt = await db.attempt.create({
    data: {
      userId: userId ?? null,
      guestToken: !userId ? guestToken : null,
      examId: exam.id,
      mode: data.mode,
      isTeaser: !!data.teaser,
      questionIds: ids,
      durationSec: data.mode === 'EXAM' ? exam.durationMinutes * 60 : 0,
      expiresAt: data.mode === 'EXAM' ? new Date(Date.now() + exam.durationMinutes * 60_000) : null,
      responses: {}
    }
  });
  return NextResponse.json({ attemptId: attempt.id });
}
