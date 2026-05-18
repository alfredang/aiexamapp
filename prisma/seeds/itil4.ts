/**
 * CLI shim for the ITIL 4 Foundation bundle seed.
 *
 *   npx tsx prisma/seeds/itil4.ts
 *
 * The actual logic lives in src/lib/seed/itil4-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-itil4 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedItil4 } from '../../src/lib/seed/itil4-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedItil4(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
