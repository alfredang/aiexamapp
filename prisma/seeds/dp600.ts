/**
 * CLI shim for the DP-600 bundle seed.
 *
 *   npx tsx prisma/seeds/dp600.ts
 *
 * The actual logic lives in src/lib/seed/dp600-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-dp600 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedDp600 } from '../../src/lib/seed/dp600-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedDp600(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
