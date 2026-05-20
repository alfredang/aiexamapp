/**
 * CLI shim for the AZ-104 bundle seed.
 *
 *   npx tsx prisma/seeds/az104.ts
 *
 * The actual logic lives in src/lib/seed/az104-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-az104 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedAz104 } from '../../src/lib/seed/az104-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedAz104(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
