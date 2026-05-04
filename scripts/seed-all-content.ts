/**
 * One-shot wrapper: run every content seed in the correct order so that
 * AWS-SAA-C03, Anthropic CCA-F, Microsoft AZ-900, and Google ACE all
 * end up at 60 published questions each.
 *
 *   npx tsx scripts/seed-all-content.ts
 *
 * Each underlying script is independently idempotent (skips its own
 * batch if it already ran), so re-running this wrapper is a no-op.
 *
 * Production rollout (typically inside the Coolify container):
 *   1. Pull latest code & deploy (runs `prisma migrate deploy` and
 *      `npm run db:seed` on boot — that creates the catalog + admins).
 *   2. Exec into the container and run:    npx tsx scripts/seed-all-content.ts
 *
 * AWS SAA-C03 is already filled by prisma/seed.ts itself (60 placeholder
 * questions are inserted on first seed if the exam has none).
 */
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const SCRIPTS = [
  // Anthropic CCA-Foundations: 12 + 16 + 32 = 60
  'scripts/seed-cca-foundations.ts',
  'scripts/seed-cca-foundations-extra.ts',
  'scripts/seed-cca-foundations-fill.ts',
  // Microsoft AZ-900 + Google ACE original 10 each
  'scripts/seed-cloud-fundamentals.ts',
  // Microsoft AZ-900: 10 + 30 + 20 = 60
  'scripts/seed-az900-fill.ts',
  'scripts/seed-az900-fill2.ts',
  // Google ACE: 10 + 25 + 25 = 60
  'scripts/seed-ace-fill.ts',
  'scripts/seed-ace-fill2.ts'
];

async function main() {
  for (const script of SCRIPTS) {
    const path = resolve(process.cwd(), script);
    console.log(`\n━━━ ${script} ━━━`);
    try {
      execSync(`npx tsx ${path}`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`\n✗ Script failed: ${script}`);
      console.error(`  ${(e as Error).message}`);
      process.exit(1);
    }
  }
  console.log(`\n✓ All content seeds complete.`);
}

main();
