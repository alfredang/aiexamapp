/**
 * CLI shim for the Tableau Desktop Specialist bundle seed.
 *
 *   npx tsx prisma/seeds/tableau-ds.ts
 *
 * The actual logic lives in src/lib/seed/tableau-ds-questions.ts so the
 * same function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-tableau-ds (lets us bootstrap production without a
 * redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedTableauDs } from '../../src/lib/seed/tableau-ds-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedTableauDs(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
