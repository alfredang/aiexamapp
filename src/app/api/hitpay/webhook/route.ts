import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhook } from '@/lib/payments/hitpay';
import { fulfillOrder } from '@/lib/fulfill';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// HitPay posts application/x-www-form-urlencoded with an `hmac` signature.
export async function POST(req: Request) {
  const raw = await req.text();
  const form: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(raw).entries()) form[k] = v;

  const verified = await verifyWebhook(form);
  if (!verified) return NextResponse.json({ error: 'invalid-signature' }, { status: 400 });

  const status = verified.status;
  const paymentRequestId = verified.payment_request_id || verified.reference || '';
  const paymentId = verified.payment_id || '';
  const reference = verified.reference_number || '';

  // Resolve the order. Prefer reference_number (our Order.id), fall back to the
  // payment_request_id we stored on create.
  const order =
    (reference && (await db.order.findUnique({ where: { id: reference } }))) ||
    (paymentRequestId
      ? await db.order.findUnique({
          where: { provider_providerOrderId: { provider: 'HITPAY', providerOrderId: paymentRequestId } }
        })
      : null);

  if (!order) return NextResponse.json({ error: 'unknown-order' }, { status: 404 });

  if (status === 'completed' || status === 'succeeded') {
    await fulfillOrder(order.id, verified, paymentId);
    await db.order.update({
      where: { id: order.id },
      data: { providerCaptureId: paymentId, providerPayload: verified }
    });
  } else if (status === 'failed' || status === 'cancelled') {
    await db.order.update({ where: { id: order.id }, data: { status: 'FAILED', providerPayload: verified } });
  }

  return NextResponse.json({ ok: true });
}
