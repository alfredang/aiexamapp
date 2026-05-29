import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { regroundPl300 } from '@/lib/seed/pl300-regrounding';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint to repair the malformed/dump-sourced PL-300 imports
 * (and trim leaked option text on AI-900 / CCNA questions catalog-wide).
 *
 * Idempotent — safe to call repeatedly:
 *   - trims leaked "Explanation:/Reference/PBIX" tails out of option bodies,
 *   - removes PL-300 questions sourced from the third-party exam dump
 *     (`.pbix` / ravikiran repo / image-dependent),
 *   - recreates 27 grounded Microsoft Learn-sourced replacements tagged
 *     `manual:pl300-regrounded`, restoring each exam's original question and
 *     teaser counts.
 *
 * Intended for fixing production after deploy without shelling into the box.
 */
export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await regroundPl300(db);

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'fix.pl300_dumps',
      targetType: 'Exam',
      targetId: 'microsoft-pl-300',
      metadata: JSON.parse(JSON.stringify(result))
    }
  });

  return NextResponse.json({ ok: true, ...result });
}
