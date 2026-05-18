/**
 * CLI shim for the CKS bundle seed.
 *
 *   npx tsx prisma/seeds/cks.ts
 *
 * The actual logic lives in src/lib/seed/cks-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-cks (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedCks } from '../../src/lib/seed/cks-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedCks(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
