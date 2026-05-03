import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { Responses } from '@/lib/attempts';

const Body = z.object({
  attemptId: z.string(),
  responses: z.record(z.string(), z.object({
    answer: z.array(z.string()),
    flagged: z.boolean().optional(),
    timeSpent: z.number().optional()
  }))
});

export async function POST(req: Request) {
  const data = Body.parse(await req.json());
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const attempt = await db.attempt.findUnique({ where: { id: data.attemptId } });
  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  if (attempt.userId) {
    if (attempt.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } else {
    const gt = (await cookies()).get('gt')?.value;
    if (!gt || gt !== attempt.guestToken) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (attempt.submittedAt) return NextResponse.json({ error: 'Already submitted' }, { status: 400 });

  await db.attempt.update({
    where: { id: attempt.id },
    data: { responses: data.responses as Responses as any, lastSavedAt: new Date() }
  });
  return NextResponse.json({ ok: true });
}
