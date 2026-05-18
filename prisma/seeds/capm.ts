/**
 * CLI shim for the PMI CAPM bundle seed.
 *
 *   npx tsx prisma/seeds/capm.ts
 *
 * The actual logic lives in src/lib/seed/capm-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-capm (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedCapm } from '../../src/lib/seed/capm-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedCapm(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
