/* Generate the Wave 3 targeted data-migration SQL from the local DB.
 * Emits prisma/migrations/<ts>_wave3_competitor_parity/migration.sql.
 *
 * Pattern mirrors the repo's existing data migrations (e.g.
 * 20260515030000_linux_plus_topup): idempotent, dollar-quoted, safe to
 * re-run. Content lands as DRAFT / unpublished (review-first norm). The
 * migration NEVER writes published/deletedAt on pre-existing rows, so a
 * prod admin's manual activation/archival is preserved.
 *
 * Idempotency:
 *  - Vendor: INSERT WHERE NOT EXISTS (slug)        — never clobbers
 *  - Bundle: UPSERT by slug (does NOT set published)
 *  - Exam:   UPSERT by slug (does NOT set published/deletedAt)
 *  - BundleItem: delete-for-our-bundles + reinsert
 *  - Question: per-exam delete-by-generatedBy + reinsert (status DRAFT)
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();
const TAG = '$w3$'; // dollar-quote delimiter; asserted absent from all data

const BUNDLES = [
  'microsoft-az-305','microsoft-az-204','microsoft-sc-900','comptia-a-plus','comptia-network-plus','comptia-security-plus',
  'google-professional-cloud-architect','google-professional-data-engineer','isc2-ccsp','linuxfoundation-cks','pmi-capm','scrum-org-pspo-i',
  'axelos-itil4-foundation','tableau-desktop-specialist','iassc-lean-six-sigma-green-belt','comptia-pentest-plus','comptia-securityx','isc2-cc',
  'microsoft-sc-300','microsoft-pl-900','cisco-devnet-associate-200-901','linuxfoundation-kcna','hashicorp-vault-associate','pmi-acp',
  'microsoft-sc-100','microsoft-dp-600','microsoft-pl-600','google-professional-cloud-devops-engineer','google-professional-cloud-network-engineer','cisco-ccnp-security-350-701',
  'comptia-project-plus','oracle-java-se-17-1z0-829','isc2-sscp','pmi-rmp','linuxfoundation-kcsa','hashicorp-consul-associate'
];

function q(v: string): string {
  if (v.includes(TAG)) throw new Error(`delimiter ${TAG} found in data: ${v.slice(0, 80)}`);
  return `${TAG}${v}${TAG}`;
}
const j = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;

async function main() {
  const out: string[] = [];
  out.push(
    '-- Wave 3 competitor-parity catalog: 36 bundles, 109 exams, 7,085 questions.',
    '-- Generated from the verified local DB. Idempotent (safe to re-run):',
    '--   Vendor INSERT-if-absent; Bundle/Exam UPSERT by slug; BundleItem and',
    '--   Question delete-then-reinsert scoped to these bundles/tags only.',
    '-- Content lands as DRAFT / unpublished (review-first norm): an admin',
    '-- activates each bundle/exam in the admin UI after spot-review. This',
    '-- migration NEVER sets published/deletedAt (new rows default unpublished;',
    '-- existing rows keep whatever a prod admin set).',
    '',
    'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    ''
  );

  const bundles = await db.bundle.findMany({
    where: { slug: { in: BUNDLES } },
    include: { items: { include: { exam: { include: { vendor: true } } } } }
  });
  if (bundles.length !== BUNDLES.length)
    throw new Error(`expected ${BUNDLES.length} bundles, found ${bundles.length}`);

  // 1. Vendors (insert only if missing — never clobber prod vendor rows)
  const vendors = new Map<string, { slug: string; name: string; description: string | null }>();
  for (const b of bundles)
    for (const it of b.items)
      vendors.set(it.exam.vendor.slug, it.exam.vendor);
  out.push('-- 1. Vendors (insert if absent)');
  for (const v of vendors.values()) {
    out.push(
      `INSERT INTO "Vendor" (id, slug, name, description) ` +
      `SELECT gen_random_uuid()::text, ${q(v.slug)}, ${q(v.name)}, ${v.description == null ? 'NULL' : q(v.description)} ` +
      `WHERE NOT EXISTS (SELECT 1 FROM "Vendor" WHERE slug = ${q(v.slug)});`
    );
  }
  out.push('');

  // 2. Bundles (upsert by slug; never sets published — admin activates)
  out.push('-- 2. Bundles (upsert by slug; published left to admin)');
  for (const b of bundles) {
    out.push(
      `INSERT INTO "Bundle" (id, slug, title, description, price, "priceVoucher", published, "createdAt", "updatedAt") ` +
      `VALUES (gen_random_uuid()::text, ${q(b.slug)}, ${q(b.title)}, ${q(b.description)}, ${b.price}, ${b.priceVoucher == null ? 'NULL' : b.priceVoucher}, false, NOW(), NOW()) ` +
      `ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, "priceVoucher" = EXCLUDED."priceVoucher", "updatedAt" = NOW();`
    );
  }
  out.push('');

  // 3. Exams (upsert by slug; vendorId resolved via Vendor subquery)
  const examsBySlug = new Map<string, typeof bundles[0]['items'][0]['exam']>();
  for (const b of bundles)
    for (const it of b.items) examsBySlug.set(it.exam.slug, it.exam);
  out.push('-- 3. Exams (upsert by slug; never sets published/deletedAt)');
  for (const e of examsBySlug.values()) {
    out.push(
      `INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", label, domains, published, "createdAt", "updatedAt") ` +
      `SELECT gen_random_uuid()::text, v.id, ${q(e.code)}, ${q(e.slug)}, ${q(e.title)}, ${q(e.description)}, ${q(e.level)}, ${e.durationMinutes}, ${e.passingScore}, ${e.questionCount}, ${e.label == null ? 'NULL' : q(e.label)}, ${j(e.domains)}, false, NOW(), NOW() ` +
      `FROM "Vendor" v WHERE v.slug = ${q(e.vendor.slug)} ` +
      `ON CONFLICT (slug) DO UPDATE SET "vendorId" = EXCLUDED."vendorId", code = EXCLUDED.code, title = EXCLUDED.title, description = EXCLUDED.description, level = EXCLUDED.level, "durationMinutes" = EXCLUDED."durationMinutes", "passingScore" = EXCLUDED."passingScore", "questionCount" = EXCLUDED."questionCount", label = EXCLUDED.label, domains = EXCLUDED.domains, "updatedAt" = NOW();`
    );
  }
  out.push('');

  // 4. BundleItems (delete-for-our-bundles + reinsert)
  out.push('-- 4. BundleItems (reset wiring for these bundles)');
  const slugList = BUNDLES.map((s) => q(s)).join(', ');
  out.push(`DELETE FROM "BundleItem" WHERE "bundleId" IN (SELECT id FROM "Bundle" WHERE slug IN (${slugList}));`);
  for (const b of bundles) {
    for (const it of b.items) {
      out.push(
        `INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position) ` +
        `SELECT gen_random_uuid()::text, bn.id, ex.id, ${q(it.tier)}::"Tier", ${it.position} ` +
        `FROM "Bundle" bn, "Exam" ex WHERE bn.slug = ${q(b.slug)} AND ex.slug = ${q(it.exam.slug)} ` +
        `ON CONFLICT ("bundleId", "examId", tier) DO UPDATE SET position = EXCLUDED.position;`
      );
    }
  }
  out.push('');

  // 5. Questions (per-exam delete-by-generatedBy + reinsert)
  out.push('-- 5. Questions (delete-by-generatedBy then reinsert, per exam)');
  let totalQ = 0;
  for (const slug of [...examsBySlug.keys()].sort()) {
    const e = examsBySlug.get(slug)!;
    const qs = await db.question.findMany({ where: { examId: e.id }, orderBy: { createdAt: 'asc' } });
    const tags = [...new Set(qs.map((x) => x.generatedBy || ''))].filter(Boolean);
    for (const t of tags) {
      out.push(
        `DELETE FROM "Question" WHERE "generatedBy" = ${q(t)} AND "examId" = (SELECT id FROM "Exam" WHERE slug = ${q(slug)});`
      );
    }
    for (const x of qs) {
      totalQ++;
      out.push(
        `INSERT INTO "Question" (id, "examId", domain, difficulty, type, stem, options, correct, explanation, "references", status, "generatedBy", "isTeaser", version, "createdAt", "updatedAt") ` +
        `SELECT gen_random_uuid()::text, e.id, ${q(x.domain)}, ${x.difficulty}, ${q(x.type)}::"QType", ${q(x.stem)}, ${j(x.options)}, ${j(x.correct)}, ${q(x.explanation)}, ${x.references == null ? 'NULL' : j(x.references)}, ${q('DRAFT')}::"QStatus", ${x.generatedBy == null ? 'NULL' : q(x.generatedBy)}, ${x.isTeaser}, ${x.version}, NOW(), NOW() ` +
        `FROM "Exam" e WHERE e.slug = ${q(slug)};`
      );
    }
  }
  out.push('');

  const ts = '20260518120000';
  const dir = path.join('prisma', 'migrations', `${ts}_wave3_competitor_parity`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'migration.sql');
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  const bytes = fs.statSync(file).size;
  console.log(`wrote ${file}`);
  console.log(`bundles=${bundles.length} exams=${examsBySlug.size} questions=${totalQ} vendors=${vendors.size} | ${(bytes / 1048576).toFixed(2)} MB`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
