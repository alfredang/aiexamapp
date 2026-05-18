/**
 * CLI shim for the Java SE 17 (1Z0-829) bundle seed.
 *
 *   npx tsx prisma/seeds/java17.ts
 *
 * The actual logic lives in src/lib/seed/java17-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-java17 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedJava17 } from '../../src/lib/seed/java17-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedJava17(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
