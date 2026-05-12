import { db } from '@/lib/db';
import type { Prisma, PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export type EvaluateInput = {
  code: string;
  userId?: string | null;
  examId?: string | null;
  vendorId?: string | null;
  /** Cents — the order price BEFORE discount. */
  subtotalCents: number;
};

export type EvaluateOk = {
  ok: true;
  couponId: string;
  code: string;
  discountCents: number;
  appliesScope: 'GLOBAL' | 'EXAM' | 'VENDOR';
};

export type EvaluateFail = {
  ok: false;
  reason:
    | 'not_found'
    | 'disabled'
    | 'expired'
    | 'not_yet_active'
    | 'min_subtotal'
    | 'max_redemptions'
    | 'per_user_limit'
    | 'wrong_scope'
    | 'invalid_value';
  message: string;
};

export type EvaluateResult = EvaluateOk | EvaluateFail;

/**
 * Pure read-only check. Use this in checkout to validate before showing
 * a "promo applied" pill, and again at order-create time before persisting.
 * Always re-validates server-side; never trust a client-supplied price.
 */
export async function evaluateCoupon(input: EvaluateInput, dbc?: DbClient): Promise<EvaluateResult> {
  const client = dbc ?? db;
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, reason: 'not_found', message: 'No code supplied.' };

  const coupon = await client.coupon.findUnique({
    where: { code },
    include: { redemptions: { select: { userId: true } }, _count: { select: { redemptions: true } } }
  });
  if (!coupon) return { ok: false, reason: 'not_found', message: 'Invalid promo code.' };
  if (!coupon.enabled) return { ok: false, reason: 'disabled', message: 'This promo code is disabled.' };

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    return { ok: false, reason: 'not_yet_active', message: 'This promo code is not active yet.' };
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    return { ok: false, reason: 'expired', message: 'This promo code has expired.' };
  }
  if (input.subtotalCents < coupon.minSubtotal) {
    return {
      ok: false,
      reason: 'min_subtotal',
      message: `Minimum order of ${(coupon.minSubtotal / 100).toFixed(2)} required.`
    };
  }
  if (coupon.maxRedemptions != null && coupon._count.redemptions >= coupon.maxRedemptions) {
    return { ok: false, reason: 'max_redemptions', message: 'This promo code has reached its redemption limit.' };
  }
  if (coupon.scope === 'EXAM') {
    if (!input.examId || coupon.scopeExamId !== input.examId) {
      return { ok: false, reason: 'wrong_scope', message: 'This promo code does not apply to this exam.' };
    }
  } else if (coupon.scope === 'VENDOR') {
    if (!input.vendorId || coupon.scopeVendorId !== input.vendorId) {
      return { ok: false, reason: 'wrong_scope', message: 'This promo code does not apply to this vendor.' };
    }
  }
  if (input.userId && coupon.perUserLimit != null) {
    const used = coupon.redemptions.filter((r) => r.userId === input.userId).length;
    if (used >= coupon.perUserLimit) {
      return { ok: false, reason: 'per_user_limit', message: 'You have already used this promo code.' };
    }
  }

  // Compute discount, clamped to subtotal so we never go negative.
  let discountCents: number;
  if (coupon.kind === 'PERCENT') {
    if (coupon.value < 0 || coupon.value > 100) {
      return { ok: false, reason: 'invalid_value', message: 'Coupon value is misconfigured.' };
    }
    discountCents = Math.round((input.subtotalCents * coupon.value) / 100);
  } else {
    if (coupon.value < 0) {
      return { ok: false, reason: 'invalid_value', message: 'Coupon value is misconfigured.' };
    }
    discountCents = Math.min(coupon.value, input.subtotalCents);
  }
  discountCents = Math.max(0, Math.min(discountCents, input.subtotalCents));

  return {
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    discountCents,
    appliesScope: coupon.scope
  };
}

/**
 * Persist the redemption + link it to the order. Call inside the same
 * transaction as the Order.create so partial failure rolls back atomically.
 */
export async function recordCouponRedemption(
  input: { couponId: string; userId: string; orderId: string; amountCents: number },
  dbc?: DbClient
) {
  const client = dbc ?? db;
  return client.couponRedemption.create({
    data: {
      couponId: input.couponId,
      userId: input.userId,
      orderId: input.orderId,
      amount: input.amountCents
    }
  });
}
