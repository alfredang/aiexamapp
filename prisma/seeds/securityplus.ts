/**
 * CLI shim for the CompTIA Security+ (SY0-701) bundle seed.
 *
 *   npx tsx prisma/seeds/securityplus.ts
 *
 * The actual logic lives in src/lib/seed/securityplus-questions.ts so the
 * same function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-securityplus (lets us bootstrap production without a
 * redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedSecurityPlus } from '../../src/lib/seed/securityplus-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedSecurityPlus(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
