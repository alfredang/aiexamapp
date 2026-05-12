import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { runDueDeliveries } from '@/lib/scheduling/voucher-delivery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron worker for voucher delivery sweeps. Accepts either:
 *  - Admin session cookie (manual "Run now" button), or
 *  - X-Worker-Secret header matching WORKER_SHARED_SECRET (external scheduler).
 *
 * Sweeps up to `limit` SCHEDULED rows that are due, emails the recipients,
 * and bumps delivery state.
 */
async function authorize(req: Request): Promise<{ ok: boolean; adminId?: string }> {
  const headerSecret = req.headers.get('x-worker-secret');
  const expected = await getSetting('WORKER_SHARED_SECRET');
  if (expected && headerSecret && headerSecret === expected) return { ok: true };
  const session = await auth();
  const user = session?.user as any;
  if (user?.role === 'ADMIN') return { ok: true, adminId: user.id };
  return { ok: false };
}

export async function POST(req: Request) {
  const a = await authorize(req);
  if (!a.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 50)));
  const result = await runDueDeliveries(limit);
  if (a.adminId) {
    await db.adminLog.create({
      data: {
        adminId: a.adminId,
        action: 'voucher.delivery.run',
        targetType: 'VoucherDelivery',
        targetId: null,
        metadata: { limit, ...result } as any
      }
    });
  }
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  // Convenience for browser/cron services that prefer GET.
  return POST(req);
}
