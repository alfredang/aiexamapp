'use client';
import { ShareButtons } from './share-buttons';
import { Share2 } from 'lucide-react';

export function ShareExam({
  vendorSlug,
  examSlug,
  title
}: {
  vendorSlug: string;
  examSlug: string;
  title: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/practice-exams/${vendorSlug}/${examSlug}`;
  const text = `Practicing ${title} on ExamNova — original questions, free teaser available.`;
  return (
    <div className="mt-6 card p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Share2 className="h-4 w-4 text-blue-600" />
        Share this exam
      </div>
      <ShareButtons url={url} text={text} />
    </div>
  );
}
