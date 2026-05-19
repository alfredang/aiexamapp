/* Self-contained, idempotent migration for the standardized OCI Foundations
 * bundle (1Z0-1085) — brand-new on prod (prod only has the old single
 * 1Z0-1085-25 exam, untouched here).
 *
 * INSERT-ONLY, every statement guarded by WHERE NOT EXISTS:
 *  - Vendor oracle: insert if absent (never clobbers)
 *  - Bundle oracle-oci-foundations: insert if absent (published=false)
 *  - 3 Exams -p1/-p2/-p3 (codes 1Z0-1085-P{n}): insert if absent
 *    (published=false — admin activates, like the other vendors)
 *  - BundleItems: 3 PRACTICE + 1 VOUCHER, insert if absent
 *  - 195 Questions: per exam, INSERT ... NOT EXISTS(examId,stem), PUBLISHED
 *
 * No UPDATE anywhere -> never overwrites an existing row, never touches
 * published/deletedAt on anything that already exists. Safe to re-run.
 * Self-contained so it does NOT depend on prisma/seed.ts ordering
 * (migrate deploy runs before seed.ts).
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();
const T = '$oci$';
const BUNDLE = 'oracle-oci-foundations';
const CODES = ['1Z0-1085-P1', '1Z0-1085-P2', '1Z0-1085-P3'];

function q(v) {
  const s = String(v);
  if (s.includes(T)) throw new Error(`delimiter ${T} present in data: ${s.slice(0, 80)}`);
  return `${T}${s}${T}`;
}
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;

async function main() {
  const out = [
    '-- Oracle OCI Foundations (1Z0-1085) standardized bundle — NEW on prod.',
    '-- Self-contained + idempotent: INSERT-only, every stmt WHERE NOT EXISTS.',
    '-- Creates bundle + 3 exams (published=false; admin activates) + 195 Q',
    '-- (PUBLISHED). No UPDATE/DELETE; never touches published/deletedAt on',
    '-- existing rows. Does NOT touch the old single oracle-oci-foundations-',
    '-- 1z0-1085 (admin will Archive that separately).',
    '',
    'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    ''
  ];

  // 1. Vendor (insert if absent)
  const vend = await db.vendor.findFirst({ where: { slug: 'oracle' } });
  out.push(
    `INSERT INTO "Vendor" (id, slug, name, description) ` +
    `SELECT gen_random_uuid()::text, ${q('oracle')}, ${q(vend.name)}, ${vend.description == null ? 'NULL' : q(vend.description)} ` +
    `WHERE NOT EXISTS (SELECT 1 FROM "Vendor" WHERE slug = ${q('oracle')});`, ''
  );

  // 2. Bundle (insert if absent; published=false)
  const b = await db.bundle.findUnique({ where: { slug: BUNDLE } });
  out.push(
    `INSERT INTO "Bundle" (id, slug, title, description, price, "priceVoucher", published, "createdAt", "updatedAt") ` +
    `SELECT gen_random_uuid()::text, ${q(b.slug)}, ${q(b.title)}, ${q(b.description)}, ${b.price}, ${b.priceVoucher == null ? 'NULL' : b.priceVoucher}, false, NOW(), NOW() ` +
    `WHERE NOT EXISTS (SELECT 1 FROM "Bundle" WHERE slug = ${q(b.slug)});`, ''
  );

  // 3. Exams (insert if absent; published=false)
  const exams = await db.exam.findMany({ where: { code: { in: CODES } }, orderBy: { code: 'asc' } });
  for (const e of exams) {
    out.push(
      `INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", label, domains, published, "createdAt", "updatedAt") ` +
      `SELECT gen_random_uuid()::text, v.id, ${q(e.code)}, ${q(e.slug)}, ${q(e.title)}, ${q(e.description)}, ${q(e.level)}, ${e.durationMinutes}, ${e.passingScore}, ${e.questionCount}, ${e.label == null ? 'NULL' : q(e.label)}, ${j(e.domains)}, false, NOW(), NOW() ` +
      `FROM "Vendor" v WHERE v.slug = ${q('oracle')} ` +
      `AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE slug = ${q(e.slug)});`
    );
  }
  out.push('');

  // 4. BundleItems (insert if absent)
  const bundle = await db.bundle.findUnique({
    where: { slug: BUNDLE },
    include: { items: { include: { exam: { select: { slug: true } } } } }
  });
  for (const it of bundle.items) {
    out.push(
      `INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position) ` +
      `SELECT gen_random_uuid()::text, bn.id, ex.id, ${q(it.tier)}::"Tier", ${it.position} ` +
      `FROM "Bundle" bn, "Exam" ex WHERE bn.slug = ${q(BUNDLE)} AND ex.slug = ${q(it.exam.slug)} ` +
      `AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi JOIN "Bundle" b2 ON b2.id=bi."bundleId" JOIN "Exam" e2 ON e2.id=bi."examId" WHERE b2.slug=${q(BUNDLE)} AND e2.slug=${q(it.exam.slug)} AND bi.tier=${q(it.tier)}::"Tier");`
    );
  }
  out.push('');

  // 5. Questions (per exam, NOT EXISTS on stem, PUBLISHED)
  let total = 0;
  for (const code of CODES) {
    const exam = exams.find((e) => e.code === code);
    const qs = await db.question.findMany({ where: { examId: exam.id }, orderBy: { createdAt: 'asc' } });
    out.push(`-- ${code} (${qs.length} questions)`);
    for (const x of qs) {
      total++;
      out.push(
        `INSERT INTO "Question" (id, "examId", domain, difficulty, type, stem, options, correct, explanation, "references", status, "generatedBy", "isTeaser", version, "createdAt", "updatedAt") ` +
        `SELECT gen_random_uuid()::text, e.id, ${q(x.domain)}, ${x.difficulty}, ${q(x.type)}::"QType", ${q(x.stem)}, ${j(x.options)}, ${j(x.correct)}, ${q(x.explanation)}, ${x.references == null ? 'NULL' : j(x.references)}, ${q('PUBLISHED')}::"QStatus", ${x.generatedBy == null ? 'NULL' : q(x.generatedBy)}, ${x.isTeaser}, ${x.version}, NOW(), NOW() ` +
        `FROM "Exam" e WHERE e.code = ${q(code)} ` +
        `AND NOT EXISTS (SELECT 1 FROM "Question" q2 WHERE q2."examId" = e.id AND q2.stem = ${q(x.stem)});`
      );
    }
    out.push('');
  }

  const ts = '20260519170000';
  const dir = path.join('prisma', 'migrations', `${ts}_oci_foundations_standardize`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'migration.sql');
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  console.log(`wrote ${file}`);
  console.log(`bundle=${BUNDLE} exams=${exams.length} questions=${total} | ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
