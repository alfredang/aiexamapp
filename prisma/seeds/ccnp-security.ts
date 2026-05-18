/**
 * CLI shim for the CCNP Security (SCOR 350-701) bundle seed.
 *
 *   npx tsx prisma/seeds/ccnp-security.ts
 *
 * The actual logic lives in src/lib/seed/ccnp-security-questions.ts so the
 * same function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-ccnp-security (lets us bootstrap production without a
 * redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedCcnpSecurity } from '../../src/lib/seed/ccnp-security-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedCcnpSecurity(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
