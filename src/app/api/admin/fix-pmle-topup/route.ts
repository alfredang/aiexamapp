import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { topupGcpPmle } from '@/lib/seed/gcp-pmle-topup';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint: grounded top-up of Google Professional ML Engineer
 * practice variants P1–P3 to 60 published questions each, sourced from official
 * Google Cloud / Vertex AI docs. Idempotent (delete+recreate rows tagged
 * manual:gcp-pmle-topup, keyed by slug), non-destructive to existing content.
 * Writes an AdminLog.
 */
export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await topupGcpPmle(db);

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'fix.pmle_topup',
      targetType: 'Exam',
      targetId: 'google-professional-ml-engineer-p1..p3',
      metadata: JSON.parse(JSON.stringify(result))
    }
  });

  return NextResponse.json({ ok: true, ...result });
}
