import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const { id } = await ctx.params;
  const r = await db.review.findUnique({ where: { id }, select: { userId: true } });
  if (!r) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  if (r.userId !== userId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  await db.review.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
