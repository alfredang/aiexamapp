import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Per-exam question CSV export. Columns include stem, type, options A-F,
 * correct option ids, explanation, domain, difficulty, status, references.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  const exam = await db.exam.findUnique({ where: { id }, select: { code: true } });
  if (!exam) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const questions = await db.question.findMany({
    where: { examId: id },
    orderBy: { createdAt: 'asc' }
  });

  const header = [
    'id', 'stem', 'type', 'domain', 'difficulty',
    'opt_a', 'opt_b', 'opt_c', 'opt_d', 'opt_e', 'opt_f',
    'correct', 'explanation', 'references', 'status', 'generatedBy', 'isTeaser', 'createdAt'
  ];
  const lines = [header.join(',')];

  for (const q of questions) {
    const opts = ((q.options as any[]) || []) as { id: string; text: string }[];
    const optMap = new Map(opts.map((o) => [o.id, o.text]));
    const correct = ((q.correct as any[]) || []).join('|');
    const refs = q.references
      ? JSON.stringify(q.references)
      : '';
    lines.push(
      [
        q.id,
        csv(q.stem),
        q.type,
        csv(q.domain),
        q.difficulty,
        csv(optMap.get('a') ?? ''),
        csv(optMap.get('b') ?? ''),
        csv(optMap.get('c') ?? ''),
        csv(optMap.get('d') ?? ''),
        csv(optMap.get('e') ?? ''),
        csv(optMap.get('f') ?? ''),
        csv(correct),
        csv(q.explanation),
        csv(refs),
        q.status,
        csv(q.generatedBy ?? ''),
        q.isTeaser ? 'true' : 'false',
        q.createdAt.toISOString()
      ].join(',')
    );
  }
  const body = lines.join('\n');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${exam.code}-questions-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function csv(v: string): string {
  if (!v) return '';
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
