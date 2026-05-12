import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhook } from '@/lib/paypal';
import { fulfillOrder } from '@/lib/fulfill';
import {
  logWebhookReceived,
  markWebhookFailed,
  markWebhookIgnored,
  markWebhookProcessed
} from '@/lib/payments/webhook-log';

export async function POST(req: Request) {
  const body = await req.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Log first so payloads are preserved even when verification or
  // processing later throws.
  const log = await logWebhookReceived({
    provider: 'PAYPAL',
    eventId: parsed.id ?? null,
    eventType: parsed.event_type ?? 'unknown',
    payload: parsed
  });

  // Skip rework if a previous delivery already processed this event id.
  if (log.status === 'PROCESSED') return NextResponse.json({ ok: true, dedup: true });

  try {
    const ok = await verifyWebhook(req.headers, body);
    if (!ok) {
      await markWebhookFailed(log.id, 'PayPal signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (
      parsed.event_type === 'PAYMENT.CAPTURE.COMPLETED' ||
      parsed.event_type === 'CHECKOUT.ORDER.APPROVED'
    ) {
      const paypalOrderId =
        parsed.resource?.supplementary_data?.related_ids?.order_id || parsed.resource?.id;
      const txnId = parsed.resource?.id;
      if (paypalOrderId) {
        const order = await db.order.findUnique({ where: { paypalOrderId } });
        if (order) {
          if (order.status !== 'PAID') {
            await fulfillOrder(order.id, parsed, txnId);
          }
          await markWebhookProcessed(log.id, { orderId: order.id });
          return NextResponse.json({ ok: true });
        }
      }
      await markWebhookIgnored(log.id, 'No matching order found');
    } else {
      await markWebhookIgnored(log.id, `Unhandled event_type: ${parsed.event_type}`);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await markWebhookFailed(log.id, String(err?.message ?? err));
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
