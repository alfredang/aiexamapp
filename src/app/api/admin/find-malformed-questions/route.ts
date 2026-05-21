import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Read-only diagnostic: scan every published question for malformed
 * option arrays (duplicate option IDs, empty IDs, or `correct` references
 * to option IDs that don't exist in `options`). Returns a per-question
 * report so admins can locate and fix bad rows in the admin UI.
 *
 * Triggered by a React "Encountered two children with the same key"
 * warning on /admin-dashboard/exams/[id] caused by duplicate option IDs
 * within a single question's options array.
 */
type ProblemRow = {
  questionId: string;
  examSlug: string;
  examCode: string;
  domain: string;
  problems: string[];
  optionIds: string[];
  correctIds: string[];
  stemPreview: string;
};

export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Pull only the fields we need so this scales for tens of thousands of
  // questions. Currently ~5k–10k questions; this is fine to load in one
  // pass and process in memory.
  const questions = await db.question.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      stem: true,
      domain: true,
      options: true,
      correct: true,
      exam: { select: { slug: true, code: true } }
    }
  });

  const bad: ProblemRow[] = [];
  for (const q of questions) {
    const opts = Array.isArray(q.options) ? (q.options as { id: string; text: string }[]) : [];
    const correct = Array.isArray(q.correct) ? (q.correct as string[]) : [];
    const optionIds = opts.map(o => o?.id ?? '');
    const problems: string[] = [];

    // Duplicate option IDs (the React-key warning source)
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const id of optionIds) {
      if (seen.has(id)) dupes.add(id);
      seen.add(id);
    }
    if (dupes.size > 0) problems.push(`duplicate option ids: ${Array.from(dupes).join(', ')}`);

    // Empty / missing option IDs
    const emptyCount = optionIds.filter(id => !id).length;
    if (emptyCount > 0) problems.push(`${emptyCount} option(s) with empty id`);

    // correct[] references option IDs that don't exist
    const optionIdSet = new Set(optionIds.filter(Boolean));
    const orphanCorrect = correct.filter(c => !optionIdSet.has(c));
    if (orphanCorrect.length > 0) problems.push(`correct ids not in options: ${orphanCorrect.join(', ')}`);

    // No correct answers at all
    if (correct.length === 0) problems.push('no correct answers');

    if (problems.length > 0) {
      bad.push({
        questionId: q.id,
        examSlug: q.exam.slug,
        examCode: q.exam.code,
        domain: q.domain,
        problems,
        optionIds,
        correctIds: correct,
        stemPreview: q.stem.slice(0, 120)
      });
    }
  }

  return NextResponse.json({
    scanned: questions.length,
    badCount: bad.length,
    bad
  });
}
