/**
 * CLI shim for the PMI-RMP bundle seed.
 *
 *   npx tsx prisma/seeds/pmirmp.ts
 *
 * The actual logic lives in src/lib/seed/pmirmp-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-pmirmp (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedPmiRmp } from '../../src/lib/seed/pmirmp-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedPmiRmp(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
