import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fulfillOrder } from '@/lib/fulfill';
import { logWebhookReceived, markWebhookProcessed, markWebhookFailed } from '@/lib/payments/webhook-log';

export const runtime = 'nodejs';

const Body = z.object({ orderId: z.string(), reference: z.string().optional() });

// Admin-only manual confirmation. PayNow has no automated webhook for
// unincorporated merchants — admin reconciles via bank app then marks paid.
export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { orderId, reference } = Body.parse(await req.json());
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  if (order.provider !== 'PAYNOW') return NextResponse.json({ error: 'wrong-provider' }, { status: 400 });
  if (order.status === 'PAID') return NextResponse.json({ ok: true, already: true });

  const log = await logWebhookReceived({
    provider: 'PAYNOW',
    eventId: `manual-${order.id}-${Date.now()}`,
    eventType: 'manual.confirm',
    payload: { orderId: order.id, reference: reference ?? null, byAdminId: user.id },
    orderId: order.id
  });
  try {
    await fulfillOrder(
      order.id,
      { manualConfirm: true, reference: reference ?? null, byAdminId: user.id },
      reference || order.id
    );
    await db.adminLog.create({
      data: {
        adminId: user.id,
        action: 'paynow.confirm',
        targetType: 'Order',
        targetId: order.id,
        metadata: { reference: reference ?? null }
      }
    });
    await markWebhookProcessed(log.id, { orderId: order.id });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await markWebhookFailed(log.id, String(err?.message ?? err));
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
