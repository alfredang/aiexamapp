import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { captureOrder } from '@/lib/paypal';
import { fulfillOrder } from '@/lib/fulfill';

const Body = z.object({ paypalOrderId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { paypalOrderId } = Body.parse(await req.json());
  const order = await db.order.findUnique({ where: { paypalOrderId } });
  if (!order || order.userId !== userId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status === 'PAID') return NextResponse.json({ ok: true, orderId: order.id });

  const capture = await captureOrder(paypalOrderId);
  const txnId = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || capture.id;

  await fulfillOrder(order.id, capture, txnId);
  return NextResponse.json({ ok: true, orderId: order.id });
}
