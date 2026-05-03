import { Tier } from '@prisma/client';
import { db } from './db';
import { sendPurchaseEmail } from './mail';
import { genVoucherCode, tierLabel } from './utils';
import { renderVoucherPdf } from './voucher-pdf';

export async function fulfillOrder(orderId: string, paypalPayload: any, paypalCaptureId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { exam: true, user: true }
    });
    if (!order) throw new Error('Order missing');
    if (order.status === 'PAID') return order;

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'PAID', paypalCaptureId, paypalPayload, capturedAt: new Date() }
    });

    const tiersToGrant: Tier[] = order.tier === 'BUNDLE' ? ['PRACTICE', 'VOUCHER'] : [order.tier];
    let voucherCode: string | undefined;

    for (const tier of tiersToGrant) {
      const code = tier === 'VOUCHER' ? genVoucherCode() : null;
      await tx.entitlement.upsert({
        where: { userId_examId_tier: { userId: order.userId, examId: order.examId, tier } },
        update: code ? { voucher: code } : {},
        create: { userId: order.userId, examId: order.examId, tier, voucher: code }
      });
      if (code) voucherCode = code;
    }

    let voucherPdf: Buffer | undefined;
    if (voucherCode) {
      const examWithVendor = await tx.exam.findUnique({ where: { id: order.examId }, include: { vendor: true } });
      if (examWithVendor) {
        try {
          voucherPdf = await renderVoucherPdf({
            examTitle: examWithVendor.title,
            examCode: examWithVendor.code,
            vendor: examWithVendor.vendor.name,
            voucherCode,
            buyerName: order.user.name,
            buyerEmail: order.user.email
          });
        } catch { /* non-fatal */ }
      }
    }
    await sendPurchaseEmail(order.user.email, order.exam.title, tierLabel(order.tier), voucherCode, voucherPdf).catch(() => {});
    return order;
  });
}
