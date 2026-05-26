import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One-shot, narrowly-scoped admin endpoint to retire the three
 * Microsoft cert bundles whose underlying certs were retired by
 * Microsoft itself (per drift audit 2026-05-20). Hardcoded slug list
 * — does not accept user-supplied slugs — so this endpoint can only
 * affect these three rows, no others.
 *
 * Behaviour per bundle:
 *   1. Look up by slug.
 *   2. Refuse if `published === true` (defensive — these have been
 *      sitting at `published:false` since PR #57; if any are live
 *      again, something has drifted and we should NOT silently delete).
 *   3. Refuse if `_count.orders > 0`. The existing admin UI server
 *      action would soft-disable instead; we don't repeat that here
 *      since these are already at `published:false`. We surface the
 *      order count so the operator can decide what to do (typically:
 *      leave the bundle alone — orders preserve fulfilment history).
 *   4. Otherwise: delete BundleItem rows, then delete the Bundle row.
 *      Hard removal, irreversible. Writes one AdminLog entry per
 *      action with the deleted slug + final action.
 *
 * Idempotent: a bundle already deleted returns `not-found` on the
 * next call.
 *
 * `dryRun: true` returns the plan without executing — use this once
 * to preview before the real call.
 *
 * POST /api/admin/delete-retired-bundles
 * Body: { dryRun?: boolean }
 */

const RETIRED_BUNDLE_SLUGS = [
  'microsoft-ai-102', // AI-102 retired by Microsoft (drift audit 2026-05-20)
  'microsoft-dp-100', // DP-100 retired by Microsoft
  'microsoft-dp-203'  // DP-203 retired by Microsoft
] as const;

type Result = {
  slug: string;
  action: 'hard-deleted' | 'refused-still-published' | 'refused-has-orders' | 'not-found' | 'would-hard-delete';
  orderCount?: number;
  itemCount?: number;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let dryRun = false;
  try {
    const body = await req.json().catch(() => ({}));
    dryRun = body?.dryRun === true;
  } catch {
    /* tolerate missing/invalid body */
  }

  const results: Result[] = [];

  for (const slug of RETIRED_BUNDLE_SLUGS) {
    const bundle = await db.bundle.findUnique({
      where: { slug },
      include: { _count: { select: { orders: true, items: true } } }
    });
    if (!bundle) {
      results.push({ slug, action: 'not-found' });
      continue;
    }
    // Defensive guard: never hard-delete a bundle that's currently
    // customer-visible, even if its slug is on the hardcoded list. If
    // someone manually re-published one of these, it's a deliberate
    // signal we should respect — flag, don't delete.
    if (bundle.published) {
      results.push({
        slug,
        action: 'refused-still-published',
        orderCount: bundle._count.orders,
        itemCount: bundle._count.items
      });
      continue;
    }
    if (bundle._count.orders > 0) {
      results.push({
        slug,
        action: 'refused-has-orders',
        orderCount: bundle._count.orders,
        itemCount: bundle._count.items
      });
      continue;
    }

    if (dryRun) {
      results.push({
        slug,
        action: 'would-hard-delete',
        orderCount: bundle._count.orders,
        itemCount: bundle._count.items
      });
      continue;
    }

    // Execute: delete items first (FK), then the bundle.
    await db.bundleItem.deleteMany({ where: { bundleId: bundle.id } });
    await db.bundle.delete({ where: { id: bundle.id } });
    results.push({
      slug,
      action: 'hard-deleted',
      orderCount: 0,
      itemCount: bundle._count.items
    });
    await db.adminLog.create({
      data: {
        adminId: user.id!,
        action: 'bundle.hard-delete-retired',
        targetType: 'Bundle',
        targetId: bundle.id,
        metadata: {
          slug: bundle.slug,
          itemCount: bundle._count.items,
          reason: 'retired-cert (drift audit 2026-05-20)'
        }
      }
    });
  }

  const deleted = results.filter((r) => r.action === 'hard-deleted').length;
  return NextResponse.json({
    ok: true,
    dryRun,
    summary: { deleted, total: RETIRED_BUNDLE_SLUGS.length },
    results
  });
}
