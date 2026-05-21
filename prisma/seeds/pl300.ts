/**
 * CLI shim for the PL-300 bundle seed.
 *
 *   npx tsx prisma/seeds/pl300.ts
 *
 * The actual logic lives in src/lib/seed/pl300-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-pl300 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedPl300 } from '../../src/lib/seed/pl300-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedPl300(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
