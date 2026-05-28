/**
 * CLI shim for the Claude Certified Architect — Foundations (CCA-F) seed.
 *
 *   npx tsx prisma/seeds/cca-foundations.ts
 *
 * The actual logic lives in src/lib/seed/cca-foundations-questions.ts so the
 * same function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-cca-foundations (lets us bootstrap production without a
 * redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedCcaFoundations } from '../../src/lib/seed/cca-foundations-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedCcaFoundations(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ exam ${result.exam.slug}: ${result.exam.questionCount} questions (${result.exam.teaserCount} teaser)`);
  if (result.exam.legacyRetired > 0) {
    console.log(`✓ retired ${result.exam.legacyRetired} legacy pre-seed question(s) (cca-f-pdf / -extra / -fill)`);
  }
  console.log(`✓ bundle: ${result.bundle}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
