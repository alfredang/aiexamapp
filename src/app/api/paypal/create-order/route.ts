import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createOrder } from '@/lib/paypal';
import { priceForTier } from '@/lib/utils';

const Body = z.object({
  examId: z.string(),
  tier: z.enum(['PRACTICE', 'BUNDLE', 'VOUCHER']),
  billingAddressId: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { examId, tier, billingAddressId } = Body.parse(await req.json());

  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam || !exam.published) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  const amount = priceForTier(exam, tier);
  if (!amount) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

  if (billingAddressId) {
    const addr = await db.billingAddress.findUnique({ where: { id: billingAddressId } });
    if (!addr || addr.userId !== userId) {
      return NextResponse.json({ error: 'Invalid billing address' }, { status: 400 });
    }
  }

  const paypal = await createOrder(amount, 'USD', `${examId}:${tier}`);
  const order = await db.order.create({
    data: {
      userId,
      examId,
      tier,
      amount,
      currency: 'USD',
      status: 'PENDING',
      provider: 'PAYPAL',
      paypalOrderId: paypal.id,
      providerOrderId: paypal.id,
      billingAddressId: billingAddressId || null
    }
  });
  return NextResponse.json({ orderId: order.id, paypalOrderId: paypal.id });
}
