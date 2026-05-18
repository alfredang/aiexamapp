/**
 * CLI shim for the SC-300 bundle seed.
 *
 *   npx tsx prisma/seeds/sc300.ts
 *
 * The actual logic lives in src/lib/seed/sc300-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-sc300 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedSc300 } from '../../src/lib/seed/sc300-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedSc300(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
