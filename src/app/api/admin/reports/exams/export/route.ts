import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { examAnalytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const rows = await examAnalytics();
  const header = ['vendor', 'code', 'title', 'published', 'publishedQuestions', 'paidOrders', 'totalAttempts', 'completedAttempts', 'avgScore', 'passRate'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      csv(r.vendor), csv(r.code), csv(r.title),
      r.published ? 'true' : 'false',
      r.publishedQuestions, r.paidOrders, r.totalAttempts, r.completedAttempts,
      r.avgScore != null ? r.avgScore.toFixed(2) : '',
      r.passRate != null ? r.passRate.toFixed(4) : ''
    ].join(','));
  }
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="exam-analytics-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function csv(v: string): string {
  if (!v) return '';
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
