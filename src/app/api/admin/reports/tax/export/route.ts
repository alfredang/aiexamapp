import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rangeFromSearchParams } from '@/lib/reports/range-from-sp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const { range } = rangeFromSearchParams(sp);
  const invoices = await db.invoice.findMany({
    where: { issueDate: { gte: range.from, lte: range.to }, status: 'ISSUED' },
    orderBy: { issueDate: 'asc' }
  });
  const header = ['number', 'issueDate', 'customer', 'email', 'currency', 'subtotal', 'taxRate_bps', 'taxLabel', 'taxAmount', 'total', 'totalSgd'];
  const lines = [header.join(',')];
  for (const i of invoices) {
    lines.push([
      i.number,
      i.issueDate.toISOString(),
      csv(i.billingName),
      csv(i.billingEmail),
      i.currency,
      i.subtotal,
      i.taxRate,
      csv(i.taxLabel),
      i.taxAmount,
      i.total,
      i.totalSgd ?? ''
    ].join(','));
  }
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tax-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function csv(v: string): string {
  if (!v) return '';
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
