/**
 * CLI shim for the CKAD bundle seed.
 *
 *   npx tsx prisma/seeds/ckad.ts
 *
 * The actual logic lives in src/lib/seed/ckad-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-ckad (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedCkad } from '../../src/lib/seed/ckad-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedCkad(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
