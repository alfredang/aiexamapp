import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { Responses } from '@/lib/attempts';

const Body = z.object({ attemptId: z.string(), questionId: z.string(), flagged: z.boolean() });

export async function POST(req: Request) {
  const data = Body.parse(await req.json());
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const attempt = await db.attempt.findUnique({ where: { id: data.attemptId } });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (attempt.userId) {
    if (attempt.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } else {
    const gt = (await cookies()).get('gt')?.value;
    if (!gt || gt !== attempt.guestToken) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const prev = (attempt.responses as Responses) || {};
  const next: Responses = {
    ...prev,
    [data.questionId]: { answer: prev[data.questionId]?.answer || [], flagged: data.flagged, timeSpent: prev[data.questionId]?.timeSpent }
  };
  await db.attempt.update({ where: { id: attempt.id }, data: { responses: next as any, lastSavedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
