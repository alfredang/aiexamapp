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
  'scripts/seed-clf-c02-top.ts',
  // AWS DEA-C01: 25 + 40 = 65
  'scripts/seed-dea-c01-fill.ts',
  'scripts/seed-dea-c01-fill2.ts',
  // AWS SAA-C03: 25 + 35 = 60 of 65
  'scripts/seed-saa-c03-fill.ts',
  'scripts/seed-saa-c03-fill2.ts',
  // AWS DVA-C02: 25 + 35 = 60 of 65
  'scripts/seed-dva-c02-fill.ts',
  'scripts/seed-dva-c02-fill2.ts',
  // Oracle OCI Foundations starter (6 of 40)
  'scripts/seed-oci-foundations-starter.ts',
  // AWS SOA-C03: 25 + 35 = 60 of 65
  'scripts/seed-soa-c03-fill.ts',
  'scripts/seed-soa-c03-fill2.ts',
  // AWS AIF-C01: 25 + 35 = 60 of 65
  'scripts/seed-aif-c01-fill.ts',
  'scripts/seed-aif-c01-fill2.ts',
  // AWS SCS-C03: 25 + 35 = 60 of 65
  'scripts/seed-scs-c03-fill.ts',
  'scripts/seed-scs-c03-fill2.ts',
  // AWS MLA-C01: 25 + 35 = 60 of 65
  'scripts/seed-mla-c01-fill.ts',
  'scripts/seed-mla-c01-fill2.ts',
  // AWS DOP-C02: 25 + 35 = 60 of 75
  'scripts/seed-dop-c02-fill.ts',
  'scripts/seed-dop-c02-fill2.ts',
  // AWS AIP-C01: 25 + 35 = 60 of 75
  'scripts/seed-aip-c01-fill.ts',
  'scripts/seed-aip-c01-fill2.ts',
  // AWS SAP-C02: 25 + 35 = 60 of 75
  'scripts/seed-sap-c02-fill.ts',
  'scripts/seed-sap-c02-fill2.ts',
  // AWS ANS-C01: 25 + 35 = 60 of 65
  'scripts/seed-ans-c01-fill.ts',
  'scripts/seed-ans-c01-fill2.ts',
  // CompTIA Cloud+ practice exams (sourced from Google Forms)
  'scripts/seed-comptia-cloud-plus-p1.ts',
  'scripts/seed-comptia-cloud-plus-p5.ts',
  'scripts/seed-comptia-cloud-plus-p6.ts',
  'scripts/seed-comptia-cloud-plus-p7.ts',
  'scripts/seed-comptia-cloud-plus-p8.ts',
  // Professional Scrum Master practice exam (hosted under CompTIA vendor)
  'scripts/seed-comptia-psm-p6.ts',
  // Microsoft practice exams
  'scripts/seed-microsoft-ai102.ts',
  'scripts/seed-microsoft-dp203-p6.ts'
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
