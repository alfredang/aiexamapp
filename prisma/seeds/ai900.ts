/**
 * CLI shim for the AI-900 bundle seed.
 *
 *   npx tsx prisma/seeds/ai900.ts
 *
 * The actual logic lives in src/lib/seed/ai900-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-ai900 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedAi900 } from '../../src/lib/seed/ai900-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedAi900(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
