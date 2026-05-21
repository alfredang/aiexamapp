/**
 * CLI shim for the SC-200 bundle seed.
 *
 *   npx tsx prisma/seeds/sc200.ts
 *
 * The actual logic lives in src/lib/seed/sc200-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-sc200 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedSc200 } from '../../src/lib/seed/sc200-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedSc200(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
