import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, select: { id: true, userId: true, status: true } });
  if (!order || order.userId !== userId) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json({ id: order.id, status: order.status });
}
