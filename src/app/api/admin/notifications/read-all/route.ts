import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await db.adminNotification.updateMany({
    where: { readAt: null },
    data: { readAt: new Date() }
  });
  return NextResponse.json({ ok: true });
}
