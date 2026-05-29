import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fixKnownIssues } from '@/lib/seed/fix-known-issues';

export const runtime = 'nodejs';

/**
 * One-shot, idempotent admin endpoint for the 2026-05-29 known-issues batch:
 *   #4 delete orphan tableau-tds-* exams (+ lingering bundle)
 *   #5 unpublish lonely AWS base shells (aws-sap-c02, aws-soa-c03)
 *   #6 delete redundant AWS track bundles (data-engineer / devops)
 *   #1 reconcile PMP questionCount + re-tag pmi-pmp-p3/p6 domains (heuristic)
 *   #3 remove the degenerate AI-900 P4 ordering question + backfill 1 grounded
 *
 * Non-destructive where it matters (only deletes content with 0 attempts/
 * orders); safe to re-run. Writes an AdminLog.
 */
export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await fixKnownIssues(db);

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'fix.known_issues_2026_05_29',
      targetType: 'Catalog',
      targetId: 'known-issues-batch',
      metadata: JSON.parse(JSON.stringify(result))
    }
  });

  return NextResponse.json({ ok: true, ...result });
}
