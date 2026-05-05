/**
 * One-shot wrapper: run every content seed in the correct order so that
 * Anthropic CCA-F, Microsoft AZ-900, Google ACE, and AWS CLF-C02 all
 * end up at their target question counts.
 *
 *   npx tsx scripts/seed-all-content.ts
 *
 * Each underlying script is independently idempotent (skips its own
 * batch if it already ran), so re-running this wrapper is a no-op.
 *
 * Production rollout (typically inside the Coolify container, or
 * automatically as part of the Dockerfile boot CMD):
 *   1. Pull latest code & deploy — Dockerfile runs `prisma migrate deploy`,
 *      `npm run db:seed` (catalog + admins + obsolete-slug cleanup),
 *      then this wrapper, all before starting the Next.js server.
 *   2. After deploy, all four exams will have content; other catalog
 *      entries remain 0-question placeholders (hidden by the public
 *      catalog filter until they get content).
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
  'scripts/seed-ace-fill2.ts',
  // AWS CLF-C02: 25 + 39 + 1 = 65
  'scripts/seed-clf-c02-fill.ts',
  'scripts/seed-clf-c02-fill2.ts',
  'scripts/seed-clf-c02-top.ts'
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
