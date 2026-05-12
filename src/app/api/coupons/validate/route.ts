import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { evaluateCoupon } from '@/lib/coupons';
import { priceForTier } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const Body = z.object({
  code: z.string().min(1).max(64),
  examId: z.string().optional(),
  bundleId: z.string().optional(),
  tier: z.enum(['PRACTICE', 'BUNDLE', 'VOUCHER']).optional()
});

/**
 * Public endpoint used by the checkout client. Returns the discount that
 * WOULD be applied right now — server-side computed so the price the user
 * sees in checkout matches what gets persisted on order-create.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const body = Body.parse(await req.json().catch(() => ({})));

  let subtotal = 0;
  let examId: string | null = null;
  let vendorId: string | null = null;

  if (body.examId && body.tier) {
    const exam = await db.exam.findUnique({ where: { id: body.examId }, select: { id: true, vendorId: true, pricePractice: true, priceBundle: true, priceVoucher: true } });
    if (!exam) return NextResponse.json({ ok: false, reason: 'invalid_product', message: 'Exam not found.' }, { status: 400 });
    subtotal = priceForTier(exam as any, body.tier);
    examId = exam.id;
    vendorId = exam.vendorId;
  } else if (body.bundleId) {
    const bundle = await db.bundle.findUnique({
      where: { id: body.bundleId },
      include: { items: { include: { exam: { select: { vendorId: true } } } } }
    });
    if (!bundle) return NextResponse.json({ ok: false, reason: 'invalid_product', message: 'Bundle not found.' }, { status: 400 });
    subtotal = body.tier === 'VOUCHER' && bundle.priceVoucher != null ? bundle.priceVoucher : bundle.price;
    // For vendor-scoped coupons on bundles we'd need a single vendor. Skip scope checks if mixed.
    const vendorIds = new Set(bundle.items.map((i) => i.exam.vendorId));
    vendorId = vendorIds.size === 1 ? [...vendorIds][0] : null;
  } else {
    return NextResponse.json({ ok: false, reason: 'invalid_product', message: 'No product supplied.' }, { status: 400 });
  }

  const result = await evaluateCoupon({ code: body.code, userId: userId ?? null, examId, vendorId, subtotalCents: subtotal });
  if (!result.ok) {
    return NextResponse.json(result, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    code: result.code,
    discountCents: result.discountCents,
    subtotalCents: subtotal,
    totalCents: Math.max(0, subtotal - result.discountCents)
  });
}
