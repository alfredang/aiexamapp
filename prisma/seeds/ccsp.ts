/**
 * CLI shim for the ISC2 CCSP bundle seed.
 *
 *   npx tsx prisma/seeds/ccsp.ts
 *
 * The actual logic lives in src/lib/seed/ccsp-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-ccsp (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedCcsp } from '../../src/lib/seed/ccsp-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedCcsp(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
