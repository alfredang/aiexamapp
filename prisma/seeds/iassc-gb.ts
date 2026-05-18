/**
 * CLI shim for the IASSC Lean Six Sigma Green Belt bundle seed.
 *
 *   npx tsx prisma/seeds/iassc-gb.ts
 *
 * The actual logic lives in src/lib/seed/iassc-gb-questions.ts so the
 * same function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-iassc-gb (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedIasscGb } from '../../src/lib/seed/iassc-gb-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedIasscGb(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
