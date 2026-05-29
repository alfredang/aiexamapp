import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fixQuestionCount } from '@/lib/seed/fix-question-count';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint: reconcile the stored Exam.questionCount field to
 * the actual published-question count for every non-archived exam (drift
 * flagged by catalog-health). Idempotent, non-destructive. Writes an AdminLog.
 */
export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await fixQuestionCount(db);

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'fix.question_count',
      targetType: 'Exam',
      targetId: 'question-count-drift',
      metadata: JSON.parse(JSON.stringify(result))
    }
  });

  return NextResponse.json({ ok: true, ...result });
}
