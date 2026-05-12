import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { notify } from '@/lib/admin-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron route that:
 *   1) Marks voucher inventory rows as EXPIRED when expiresAt < now and
 *      they're still AVAILABLE/RESERVED. (ASSIGNED rows are kept as-is.)
 *   2) Posts an AdminNotification for each (vendor, exam) bucket where
 *      AVAILABLE inventory dropped to or below a configurable threshold.
 *
 * Secured the same way as the voucher-delivery worker (admin session OR
 * X-Worker-Secret header).
 */
async function authorize(req: Request): Promise<boolean> {
  const headerSecret = req.headers.get('x-worker-secret');
  const expected = await getSetting('WORKER_SHARED_SECRET');
  if (expected && headerSecret && headerSecret === expected) return true;
  const session = await auth();
  return (session?.user as any)?.role === 'ADMIN';
}

export async function POST(req: Request) {
  if (!(await authorize(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const now = new Date();
  const expired = await db.voucherInventory.updateMany({
    where: { status: { in: ['AVAILABLE', 'RESERVED'] }, expiresAt: { not: null, lt: now } },
    data: { status: 'EXPIRED' }
  });

  // Low-stock per (vendorId, examId) bucket.
  const groups = await db.voucherInventory.groupBy({
    by: ['vendorId', 'examId'],
    where: { status: 'AVAILABLE' },
    _count: true
  });
  let alerted = 0;
  for (const g of groups) {
    if ((g._count as unknown as number) <= 2) {
      const vendor = await db.vendor.findUnique({ where: { id: g.vendorId }, select: { name: true } });
      const exam = g.examId
        ? await db.exam.findUnique({ where: { id: g.examId }, select: { code: true } })
        : null;
      const scope = `${vendor?.name ?? 'Vendor'}${exam ? ` · ${exam.code}` : ''}`;
      await notify({
        kind: 'inventory.low',
        title: `Voucher inventory low (${g._count} left)`,
        body: `Scope: ${scope}. Upload more codes before it runs out.`,
        link: '/admin-dashboard/vouchers/inventory'
      });
      alerted++;
    }
  }
  return NextResponse.json({ ok: true, expired: expired.count, alerted });
}

export async function GET(req: Request) {
  return POST(req);
}
