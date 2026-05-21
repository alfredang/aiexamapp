import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint to repair the single malformed question
 * surfaced by /api/admin/find-malformed-questions on 2026-05-21:
 *
 *   Question ID: cmowwtvrw0025mwoas7iplv9f
 *   Exam:        aws-dva-c02-p3
 *
 * The original ingestion split this question incorrectly — what should
 * have been the second sentence of the stem (introducing the CORS-vs-
 * bucket scenario) ended up stored as the FIRST option with id "A".
 * The second "A" is the actual correct answer text. The other options
 * (B, C, D) are real distractors.
 *
 * This endpoint:
 *   1. Looks up the question by id.
 *   2. Verifies it still matches the expected malformed shape
 *      (5 options, first two share id "A", first "A" text starts with
 *      "The development team notices...").
 *   3. Rebuilds stem = old stem + " " + first-A-text (minus the trailing
 *      " SINGLE" metadata tag).
 *   4. Drops the first malformed "A" option; remaining 4 are clean
 *      (A/B/C/D) and correct=["A"] points at the right answer.
 *   5. Writes the result and records an AdminLog entry.
 *
 * Idempotent: if the question is already fixed (4 options, no dupes),
 * returns { ok: true, action: "already-fixed" }.
 */

const TARGET_ID = 'cmowwtvrw0025mwoas7iplv9f';
const EXPECTED_STEM_PREFIX = 'A digital marketing company has its website hosted on an Amazon S3 bucket';
const EXPECTED_FIRST_OPTION_PREFIX = 'The development team notices';

export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const q = await db.question.findUnique({ where: { id: TARGET_ID } });
  if (!q) {
    return NextResponse.json({ ok: false, error: 'question not found', targetId: TARGET_ID }, { status: 404 });
  }

  const opts = (q.options as { id: string; text: string }[]) || [];
  const correct = (q.correct as string[]) || [];

  // Already fixed?
  const ids = opts.map(o => o.id);
  const hasDupes = new Set(ids).size !== ids.length;
  if (!hasDupes && opts.length === 4) {
    return NextResponse.json({ ok: true, action: 'already-fixed', current: { stem: q.stem, options: opts, correct } });
  }

  // Defensive shape check — refuse if the data doesn't match what we
  // expect, so this endpoint never silently corrupts a different malformed row.
  if (opts.length !== 5 || ids[0] !== 'A' || ids[1] !== 'A' || !opts[0].text.startsWith(EXPECTED_FIRST_OPTION_PREFIX)) {
    return NextResponse.json({
      ok: false,
      error: 'question shape does not match expected malformed pattern; aborting to avoid silent corruption',
      current: { stem: q.stem, options: opts, correct }
    }, { status: 409 });
  }
  if (!q.stem.startsWith(EXPECTED_STEM_PREFIX)) {
    return NextResponse.json({
      ok: false,
      error: 'stem prefix does not match expected; aborting',
      current: { stem: q.stem, options: opts, correct }
    }, { status: 409 });
  }

  // Rebuild stem: original + " " + misplaced sentence (strip trailing
  // " SINGLE" tag if present — it was an ingestion-time question-type
  // hint that leaked into the option text).
  const misplaced = opts[0].text.replace(/\s+SINGLE\s*$/i, '').trim();
  const newStem = `${q.stem.replace(/\s+$/, '')}. ${misplaced}`;

  // Drop the first "A"; the second "A" (now at index 0) is the real
  // correct answer. Remaining ids are already A/B/C/D in order.
  const newOptions = opts.slice(1);

  // correct already points at "A" — still valid after dedup.
  const newCorrect = correct;

  const before = { stem: q.stem, options: opts, correct };

  await db.question.update({
    where: { id: TARGET_ID },
    data: {
      stem: newStem,
      options: newOptions,
      correct: newCorrect
    }
  });

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'question.repair_malformed_options',
      targetType: 'Question',
      targetId: TARGET_ID,
      metadata: { before, after: { stem: newStem, options: newOptions, correct: newCorrect } } as any
    }
  });

  return NextResponse.json({
    ok: true,
    action: 'fixed',
    before,
    after: { stem: newStem, options: newOptions, correct: newCorrect }
  });
}
