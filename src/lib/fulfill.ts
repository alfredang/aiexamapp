import { Tier } from '@prisma/client';
import { db } from './db';
import { sendPurchaseEmail } from './mail';
import { genVoucherCode, tierLabel } from './utils';
import { renderVoucherPdf } from './voucher-pdf';

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

    // Bundle orders: write one entitlement per bundle item, then send a
    // single purchase email summarising what was granted.
    if (order.bundleId && order.bundle) {
      const voucherCodes: { examTitle: string; examCode: string; vendor: string; code: string }[] = [];
      for (const item of order.bundle.items) {
        const code = item.tier === 'VOUCHER' ? genVoucherCode() : null;
        await tx.entitlement.upsert({
          where: { userId_examId_tier: { userId: order.userId, examId: item.examId, tier: item.tier } },
          update: code ? { voucher: code } : {},
          create: { userId: order.userId, examId: item.examId, tier: item.tier, voucher: code }
        });
        if (code) {
          voucherCodes.push({
            examTitle: item.exam.title,
            examCode: item.exam.code,
            vendor: item.exam.vendor.name,
            code
          });
        }
      }
      // Render voucher PDFs for each VOUCHER entitlement granted by the bundle.
      const pdfs: { code: string; pdf: Buffer }[] = [];
      for (const v of voucherCodes) {
        try {
          const pdf = await renderVoucherPdf({
            examTitle: v.examTitle,
            examCode: v.examCode,
            vendor: v.vendor,
            voucherCode: v.code,
            buyerName: order.user.name,
            buyerEmail: order.user.email
          });
          pdfs.push({ code: v.code, pdf });
        } catch { /* non-fatal */ }
      }
      // Reuse existing single-exam purchase email shape — pass the first
      // voucher's PDF (most bundles are designed with at most one voucher
      // per the boss's spec). If there are more, the others still arrive
      // as text codes in the user's My Content / Vouchers page.
      const firstVoucher = voucherCodes[0]?.code;
      const firstPdf = pdfs[0]?.pdf;
      await sendPurchaseEmail(order.user.email, order.bundle.title, 'Bundle', firstVoucher, firstPdf).catch(() => {});
      return order;
    }

    // Single-exam order (existing behaviour, unchanged).
    if (!order.examId || !order.tier || !order.exam) {
      throw new Error('Order has neither bundleId nor examId+tier');
    }
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
