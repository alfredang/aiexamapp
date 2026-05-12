import { db } from '@/lib/db';
import { tierLabel } from '@/lib/utils';
import type { InvoiceLine } from './render-invoice-pdf';
import type { Invoice } from '@prisma/client';

/**
 * Reconstruct the single-line summary for an invoice from its linked Order.
 * Phase 1.1 has one line per order (since orders are single-product today).
 * Phase 3 may introduce multiple line items per order; this function is the
 * single seam to extend.
 */
export async function buildInvoiceLines(invoice: Invoice): Promise<InvoiceLine[]> {
  const order = await db.order.findUnique({
    where: { id: invoice.orderId },
    include: { exam: true, bundle: true, coupon: { select: { code: true } } }
  });
  if (!order) return [{ description: 'Order', qty: 1, unitAmount: invoice.subtotal }];

  const product = order.bundle
    ? `${order.bundle.title} (bundle)`
    : order.exam
      ? `${order.exam.title} (${order.exam.code})`
      : 'Order';
  const tier = order.bundle ? 'Bundle' : order.tier ? tierLabel(order.tier) : '';
  const base = tier ? `${product} — ${tier}` : product;
  const description = order.coupon
    ? `${base} (promo ${order.coupon.code} −${(order.discount / 100).toFixed(2)})`
    : base;

  return [{ description, qty: 1, unitAmount: invoice.subtotal }];
}
