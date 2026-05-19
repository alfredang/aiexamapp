/**
 * CLI shim for the OCI Foundations bundle seed.
 *
 *   npx tsx prisma/seeds/oci-foundations.ts
 *
 * The actual logic lives in src/lib/seed/oci-foundations-questions.ts so the
 * same function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-oci-foundations (lets us bootstrap production without a
 * redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedOciFoundations } from '../../src/lib/seed/oci-foundations-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedOciFoundations(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
