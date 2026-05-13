import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status');
  const status = statusParam === 'APPROVED' || statusParam === 'REJECTED' || statusParam === 'PENDING' ? statusParam : undefined;
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
  const items = await db.review.findMany({
    where: { status, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      user: { select: { id: true, email: true, name: true } },
      exam: { select: { id: true, code: true, title: true, slug: true, vendor: { select: { slug: true, name: true } } } }
    }
  });
  return NextResponse.json({ ok: true, items });
}
