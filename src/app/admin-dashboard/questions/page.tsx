import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function approve(formData: FormData) {
  'use server';
  await db.question.update({ where: { id: String(formData.get('id')) }, data: { status: 'PUBLISHED' } });
  revalidatePath('/admin-dashboard/questions');
}
async function archive(formData: FormData) {
  'use server';
  await db.question.update({ where: { id: String(formData.get('id')) }, data: { status: 'ARCHIVED' } });
  revalidatePath('/admin-dashboard/questions');
}
async function remove(formData: FormData) {
  'use server';
  await db.question.delete({ where: { id: String(formData.get('id')) } });
  revalidatePath('/admin-dashboard/questions');
}

export default async function AdminQuestionsPage({ searchParams }: { searchParams: Promise<{ status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }> }) {
  const sp = await searchParams;
  const status = sp.status || 'DRAFT';
  const questions = await db.question.findMany({
    where: { status },
    include: { exam: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Questions</h1>
      <div className="mt-2 flex gap-2 text-sm">
        {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map(s => (
          <a key={s} href={`?status=${s}`} className={`badge ${status === s ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : ''}`}>{s}</a>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {questions.map(q => {
          const correctIds = (q.correct as unknown as string[]) || [];
          const opts = (q.options as any[]) || [];
          return (
            <div key={q.id} className="card p-4">
              <div className="mb-1 text-xs text-slate-500">{q.exam.code} · {q.domain || '—'} · D{q.difficulty} · {q.type} · {q.generatedBy || 'manual'}</div>
              <p className="font-medium">{q.stem}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {opts.map(o => <li key={o.id} className={correctIds.includes(o.id) ? 'text-green-700 dark:text-green-300' : 'text-slate-700 dark:text-slate-300'}>{correctIds.includes(o.id) ? '✓ ' : '○ '}{o.text}</li>)}
              </ul>
              <p className="mt-2 text-sm text-slate-600"><b>Explanation:</b> {q.explanation}</p>
              <div className="mt-3 flex gap-2">
                {status !== 'PUBLISHED' && <form action={approve}><input type="hidden" name="id" value={q.id} /><button className="btn-primary">Publish</button></form>}
                {status !== 'ARCHIVED' && <form action={archive}><input type="hidden" name="id" value={q.id} /><button className="btn-outline">Archive</button></form>}
                <form action={remove}><input type="hidden" name="id" value={q.id} /><button className="btn-outline">Delete</button></form>
              </div>
            </div>
          );
        })}
        {questions.length === 0 && <p className="text-slate-500">No {status.toLowerCase()} questions.</p>}
      </div>
    </div>
  );
}
