import { Tier } from '@prisma/client';
import { db } from './db';
import { sendPurchaseEmail } from './mail';
import { tierLabel } from './utils';

export async function fulfillOrder(orderId: string, paypalPayload: any, paypalCaptureId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        exam: true,
        user: true,
        bundle: { include: { items: { include: { exam: { include: { vendor: true } } } } } }
      }
    });
    if (!order) throw new Error('Order missing');
    if (order.status === 'PAID') return order;

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'PAID', paypalCaptureId, paypalPayload, capturedAt: new Date() }
    });

    // Voucher delivery model: VOUCHER-tier entitlements are created with
    // `voucher: null` (pending). An admin issues the real code later via
    // /admin/vouchers. The buyer is told "3-5 business days" up front.

    // Bundle orders: write one entitlement per bundle item.
    if (order.bundleId && order.bundle) {
      let bundleHasVoucher = false;
      for (const item of order.bundle.items) {
        await tx.entitlement.upsert({
          where: { userId_examId_tier: { userId: order.userId, examId: item.examId, tier: item.tier } },
          update: {},
          create: { userId: order.userId, examId: item.examId, tier: item.tier, voucher: null }
        });
        if (item.tier === 'VOUCHER') bundleHasVoucher = true;
      }
      await sendPurchaseEmail(
        order.user.email,
        order.bundle.title,
        'Bundle',
        undefined,
        undefined,
        bundleHasVoucher
      ).catch(() => {});
      return order;
    }

    // Single-exam order.
    if (!order.examId || !order.tier || !order.exam) {
      throw new Error('Order has neither bundleId nor examId+tier');
    }
    // Tier → entitlements granted on fulfillment:
    //   PRACTICE  → PRACTICE only
    //   BUNDLE    → PRACTICE + VOUCHER (legacy combined product)
    //   VOUCHER   → PRACTICE + VOUCHER (per the "voucher includes practice" rule)
    const tiersToGrant: Tier[] =
      order.tier === 'BUNDLE' || order.tier === 'VOUCHER'
        ? ['PRACTICE', 'VOUCHER']
        : [order.tier];

    for (const tier of tiersToGrant) {
      await tx.entitlement.upsert({
        where: { userId_examId_tier: { userId: order.userId, examId: order.examId, tier } },
        update: {},
        create: { userId: order.userId, examId: order.examId, tier, voucher: null }
      });
    }

    const voucherPending = tiersToGrant.includes('VOUCHER');
    await sendPurchaseEmail(
      order.user.email,
      order.exam.title,
      tierLabel(order.tier),
      undefined,
      undefined,
      voucherPending
    ).catch(() => {});
    return order;
  });
}
