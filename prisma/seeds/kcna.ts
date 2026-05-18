/**
 * CLI shim for the KCNA bundle seed.
 *
 *   npx tsx prisma/seeds/kcna.ts
 *
 * The actual logic lives in src/lib/seed/kcna-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-kcna (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedKcna } from '../../src/lib/seed/kcna-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedKcna(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
