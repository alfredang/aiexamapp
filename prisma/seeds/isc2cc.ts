/**
 * CLI shim for the ISC2 Certified in Cybersecurity (CC) bundle seed.
 *
 *   npx tsx prisma/seeds/isc2cc.ts
 *
 * The actual logic lives in src/lib/seed/isc2cc-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-isc2cc (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedIsc2Cc } from '../../src/lib/seed/isc2cc-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedIsc2Cc(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
