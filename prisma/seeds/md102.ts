/**
 * CLI shim for the MD-102 bundle seed.
 *
 *   npx tsx prisma/seeds/md102.ts
 *
 * The actual logic lives in src/lib/seed/md102-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-md102 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedMd102 } from '../../src/lib/seed/md102-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedMd102(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
