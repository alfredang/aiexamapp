import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { revenueBy } from '@/lib/analytics';
import { rangeFromSearchParams } from '@/lib/reports/range-from-sp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const { range } = rangeFromSearchParams(sp);
  const by = (sp.by as any) || 'exam';
  const validBy = ['exam', 'vendor', 'tier', 'day', 'month'].includes(by) ? by : 'exam';
  const rows = await revenueBy(validBy as any, range);
  const lines = ['key,label,orders,amount_cents,currency'];
  for (const r of rows) lines.push([r.key, csv(r.label), r.count, r.amount, r.currency].join(','));
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="revenue-by-${validBy}-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function csv(v: string): string {
  if (!v) return '';
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
