import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { tierLabel } from '@/lib/utils';

export default async function MyExamsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect('/login');
  const ents = await db.entitlement.findMany({ where: { userId }, include: { exam: { include: { vendor: true } } }, orderBy: { grantedAt: 'desc' } });

  return (
    <>
      <h1 className="text-2xl font-bold">My Exams</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ents.length === 0 && <p className="text-slate-500 col-span-full">No exams yet. <Link href="/practice-exams" className="text-blue-600">Browse catalog →</Link></p>}
        {ents.map(e => (
          <div key={e.id} className="card p-5">
            <div className="mb-1 text-xs text-slate-500">{e.exam.vendor.name} · {e.exam.code}</div>
            <div className="font-semibold">{e.exam.title}</div>
            <div className="mt-1 text-xs"><span className="badge">{tierLabel(e.tier)}</span></div>
            <div className="mt-3 flex gap-2">
              <StartButton examId={e.examId} mode="PRACTICE" />
              <StartButton examId={e.examId} mode="EXAM" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StartButton({ examId, mode }: { examId: string; mode: 'PRACTICE' | 'EXAM' }) {
  return (
    <form action={async () => {
      'use server';
      const { db } = await import('@/lib/db');
      const { auth } = await import('@/lib/auth');
      const { redirect } = await import('next/navigation');
      const s = await auth();
      const uid = (s?.user as any)?.id;
      const exam = await db.exam.findUnique({ where: { id: examId } });
      if (!exam || !uid) return;
      const qs = await db.question.findMany({ where: { examId, status: 'PUBLISHED' }, select: { id: true } });
      const ids = qs.map(q => q.id).sort(() => Math.random() - 0.5).slice(0, exam.questionCount);
      const att = await db.attempt.create({
        data: {
          userId: uid, examId, mode, questionIds: ids,
          durationSec: mode === 'EXAM' ? exam.durationMinutes * 60 : 0,
          expiresAt: mode === 'EXAM' ? new Date(Date.now() + exam.durationMinutes * 60_000) : null,
          responses: {}
        }
      });
      redirect(`/exam/${att.id}`);
    }}>
      <button className={mode === 'EXAM' ? 'btn-primary-grad w-full' : 'btn-outline w-full'}>{mode === 'EXAM' ? 'Start exam' : 'Practice'}</button>
    </form>
  );
}
