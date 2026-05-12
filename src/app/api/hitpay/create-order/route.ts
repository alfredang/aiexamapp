import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { priceForTier } from '@/lib/utils';
import { createPaymentRequest, isEnabled } from '@/lib/payments/hitpay';

export const runtime = 'nodejs';

const Body = z.object({
  examId: z.string().optional(),
  bundleId: z.string().optional(),
  tier: z.enum(['PRACTICE', 'BUNDLE', 'VOUCHER']).optional(),
  billingAddressId: z.string().optional().nullable()
});

export async function POST(req: Request) {
  if (!(await isEnabled())) return NextResponse.json({ error: 'hitpay-disabled' }, { status: 400 });
  const session = await auth();
  const user = session?.user as any;
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { examId, bundleId, tier, billingAddressId } = Body.parse(await req.json());
  if (!examId && !bundleId) return NextResponse.json({ error: 'product-required' }, { status: 400 });

  if (billingAddressId) {
    const addr = await db.billingAddress.findUnique({ where: { id: billingAddressId } });
    if (!addr || addr.userId !== user.id) {
      return NextResponse.json({ error: 'invalid-address' }, { status: 400 });
    }
  }

  let amount: number;
  let currency = 'SGD';
  let purpose: string;
  let orderTier: 'PRACTICE' | 'BUNDLE' | 'VOUCHER' | null = null;

  if (examId) {
    const exam = await db.exam.findUnique({ where: { id: examId } });
    if (!exam || !exam.published) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    const t = (tier ?? 'PRACTICE') as 'PRACTICE' | 'BUNDLE' | 'VOUCHER';
    amount = priceForTier(exam, t);
    if (!amount) return NextResponse.json({ error: 'invalid-tier' }, { status: 400 });
    currency = exam.priceVoucher ? 'SGD' : 'SGD';
    purpose = `${exam.code} ${t}`;
    orderTier = t;
  } else {
    const bundle = await db.bundle.findUnique({ where: { id: bundleId! } });
    if (!bundle || !bundle.published) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    if (tier === 'VOUCHER' && bundle.priceVoucher != null) {
      amount = bundle.priceVoucher;
      orderTier = 'VOUCHER';
    } else {
      amount = bundle.price;
      orderTier = tier === 'PRACTICE' ? 'PRACTICE' : null;
    }
    purpose = bundle.title;
  }

  const order = await db.order.create({
    data: {
      userId: user.id,
      examId: examId ?? null,
      bundleId: bundleId ?? null,
      tier: orderTier,
      amount,
      currency,
      status: 'PENDING',
      provider: 'HITPAY',
      billingAddressId: billingAddressId || null
    }
  });

  const appUrl = process.env.APP_URL || new URL(req.url).origin;
  const payment = await createPaymentRequest({
    amount,
    currency,
    email: user.email,
    name: user.name ?? undefined,
    purpose,
    referenceNumber: order.id,
    redirectUrl: `${appUrl}/api/hitpay/return?orderId=${order.id}`,
    webhookUrl: `${appUrl}/api/hitpay/webhook`
  });

  await db.order.update({
    where: { id: order.id },
    data: { providerOrderId: payment.id, providerPayload: payment.raw }
  });

  return NextResponse.json({ orderId: order.id, url: payment.url, paymentId: payment.id });
}
