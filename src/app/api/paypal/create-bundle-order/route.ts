import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createOrder } from '@/lib/paypal';

const Body = z.object({
  bundleId: z.string(),
  tier: z.enum(['PRACTICE', 'VOUCHER']).optional()
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { bundleId, tier } = Body.parse(await req.json());
  const bundle = await db.bundle.findUnique({ where: { id: bundleId } });
  if (!bundle || !bundle.published) return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });

  // Tier-aware pricing. VOUCHER tier requires the bundle to offer one;
  // otherwise default to the PRACTICE price.
  let amount: number;
  let orderTier: 'PRACTICE' | 'VOUCHER' | null;
  if (tier === 'VOUCHER' && bundle.priceVoucher != null) {
    amount = bundle.priceVoucher;
    orderTier = 'VOUCHER';
  } else {
    amount = bundle.price;
    orderTier = tier === 'PRACTICE' ? 'PRACTICE' : null;
  }

  const paypal = await createOrder(amount, 'USD', `bundle:${bundleId}${orderTier ? `:${orderTier}` : ''}`);
  const order = await db.order.create({
    data: {
      userId,
      bundleId,
      tier: orderTier,
      amount,
      currency: 'USD',
      status: 'PENDING',
      paypalOrderId: paypal.id
    }
  });
  return NextResponse.json({ orderId: order.id, paypalOrderId: paypal.id });
}
