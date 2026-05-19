/* RHCSA EX200 corrective question-only top-up — V2, keyed by SLUG.
 *
 * The original 20260519180000_rhcsa_topup keyed on code RHCSA-P{n}, but
 * prod's code is RHCSA-EX200-P{n} -> it matched nothing and inserted 0,
 * and a migration runs only once (spent). The SLUG
 * (redhat-rhcsa-ex200-p{n}) is identical local<->prod, so this NEW
 * migration keys on slug and works.
 *
 * SAFE: INSERT INTO "Question" only; idempotent NOT EXISTS(examId,stem);
 * no Exam/Bundle/Vendor writes; never touches published/deletedAt; no
 * deletes. status = PUBLISHED. New folder (never edit a spent migration).
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();
const T = '$rh2$';
const SLUGS = ['redhat-rhcsa-ex200-p1', 'redhat-rhcsa-ex200-p2', 'redhat-rhcsa-ex200-p3'];

function q(v) {
  const s = String(v);
  if (s.includes(T)) throw new Error(`delimiter ${T} present in data: ${s.slice(0, 80)}`);
  return `${T}${s}${T}`;
}
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;

async function main() {
  const out = [
    '-- RHCSA EX200 corrective top-up V2 — keyed by SLUG (not code).',
    '-- Supersedes 20260519180000_rhcsa_topup, which keyed on code RHCSA-P{n}',
    '-- while prod uses RHCSA-EX200-P{n} (inserted 0; migrations run once).',
    '-- slug redhat-rhcsa-ex200-p{n} is identical local<->prod.',
    '-- SAFE: only INSERT INTO "Question"; idempotent via NOT EXISTS(examId,stem);',
    '-- no Exam/Bundle writes; never touches published/deletedAt; no deletes.',
    '',
    'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    ''
  ];

  let total = 0;
  for (const slug of SLUGS) {
    const exam = await db.exam.findUnique({ where: { slug } });
    if (!exam) throw new Error(`local exam not found for slug ${slug}`);
    const qs = await db.question.findMany({ where: { examId: exam.id }, orderBy: { createdAt: 'asc' } });
    out.push(`-- ${slug} (${qs.length} questions)`);
    for (const x of qs) {
      total++;
      out.push(
        `INSERT INTO "Question" (id, "examId", domain, difficulty, type, stem, options, correct, explanation, "references", status, "generatedBy", "isTeaser", version, "createdAt", "updatedAt") ` +
        `SELECT gen_random_uuid()::text, e.id, ${q(x.domain)}, ${x.difficulty}, ${q(x.type)}::"QType", ${q(x.stem)}, ${j(x.options)}, ${j(x.correct)}, ${q(x.explanation)}, ${x.references == null ? 'NULL' : j(x.references)}, ${q('PUBLISHED')}::"QStatus", ${x.generatedBy == null ? 'NULL' : q(x.generatedBy)}, ${x.isTeaser}, ${x.version}, NOW(), NOW() ` +
        `FROM "Exam" e WHERE e.slug = ${q(slug)} ` +
        `AND NOT EXISTS (SELECT 1 FROM "Question" q2 WHERE q2."examId" = e.id AND q2.stem = ${q(x.stem)});`
      );
    }
    out.push('');
  }

  const ts = '20260519200000';
  const dir = path.join('prisma', 'migrations', `${ts}_rhcsa_topup_v2`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'migration.sql');
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  console.log(`wrote ${file}`);
  console.log(`slugs=${SLUGS.join(',')} questions=${total} | ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
