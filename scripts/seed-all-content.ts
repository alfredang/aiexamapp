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
  // AWS practice exams from PDF batch (parsed via scripts/_pdf-to-seed.ts)
  'scripts/seed-aws-mla-c01-p1.ts',
  'scripts/seed-aws-clf-c02-p1.ts',
  'scripts/seed-aws-clf-c02-p2.ts',
  'scripts/seed-aws-clf-c02-p3.ts',
  'scripts/seed-aws-clf-c02-p4.ts',
  'scripts/seed-aws-clf-c02-p5.ts',
  'scripts/seed-aws-clf-c02-p6.ts',
  'scripts/seed-aws-saa-c03-p1.ts',
  'scripts/seed-aws-saa-c03-p2.ts',
  'scripts/seed-aws-saa-c03-p3.ts',
  'scripts/seed-aws-saa-c03-p4.ts',
  'scripts/seed-aws-saa-c03-p5.ts',
  'scripts/seed-aws-saa-c03-p6.ts',
  'scripts/seed-aws-dva-c02-p1.ts',
  'scripts/seed-aws-dva-c02-p2.ts',
  'scripts/seed-aws-dva-c02-p3.ts',
  'scripts/seed-aws-dva-c02-p4.ts',
  'scripts/seed-aws-dva-c02-p5.ts',
  'scripts/seed-aws-dva-c02-p6.ts',
  'scripts/seed-aws-dop-c02-p1.ts',
  'scripts/seed-aws-dop-c02-p2.ts',
  'scripts/seed-aws-dop-c02-p3.ts',
  'scripts/seed-aws-dop-c02-p4.ts',
  'scripts/seed-aws-dop-c02-p5.ts',
  'scripts/seed-aws-dop-c02-p6.ts',
  'scripts/seed-aws-dop-c02-p7.ts',
  'scripts/seed-aws-dop-c02-p8.ts',
  'scripts/seed-aws-aif-c01-p1.ts',
  'scripts/seed-aws-aif-c01-p2.ts',
  'scripts/seed-aws-aif-c01-p3.ts',
  'scripts/seed-aws-aif-c01-p4.ts',
  'scripts/seed-aws-aif-c01-p5.ts',
  'scripts/seed-aws-aif-c01-p6.ts',
  'scripts/seed-aws-aif-c01-p7.ts',
  // AWS DEA-C01 practice exams (recovered via raw-mode parser)
  'scripts/seed-aws-dea-c01-p1.ts',
  'scripts/seed-aws-dea-c01-p2.ts',
  'scripts/seed-aws-dea-c01-p3.ts',
  'scripts/seed-aws-dea-c01-p4.ts',
  // Microsoft practice exams from PDF batch
  'scripts/seed-microsoft-ai-900-p1.ts',
  'scripts/seed-microsoft-ai-900-p2.ts',
  'scripts/seed-microsoft-ai-900-p3.ts',
  'scripts/seed-microsoft-ai-900-p4.ts',
  'scripts/seed-microsoft-ai-900-p5.ts',
  'scripts/seed-microsoft-ai-900-p6.ts',
  'scripts/seed-microsoft-ai-102-official.ts',
  'scripts/seed-microsoft-az-104-p1.ts',
  'scripts/seed-microsoft-az-104-p3.ts',
  'scripts/seed-microsoft-az-104-p4.ts',
  'scripts/seed-microsoft-az-500-p1.ts',
  'scripts/seed-microsoft-dp-203-p1.ts',
  'scripts/seed-microsoft-dp-900-p1.ts',
  'scripts/seed-microsoft-dp-900-p2.ts',
  'scripts/seed-microsoft-dp-900-p3.ts',
  'scripts/seed-microsoft-dp-900-p4.ts',
  'scripts/seed-microsoft-md-102-p1.ts',
  'scripts/seed-microsoft-md-102-p2.ts',
  'scripts/seed-microsoft-md-102-p3.ts',
  'scripts/seed-microsoft-md-102-p4.ts',
  'scripts/seed-microsoft-pl-300-p1.ts',
  'scripts/seed-microsoft-pl-300-p2.ts',
  'scripts/seed-microsoft-pl-300-p3.ts',
  'scripts/seed-microsoft-pl-300-p4.ts',
  'scripts/seed-microsoft-pl-300-p5.ts',
  'scripts/seed-microsoft-sc-200-p1.ts',
  'scripts/seed-microsoft-sc-200-p2.ts',
  'scripts/seed-microsoft-sc-200-p3.ts',
  'scripts/seed-microsoft-sc-200-p4.ts',
  'scripts/seed-microsoft-sc-200-p5.ts',
  // Microsoft additional practice exams (recovered via raw-mode parser)
  'scripts/seed-microsoft-ai-102-p1.ts',
  'scripts/seed-microsoft-ai-102-p2.ts',
  'scripts/seed-microsoft-ai-102-p3.ts',
  'scripts/seed-microsoft-ai-102-p4.ts',
  'scripts/seed-microsoft-dp-100-p1.ts',
  'scripts/seed-microsoft-dp-100-p2.ts',
  'scripts/seed-microsoft-dp-300-p1.ts',
  'scripts/seed-microsoft-dp-300-p2.ts',
  'scripts/seed-microsoft-dp-300-p3.ts',
  'scripts/seed-microsoft-dp-300-p4.ts',
  'scripts/seed-microsoft-ms-102-p1.ts',
  'scripts/seed-microsoft-ms-102-p2.ts',
  'scripts/seed-microsoft-ms-102-p4.ts',
  // Google practice exams from PDF batch
  'scripts/seed-google-ace-p1.ts',
  'scripts/seed-google-ace-p2.ts',
  'scripts/seed-google-professional-ml-engineer-p1.ts',
  'scripts/seed-google-professional-ml-engineer-p2.ts',
  'scripts/seed-google-professional-ml-engineer-p3.ts',
  'scripts/seed-google-professional-ml-engineer-p4.ts',
  'scripts/seed-google-professional-ml-engineer-p5.ts',
  'scripts/seed-google-professional-ml-engineer-p6.ts',
  // CompTIA Server+/Linux+/Data+ practice exams from PDF batch
  'scripts/seed-comptia-server-plus-p1.ts',
  'scripts/seed-comptia-server-plus-p2.ts',
  'scripts/seed-comptia-server-plus-p3.ts',
  'scripts/seed-comptia-server-plus-p4.ts',
  'scripts/seed-comptia-linux-plus-p1.ts',
  'scripts/seed-comptia-linux-plus-p2.ts',
  'scripts/seed-comptia-linux-plus-p3.ts',
  'scripts/seed-comptia-linux-plus-p4.ts',
  'scripts/seed-comptia-linux-plus-p5.ts',
  'scripts/seed-comptia-linux-plus-p6.ts',
  'scripts/seed-comptia-data-plus-p1.ts',
  'scripts/seed-comptia-data-plus-p2.ts',
  'scripts/seed-comptia-data-plus-p3.ts',
  'scripts/seed-comptia-data-plus-p4.ts',
  'scripts/seed-comptia-data-plus-p5.ts',
  'scripts/seed-comptia-data-plus-p6.ts',
  // Cisco CCNP ENCOR practice exams from PDF batch
  'scripts/seed-cisco-ccnp-encor-p1.ts',
  'scripts/seed-cisco-ccnp-encor-p2.ts',
  // Cisco CCNA practice exams (recovered via raw-mode parser)
  'scripts/seed-cisco-ccna-p1.ts',
  'scripts/seed-cisco-ccna-p2.ts',
  'scripts/seed-cisco-ccna-p3.ts',
  'scripts/seed-cisco-ccna-p4.ts',
  'scripts/seed-cisco-ccna-p5.ts',
  'scripts/seed-cisco-ccna-p6.ts',
  // ISC2 CISSP practice exams from PDF batch
  'scripts/seed-isc2-cissp-p1.ts',
  'scripts/seed-isc2-cissp-p2.ts',
  'scripts/seed-isc2-cissp-p3.ts',
  'scripts/seed-isc2-cissp-p4.ts',
  'scripts/seed-isc2-cissp-p5.ts',
  'scripts/seed-isc2-cissp-p6.ts',
  // PMI PMP practice exams from PDF batch
  'scripts/seed-pmi-pmp-p1.ts',
  'scripts/seed-pmi-pmp-p2.ts',
  'scripts/seed-pmi-pmp-p3.ts',
  'scripts/seed-pmi-pmp-p4.ts',
  'scripts/seed-pmi-pmp-p5.ts',
  'scripts/seed-pmi-pmp-p6.ts',
  // Scrum.org PSM I practice exams from PDF batch
  'scripts/seed-scrum-org-psm-i-p1.ts',
  'scripts/seed-scrum-org-psm-i-p5.ts',
  // GitHub Foundations practice exams from PDF batch
  'scripts/seed-github-foundations-p1.ts',
  'scripts/seed-github-foundations-p2.ts',
  'scripts/seed-github-foundations-p3.ts',
  'scripts/seed-github-foundations-p4.ts',
  // AXELOS ITIL 4 Foundation practice exam from PDF batch
  'scripts/seed-axelos-itil4-foundation-p7.ts',
  // Tableau Desktop Specialist practice exam from PDF batch
  'scripts/seed-tableau-desktop-specialist-p5.ts',
  // IASSC CLSSGB practice exam from PDF batch
  'scripts/seed-iassc-clssgb-p1.ts',
  // Topup scripts — bring exams to 60 questions with hand-authored supplementals
  'scripts/seed-microsoft-ai-900-topup.ts',
  'scripts/seed-tableau-desktop-topup.ts',
  'scripts/seed-axelos-itil4-topup.ts',
  'scripts/seed-iassc-clssgb-topup.ts',
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
