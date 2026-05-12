import { PaymentProvider, Tier } from '@prisma/client';
import { db } from './db';
import { sendPurchaseEmail } from './mail';
import { tierLabel } from './utils';
import { getDelayDays } from './scheduling/voucher-delivery';

function providerLabel(p: PaymentProvider): string {
  switch (p) {
    case 'PAYPAL': return 'PayPal';
    case 'PAYNOW': return 'PayNow';
    case 'HITPAY': return 'HitPay';
    case 'TEST': return 'Test';
  }
}

export async function fulfillOrder(orderId: string, paypalPayload: any, paypalCaptureId: string) {
  // Fetch the voucher delivery delay once before opening the transaction so
  // we don't make extra DB calls per granted VOUCHER entitlement inside it.
  const delayDays = await getDelayDays();
  const scheduledFor = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);

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
    // /admin-dashboard/vouchers. The buyer is told "3-5 business days" up front.

    // Bundle orders: write one entitlement per qualifying bundle item.
    //
    // Tier filter: when a bundle ships both PRACTICE and VOUCHER items
    // (e.g. the AI-900 bundle), the buyer picks a tier at checkout. The
    // tier on the Order tells us which items to grant:
    //   - PRACTICE buyer → only items where item.tier === 'PRACTICE'
    //   - VOUCHER  buyer → ALL items (practice access + the voucher)
    //   - tier == null   → grant all items (legacy single-price bundles)
    if (order.bundleId && order.bundle) {
      const grantAllItems = !order.tier || order.tier === 'VOUCHER';
      const items = grantAllItems
        ? order.bundle.items
        : order.bundle.items.filter(i => i.tier === order.tier);
      let bundleHasVoucher = false;
      for (const item of items) {
        const ent = await tx.entitlement.upsert({
          where: { userId_examId_tier: { userId: order.userId, examId: item.examId, tier: item.tier } },
          update: {},
          create: { userId: order.userId, examId: item.examId, tier: item.tier, voucher: null }
        });
        if (item.tier === 'VOUCHER') {
          bundleHasVoucher = true;
          await tx.voucherDelivery.upsert({
            where: { entitlementId: ent.id },
            create: { entitlementId: ent.id, orderId: order.id, scheduledFor, status: 'SCHEDULED' },
            update: {}
          });
        }
      }
      await sendPurchaseEmail(
        order.user.email,
        order.bundle.title,
        'Bundle',
        undefined,
        undefined,
        bundleHasVoucher,
        {
          order: { id: order.id, amount: order.amount, currency: order.currency },
          user: { name: order.user.name, email: order.user.email },
          paymentMethod: providerLabel(order.provider)
        }
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
      const ent = await tx.entitlement.upsert({
        where: { userId_examId_tier: { userId: order.userId, examId: order.examId, tier } },
        update: {},
        create: { userId: order.userId, examId: order.examId, tier, voucher: null }
      });
      if (tier === 'VOUCHER') {
        await tx.voucherDelivery.upsert({
          where: { entitlementId: ent.id },
          create: { entitlementId: ent.id, orderId: order.id, scheduledFor, status: 'SCHEDULED' },
          update: {}
        });
      }
    }

    const voucherPending = tiersToGrant.includes('VOUCHER');
    await sendPurchaseEmail(
      order.user.email,
      order.exam.title,
      tierLabel(order.tier),
      undefined,
      undefined,
      voucherPending,
      {
        order: { id: order.id, amount: order.amount, currency: order.currency },
        user: { name: order.user.name, email: order.user.email },
        paymentMethod: providerLabel(order.provider)
      }
    ).catch(() => {});
    return order;
  });
}
