'use client';
import { ExamRunner, type RunnerQuestion, type RunnerResponse } from '@/components/exam-runner';

export function ExamShell(props: {
  attemptId: string;
  mode: 'PRACTICE' | 'EXAM';
  isTeaser: boolean;
  examTitle: string;
  examVendor: string;
  examSlug: string;
  vendorSlug: string;
  questions: RunnerQuestion[];
  remainingSec: number;
  initialResponses: Record<string, RunnerResponse>;
  isGuest: boolean;
}) {
  return (
    <ExamRunner
      attemptId={props.attemptId}
      mode={props.mode}
      isTeaser={props.isTeaser}
      examTitle={props.examTitle}
      examVendor={props.examVendor}
      questions={props.questions}
      remainingSec={props.remainingSec}
      initialResponses={props.initialResponses}
      // Auto-submit every teaser at completion (guests + signed-in alike).
      // The in-attempt signup modal used to fire here for guests, but it's
      // redundant since PR #70 added the results-page modal — and worse,
      // it left customers stuck on Q10 (per user feedback 2026-05-26).
      // Now finishing the teaser cleanly funnels everyone to /results,
      // where ResultsSignupPrompt handles the conversion for anonymous
      // viewers.
      autoSubmitAtEnd={props.isTeaser}
    />
  );
}
