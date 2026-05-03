import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhook } from '@/lib/paypal';
import { fulfillOrder } from '@/lib/fulfill';

export async function POST(req: Request) {
  const body = await req.text();
  const ok = await verifyWebhook(req.headers, body);
  if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

  const event = JSON.parse(body);
  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED' || event.event_type === 'CHECKOUT.ORDER.APPROVED') {
    const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id;
    const txnId = event.resource?.id;
    if (paypalOrderId) {
      const order = await db.order.findUnique({ where: { paypalOrderId } });
      if (order && order.status !== 'PAID') {
        await fulfillOrder(order.id, event, txnId).catch(() => {});
      }
    }
  }
  return NextResponse.json({ ok: true });
}
