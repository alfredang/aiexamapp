import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ items: [], unread: 0 });
  const [items, unread] = await Promise.all([
    db.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    db.adminNotification.count({ where: { readAt: null } })
  ]);
  return NextResponse.json({ items, unread });
}
