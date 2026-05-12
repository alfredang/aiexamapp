import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { priceForTier } from '@/lib/utils';
import { buildSgqrPayload, getMerchantConfig, isEnabled, renderQrDataUrl } from '@/lib/payments/paynow';

export const runtime = 'nodejs';

const Body = z.object({
  examId: z.string().optional(),
  bundleId: z.string().optional(),
  tier: z.enum(['PRACTICE', 'BUNDLE', 'VOUCHER']).optional(),
  billingAddressId: z.string().optional().nullable()
});

export async function POST(req: Request) {
  if (!(await isEnabled())) return NextResponse.json({ error: 'paynow-disabled' }, { status: 400 });
  const session = await auth();
  const user = session?.user as any;
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { examId, bundleId, tier, billingAddressId } = Body.parse(await req.json());
  if (!examId && !bundleId) return NextResponse.json({ error: 'product-required' }, { status: 400 });

  if (billingAddressId) {
    const addr = await db.billingAddress.findUnique({ where: { id: billingAddressId } });
    if (!addr || addr.userId !== user.id) return NextResponse.json({ error: 'invalid-address' }, { status: 400 });
  }

  let amount: number;
  let orderTier: 'PRACTICE' | 'BUNDLE' | 'VOUCHER' | null = null;

  if (examId) {
    const exam = await db.exam.findUnique({ where: { id: examId } });
    if (!exam || !exam.published) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    const t = (tier ?? 'PRACTICE') as 'PRACTICE' | 'BUNDLE' | 'VOUCHER';
    amount = priceForTier(exam, t);
    if (!amount) return NextResponse.json({ error: 'invalid-tier' }, { status: 400 });
    orderTier = t;
  } else {
    const bundle = await db.bundle.findUnique({ where: { id: bundleId! } });
    if (!bundle || !bundle.published) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    if (tier === 'VOUCHER' && bundle.priceVoucher != null) {
      amount = bundle.priceVoucher; orderTier = 'VOUCHER';
    } else {
      amount = bundle.price; orderTier = tier === 'PRACTICE' ? 'PRACTICE' : null;
    }
  }

  const merchant = await getMerchantConfig();
  if (!merchant.uen) return NextResponse.json({ error: 'paynow-uen-not-configured' }, { status: 500 });

  const order = await db.order.create({
    data: {
      userId: user.id,
      examId: examId ?? null,
      bundleId: bundleId ?? null,
      tier: orderTier,
      amount,
      currency: 'SGD',
      status: 'PENDING',
      provider: 'PAYNOW',
      billingAddressId: billingAddressId || null
    }
  });

  const payload = buildSgqrPayload({
    uen: merchant.uen,
    amount,
    reference: order.id,
    merchantName: merchant.merchantName,
    merchantCity: merchant.merchantCity
  });
  const dataUrl = await renderQrDataUrl(payload);

  await db.order.update({
    where: { id: order.id },
    data: { providerOrderId: order.id, providerPayload: { sgqr: payload } }
  });

  return NextResponse.json({
    orderId: order.id,
    amount,
    currency: 'SGD',
    reference: order.id,
    sgqr: payload,
    qrDataUrl: dataUrl
  });
}
