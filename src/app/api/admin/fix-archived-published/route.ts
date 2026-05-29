import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fixArchivedPublished } from '@/lib/seed/fix-archived-published';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint: reconcile archived exams that were left
 * published=true (inconsistent state flagged by catalog-health). Flips
 * published→false for every archived exam. Idempotent, non-destructive.
 * Writes an AdminLog.
 */
export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await fixArchivedPublished(db);

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'fix.archived_published',
      targetType: 'Exam',
      targetId: 'archived-published-shells',
      metadata: JSON.parse(JSON.stringify(result))
    }
  });

  return NextResponse.json({ ok: true, ...result });
}
