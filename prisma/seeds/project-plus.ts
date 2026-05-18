/**
 * CLI shim for the CompTIA Project+ (PK0-005) bundle seed.
 *
 *   npx tsx prisma/seeds/project-plus.ts
 *
 * The actual logic lives in src/lib/seed/project-plus-questions.ts so the
 * same function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-project-plus (lets us bootstrap production without a
 * redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedProjectPlus } from '../../src/lib/seed/project-plus-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedProjectPlus(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
