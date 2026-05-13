import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const items = await db.faq.findMany({ orderBy: { position: 'asc' } });
  return NextResponse.json({ ok: true, items });
}
