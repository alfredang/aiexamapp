/**
 * CLI shim for the CompTIA SecurityX bundle seed.
 *
 *   npx tsx prisma/seeds/securityx.ts
 *
 * The actual logic lives in src/lib/seed/securityx-questions.ts so the
 * same function can also be invoked from the protected admin API
 * endpoint /api/admin/seed-securityx (lets us bootstrap production
 * without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedSecurityX } from '../../src/lib/seed/securityx-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedSecurityX(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
