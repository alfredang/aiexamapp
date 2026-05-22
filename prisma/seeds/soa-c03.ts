/**
 * CLI shim for the SOA-C03 bundle seed.
 *
 *   npx tsx prisma/seeds/soa-c03.ts
 *
 * The actual logic lives in src/lib/seed/soa-c03-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-soa-c03 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedSoaC03 } from '../../src/lib/seed/soa-c03-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedSoaC03(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
