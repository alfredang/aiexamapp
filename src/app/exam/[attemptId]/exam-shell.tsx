'use client';
import { useState } from 'react';
import { ExamRunner, type RunnerQuestion, type RunnerResponse } from '@/components/exam-runner';
import { TeaserGate } from '@/components/teaser-gate';

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
  const [gateAt, setGateAt] = useState<number | null>(null);

  return (
    <>
      <ExamRunner
        attemptId={props.attemptId}
        mode={props.mode}
        isTeaser={props.isTeaser}
        examTitle={props.examTitle}
        examVendor={props.examVendor}
        questions={props.questions}
        remainingSec={props.remainingSec}
        initialResponses={props.initialResponses}
        teaserGateAt={props.isTeaser && props.isGuest ? [props.questions.length] : undefined}
        onTeaserGate={(c) => setGateAt(c)}
        autoSubmitAtEnd={props.isTeaser && !props.isGuest}
      />
      {gateAt !== null && (
        <TeaserGate
          count={gateAt}
          examSlug={props.examSlug}
          vendorSlug={props.vendorSlug}
          onClose={() => setGateAt(null)}
        />
      )}
    </>
  );
}
