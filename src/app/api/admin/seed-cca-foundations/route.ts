import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { seedCcaFoundations } from '@/lib/seed/cca-foundations-questions';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint to seed the Claude Certified Architect —
 * Foundations (CCA-F) bundle (vendor + 1 exam + 60 questions + bundle)
 * into the current database. Idempotent — safe to call repeatedly;
 * rewrites questions tagged `generatedBy: 'manual:cca-foundations-seed'`.
 *
 * Intended for bootstrapping the production DB after deploy without
 * shelling into the container.
 */
export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await seedCcaFoundations(db);

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'seed.cca-foundations',
      targetType: 'Bundle',
      targetId: 'anthropic-cca-foundations',
      metadata: JSON.parse(JSON.stringify(result))
    }
  });

  return NextResponse.json({ ok: true, ...result });
}
