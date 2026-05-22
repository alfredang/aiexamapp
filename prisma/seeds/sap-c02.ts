/**
 * CLI shim for the SAP-C02 bundle seed.
 *
 *   npx tsx prisma/seeds/sap-c02.ts
 *
 * The actual logic lives in src/lib/seed/sap-c02-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-sap-c02 (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedSapC02 } from '../../src/lib/seed/sap-c02-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedSapC02(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
