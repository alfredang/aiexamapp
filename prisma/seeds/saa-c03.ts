/**
 * CLI shim for the SAA-C03 practice-variant question seed.
 *
 *   npx tsx prisma/seeds/saa-c03.ts
 *
 * The actual logic lives in src/lib/seed/saa-c03-questions.ts so the
 * same function can also be invoked from the protected admin API
 * endpoint /api/admin/seed-saa-c03 (lets us refresh production without
 * a redeploy).
 */
import { PrismaClient } from '@prisma/client';
import { seedSaaC03 } from '../../src/lib/seed/saa-c03-questions';

const db = new PrismaClient();

async function main() {
  const result = await seedSaaC03(db);
  for (const e of result.exams) {
    console.log(`✓ ${e.slug}: deleted ${e.deleted}, created ${e.created} (${e.teaserCount} teaser)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
