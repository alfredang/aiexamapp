'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';

export type RunnerQuestion = {
  id: string;
  stem: string;
  type: 'SINGLE' | 'MULTI' | 'TRUE_FALSE';
  options: { id: string; text: string }[];
};

export type RunnerResponse = { answer: string[]; flagged?: boolean; submitted?: boolean; isCorrect?: boolean; correct?: string[]; explanation?: string };

export type ExamRunnerProps = {
  attemptId: string;
  mode: 'PRACTICE' | 'EXAM';
  isTeaser: boolean;
  examTitle: string;
  examVendor: string;
  questions: RunnerQuestion[];
  remainingSec: number;        // 0 for untimed
  initialResponses: Record<string, RunnerResponse>;
  teaserGateAt?: number[];     // e.g. [20, 30] — show modal after answering this many in teaser
  onTeaserGate?: (count: number) => void;
};

export function ExamRunner(props: ExamRunnerProps) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, RunnerResponse>>(props.initialResponses || {});
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'incorrect' | 'flagged'>('all');
  const [remaining, setRemaining] = useState(props.remainingSec);
  const [submitted, setSubmitted] = useState(false);
  const dirty = useRef(false);

  // Timer (Exam mode only)
  useEffect(() => {
    if (props.mode !== 'EXAM' || props.remainingSec <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [props.mode, props.remainingSec]);
  useEffect(() => {
    if (props.mode === 'EXAM' && props.remainingSec > 0 && remaining === 0 && !submitted) submitAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  // Autosave every 15s if dirty
  useEffect(() => {
    const t = setInterval(async () => {
      if (!dirty.current) return;
      dirty.current = false;
      const payload = Object.fromEntries(
        Object.entries(answers).map(([qid, r]) => [qid, { answer: r.answer, flagged: r.flagged }])
      );
      await fetch('/api/attempts/autosave', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attemptId: props.attemptId, responses: payload })
      }).catch(() => { dirty.current = true; });
    }, 15000);
    return () => clearInterval(t);
  }, [answers, props.attemptId]);

  // Beforeunload flush
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault(); };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, []);

  const q = props.questions[idx];
  const a = answers[q.id] || { answer: [] };

  const visible = useMemo(() => props.questions.map((_, i) => i).filter(i => {
    const r = answers[props.questions[i].id];
    if (filter === 'unanswered') return !r?.answer?.length;
    if (filter === 'incorrect') return r?.submitted && r.isCorrect === false;
    if (filter === 'flagged') return r?.flagged;
    return true;
  }), [answers, filter, props.questions]);

  const answeredCount = Object.values(answers).filter(r => r.answer.length).length;

  function setAnswer(answer: string[]) {
    setAnswers(prev => ({ ...prev, [q.id]: { ...prev[q.id], answer } }));
    dirty.current = true;
  }

  function toggle(optId: string) {
    if (a.submitted && props.mode === 'PRACTICE') return;
    const cur = a.answer || [];
    const next = q.type === 'MULTI'
      ? (cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId])
      : [optId];
    setAnswer(next);
  }

  async function checkAnswer() {
    if (!a.answer.length) return;
    const r = await fetch('/api/attempts/answer', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ attemptId: props.attemptId, questionId: q.id, answer: a.answer, flagged: a.flagged })
    });
    const j = await r.json();
    if (props.mode === 'PRACTICE') {
      setAnswers(prev => ({ ...prev, [q.id]: { ...prev[q.id], submitted: true, isCorrect: j.isCorrect, correct: j.correct, explanation: j.explanation } }));
    }
    // Teaser gate check (after answering, not flagging)
    const newCount = answeredCount + (a.submitted ? 0 : 1);
    if (props.isTeaser && props.teaserGateAt?.includes(newCount)) {
      props.onTeaserGate?.(newCount);
    }
  }

  async function toggleFlag() {
    const flagged = !a.flagged;
    setAnswers(prev => ({ ...prev, [q.id]: { ...prev[q.id], flagged } }));
    await fetch('/api/attempts/mark', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ attemptId: props.attemptId, questionId: q.id, flagged })
    }).catch(() => {});
  }

  async function submitAttempt() {
    if (submitted) return;
    setSubmitted(true);
    // Final autosave
    const payload = Object.fromEntries(Object.entries(answers).map(([qid, r]) => [qid, { answer: r.answer, flagged: r.flagged }]));
    await fetch('/api/attempts/autosave', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: props.attemptId, responses: payload }) }).catch(() => {});
    const r = await fetch('/api/attempts/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: props.attemptId }) });
    if (r.ok) router.push(`/results/${props.attemptId}`);
  }

  function fmt(sec: number) { const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; }

  return (
    <div className="container-app py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="badge">{props.mode === 'EXAM' ? 'Exam mode' : 'Practice mode'}</span>
          {props.isTeaser && <span className="badge-brand">Free teaser</span>}
          <span className="text-slate-500">{props.examVendor} · {props.examTitle}</span>
          <span className="text-slate-500">· Q{idx + 1}/{props.questions.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {props.mode === 'EXAM' && props.remainingSec > 0 && (
            <span className={`badge ${remaining < 60 ? 'bg-red-50 text-red-700' : ''}`}>⏱ {fmt(remaining)}</span>
          )}
          <button onClick={toggleFlag} className={`btn-outline ${a.flagged ? 'border-amber-400 text-amber-700' : ''}`}><Flag className="mr-1 h-4 w-4 inline" />{a.flagged ? 'Flagged' : 'Flag'}</button>
          <button onClick={submitAttempt} className="btn-primary-grad">Submit exam</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="card p-6">
          <p className="text-base font-medium">{q.stem}</p>
          <div className="mt-4 space-y-2">
            {q.options.map(o => {
              const sel = a.answer.includes(o.id);
              const isAnswered = !!a.submitted;
              const correct = a.correct?.includes(o.id);
              const wrong = isAnswered && sel && !correct;
              return (
                <button
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  disabled={a.submitted && props.mode === 'PRACTICE'}
                  className={`block w-full rounded-md border px-4 py-3 text-left text-sm transition ${
                    isAnswered && correct ? 'border-green-400 bg-green-50' :
                    wrong ? 'border-red-400 bg-red-50' :
                    sel ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >{o.text}</button>
              );
            })}
          </div>
          {!a.submitted && props.mode === 'PRACTICE' && (
            <button onClick={checkAnswer} className="btn-primary-grad mt-4">Show answer</button>
          )}
          {a.submitted && a.explanation && (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="mb-1 font-semibold">{a.isCorrect ? '✓ Correct' : '✗ Incorrect'}</div>
              <p className="text-slate-700">{a.explanation}</p>
            </div>
          )}
          {props.mode === 'EXAM' && a.answer.length > 0 && (
            <button onClick={checkAnswer} className="btn-outline mt-4 text-xs">Save answer</button>
          )}
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setIdx(Math.max(0, idx - 1))} className="btn-outline" disabled={idx === 0}><ChevronLeft className="h-4 w-4" /> Previous</button>
            <button onClick={() => setIdx(Math.min(props.questions.length - 1, idx + 1))} className="btn-primary" disabled={idx === props.questions.length - 1}>Next <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <aside className="card h-fit p-4">
          <div className="mb-3 flex flex-wrap gap-1 text-xs">
            {(['all', 'unanswered', 'incorrect', 'flagged'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`badge ${filter === f ? 'bg-blue-50 text-blue-700' : ''}`}>{f}</button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1">
            {props.questions.map((qq, i) => {
              const r = answers[qq.id];
              const hidden = !visible.includes(i);
              const cls = hidden ? 'opacity-30' :
                r?.isCorrect === true ? 'bg-green-100 text-green-800' :
                r?.isCorrect === false ? 'bg-red-100 text-red-800' :
                r?.answer?.length ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600';
              return (
                <button key={qq.id} onClick={() => setIdx(i)} className={`rounded-md py-1 text-xs ${cls} ${i === idx ? 'ring-2 ring-blue-500' : ''} ${r?.flagged ? 'border border-amber-400' : ''}`}>{i + 1}</button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">{answeredCount}/{props.questions.length} answered</p>
        </aside>
      </div>
    </div>
  );
}
