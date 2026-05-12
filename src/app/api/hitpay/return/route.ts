import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Browser-side return URL after HitPay-hosted checkout. NOT the source of
// truth for fulfillment — that's the webhook. We just inspect the current
// order status and route the user accordingly.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get('orderId');
  if (!orderId) return NextResponse.redirect(new URL('/checkout/failed', url.origin));
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.redirect(new URL('/checkout/failed', url.origin));
  if (order.status === 'PAID') return NextResponse.redirect(new URL(`/checkout/success?orderId=${order.id}`, url.origin));
  if (order.status === 'FAILED') return NextResponse.redirect(new URL('/checkout/failed', url.origin));
  // Webhook may not have arrived yet. Show a processing page that polls.
  return NextResponse.redirect(new URL(`/checkout/processing?orderId=${orderId}`, url.origin));
}
