import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fixAwsDeadBundles } from '@/lib/seed/fix-aws-dead-bundles';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint: unpublish the redundant AWS "track" bundles
 * (`aws-data-engineer-track`, `aws-devops-track`) that are wired to dead
 * base-exam slugs and would 404 on their teaser CTA. Idempotent, non-
 * destructive (flips `published` to false). Writes an AdminLog.
 */
export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await fixAwsDeadBundles(db);

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'fix.aws_dead_bundles',
      targetType: 'Bundle',
      targetId: 'aws-track-bundles',
      metadata: JSON.parse(JSON.stringify(result))
    }
  });

  return NextResponse.json({ ok: true, ...result });
}
