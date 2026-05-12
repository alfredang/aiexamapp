import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { renderInvoicePdf } from '@/lib/invoice/render-invoice-pdf';
import { buildInvoiceLines } from '@/lib/invoice/build-lines';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { order: { select: { number: true } } }
  });
  if (!invoice) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const lines = await buildInvoiceLines(invoice);
  const pdf = await renderInvoicePdf({ invoice, lines, orderNumber: invoice.order.number });
  return new NextResponse(pdf as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.number}.pdf"`
    }
  });
}
