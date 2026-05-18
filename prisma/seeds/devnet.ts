/**
 * CLI shim for the Cisco DevNet Associate (200-901 DEVASC) bundle seed.
 *
 *   npx tsx prisma/seeds/devnet.ts
 *
 * The actual logic lives in src/lib/seed/devnet-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-devnet (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedDevnet } from '../../src/lib/seed/devnet-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedDevnet(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
