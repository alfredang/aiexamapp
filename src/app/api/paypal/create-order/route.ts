import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createOrder } from '@/lib/paypal';
import { priceForTier } from '@/lib/utils';
import { nextNumber } from '@/lib/numbering';
import { evaluateCoupon, recordCouponRedemption } from '@/lib/coupons';

const Body = z.object({
  examId: z.string(),
  tier: z.enum(['PRACTICE', 'BUNDLE', 'VOUCHER']),
  billingAddressId: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { examId, tier, billingAddressId, couponCode } = Body.parse(await req.json());

  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam || !exam.published) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  const subtotal = priceForTier(exam, tier);
  if (!subtotal) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

  if (billingAddressId) {
    const addr = await db.billingAddress.findUnique({ where: { id: billingAddressId } });
    if (!addr || addr.userId !== userId) {
      return NextResponse.json({ error: 'Invalid billing address' }, { status: 400 });
    }
  }

  // Server-side coupon evaluation — never trust the client's quoted price.
  let couponId: string | null = null;
  let discount = 0;
  if (couponCode) {
    const result = await evaluateCoupon({ code: couponCode, userId, examId, vendorId: exam.vendorId, subtotalCents: subtotal });
    if (!result.ok) return NextResponse.json({ error: 'coupon_invalid', reason: result.reason, message: result.message }, { status: 400 });
    couponId = result.couponId;
    discount = result.discountCents;
  }
  const amount = Math.max(0, subtotal - discount);

  const paypal = await createOrder(amount, 'USD', `${examId}:${tier}`);
  const number = await nextNumber('ORDER', 'ORD');

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number,
        userId,
        examId,
        tier,
        amount,
        currency: 'USD',
        status: 'PENDING',
        provider: 'PAYPAL',
        paypalOrderId: paypal.id,
        providerOrderId: paypal.id,
        billingAddressId: billingAddressId || null,
        couponId,
        discount
      }
    });
    if (couponId && discount > 0) {
      await recordCouponRedemption(
        { couponId, userId, orderId: created.id, amountCents: discount },
        tx
      );
    }
    return created;
  });
  return NextResponse.json({ orderId: order.id, paypalOrderId: paypal.id });
}
