/**
 * CLI shim for the Google Professional Data Engineer bundle seed.
 *
 *   npx tsx prisma/seeds/gcp-pde.ts
 *
 * The actual logic lives in src/lib/seed/gcp-pde-questions.ts so the same
 * function can also be invoked from the protected admin API endpoint
 * /api/admin/seed-gcp-pde (lets us bootstrap production without a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedGcpPde } from '../../src/lib/seed/gcp-pde-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedGcpPde(db);
  console.log(`✓ vendor: ${result.vendor}`);
  console.log(`✓ bundle: ${result.bundle}`);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: ${e.questionCount} questions (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
