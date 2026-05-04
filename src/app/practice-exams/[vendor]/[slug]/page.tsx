import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatPrice, tiersForExam, tierLabel } from '@/lib/utils';
import { Check, Timer, BookOpen, Award, BookOpenCheck, Hourglass } from 'lucide-react';

export default async function ExamDetailPage({ params }: { params: Promise<{ vendor: string; slug: string }> }) {
  const { vendor: vendorSlug, slug } = await params;
  const exam = await db.exam.findUnique({
    where: { slug },
    include: {
      vendor: true,
      _count: { select: { questions: { where: { status: 'PUBLISHED' } } } }
    }
  });
  if (!exam || exam.vendor.slug !== vendorSlug) notFound();

  const teaserCount = await db.question.count({ where: { examId: exam.id, isTeaser: true, status: 'PUBLISHED' } });
  const domains = (exam.domains as any[]) || [];

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const entitled = userId
    ? !!(await db.entitlement.findFirst({
        where: { userId, examId: exam.id, tier: { in: ['PRACTICE', 'BUNDLE', 'ADMIN_GRANT'] } }
      }))
    : false;

  return (
    <div className="container-app py-10">
      <div className="mb-2 text-sm">
        <Link href="/practice-exams" className="text-blue-600 hover:underline">All exams</Link>
        <span className="text-slate-400"> / </span>
        <Link href={`/practice-exams/${exam.vendor.slug}`} className="text-blue-600 hover:underline">{exam.vendor.name}</Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="badge-brand">{exam.vendor.name}</span>
            <span className="badge">{exam.code}</span>
            <span className="badge">{exam.level}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
          <p className="mt-2 text-slate-600">{exam.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat icon={BookOpen} label="Questions" value={`${exam._count.questions}`} />
            <Stat icon={Timer} label="Duration" value={`${exam.durationMinutes} min`} />
            <Stat icon={Award} label="Pass score" value={`${exam.passingScore}%`} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="card p-5">
              <BookOpenCheck className="h-6 w-6 text-blue-600" />
              <h3 className="mt-3 font-semibold">Practice mode</h3>
              <p className="mt-1 text-sm text-slate-600">See the correct answer and full explanation immediately after each question. Best for studying.</p>
            </div>
            <div className="card p-5">
              <Hourglass className="h-6 w-6 text-blue-600" />
              <h3 className="mt-3 font-semibold">Exam mode</h3>
              <p className="mt-1 text-sm text-slate-600">{exam.durationMinutes}-minute timer, no answer reveal until you submit. Auto-saves and auto-submits — like the real exam.</p>
            </div>
          </div>

          {domains.length > 0 && (
            <div className="mt-8 card p-6">
              <h2 className="font-semibold">Domains covered</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {domains.map((d, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-slate-700">{d.name}</span>
                    <span className="text-slate-500">{d.weight}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 card p-6">
            <h2 className="font-semibold">What you get</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {[
                'Practice mode with immediate explanations',
                'Timed Exam mode that simulates the real test',
                'Mark questions for review and filter by status',
                'Per-domain breakdown after each attempt',
                'Original questions — never real exam dumps'
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-blue-600" /> {f}</li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            This platform provides original practice questions for learning. We are not affiliated with {exam.vendor.name}, and we do not provide real exam dumps.
          </p>
        </div>

        <aside className="space-y-3">
          <div className="card p-5 sticky top-24">
            <h3 className="text-sm font-semibold uppercase text-slate-500">2026 Practice Exam Details</h3>
            <dl className="mt-3 space-y-1 text-sm">
              <Row k="Exam code" v={exam.code} />
              <Row k="Level" v={exam.level} />
              <Row k="Duration" v={`${exam.durationMinutes} min`} />
              <Row k="Pass score" v={`${exam.passingScore}%`} />
              <Row k="Question count" v={`${exam.questionCount}`} />
            </dl>
          </div>

          {entitled && (
            <div className="card p-5">
              <div className="mb-1 text-xs font-semibold uppercase text-emerald-700">You have access</div>
              <div className="font-semibold">Start your attempt</div>
              <p className="mt-1 text-sm text-slate-600">Pick a mode below.</p>
              <div className="mt-3 flex flex-col gap-2">
                <StartButton examId={exam.id} mode="PRACTICE" />
                <StartButton examId={exam.id} mode="EXAM" />
              </div>
            </div>
          )}
          {!entitled && teaserCount > 0 && (
            <Link href={`/practice-exams/${exam.vendor.slug}/${exam.slug}/teaser`} className="card-hover block p-5">
              <div className="mb-1 text-xs font-semibold uppercase text-blue-700">Free</div>
              <div className="font-semibold">Try {Math.min(30, teaserCount)} questions free</div>
              <p className="mt-1 text-sm text-slate-600">No credit card required.</p>
              <div className="btn-outline mt-3 w-full">Start free practice exam</div>
            </Link>
          )}
          {!entitled && tiersForExam(exam).map(t => (
            <Link key={t.tier} href={`/checkout/${exam.id}?tier=${t.tier}`} className="card-hover block p-5">
              <div className="flex items-baseline justify-between">
                <div className="font-semibold">{tierLabel(t.tier)}</div>
                <div className="text-xl font-bold text-blue-700">{formatPrice(t.price)}</div>
              </div>
              <div className="btn-primary-grad mt-3 w-full">Buy now</div>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <Icon className="h-5 w-5 text-blue-600" />
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>;
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
      const ent = await db.entitlement.findFirst({
        where: { userId: uid, examId, tier: { in: ['PRACTICE', 'BUNDLE', 'ADMIN_GRANT'] } }
      });
      if (!ent) return;
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
      <button className={mode === 'EXAM' ? 'btn-primary-grad w-full' : 'btn-secondary w-full'}>
        {mode === 'EXAM' ? 'Start exam' : 'Practice'}
      </button>
    </form>
  );
}
