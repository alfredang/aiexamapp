import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GDPR data export — returns a single JSON document containing all rows
 * the platform holds about this user. Streams as `application/json`; the
 * admin or the user themselves can request it.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const me = session?.user as any;
  if (!me?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const isAdmin = me.role !== 'USER';
  if (!isAdmin && me.id !== id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const [user, orders, invoices, refunds, entitlements, attempts, notes, emails, consents] = await Promise.all([
    db.user.findUnique({ where: { id }, include: { billingAddresses: true, tags: { include: { tag: true } } } }),
    db.order.findMany({ where: { userId: id }, include: { coupon: true } }),
    db.invoice.findMany({ where: { userId: id } }),
    db.refund.findMany({ where: { order: { userId: id } } }),
    db.entitlement.findMany({ where: { userId: id }, include: { exam: { select: { code: true, title: true } } } }),
    db.attempt.findMany({ where: { userId: id } }),
    db.userNote.findMany({ where: { userId: id } }),
    db.emailLog.findMany({ where: { userId: id } }),
    db.consentLog.findMany({ where: { userId: id } })
  ]);
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const dump = {
    exportedAt: new Date().toISOString(),
    user,
    orders,
    invoices,
    refunds,
    entitlements,
    attempts,
    notes,
    emails,
    consents
  };

  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="user-${id}-export-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
