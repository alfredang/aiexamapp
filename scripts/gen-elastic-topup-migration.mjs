/* Generate the Elastic Certified Engineer question-only top-up migration.
 *
 * Prod exam codes were aligned to match local: both use ECE-P{n} now.
 * (They were CERTIFIED-ENGINEER-P{n} on prod earlier; admin renamed them.)
 * Read questions from local ECE-P{n}, emit inserts keyed on prod ECE-P{n}.
 *
 * Same safe shape as the DCA top-up (20260519120000_dca_topup):
 *  - INSERT INTO "Question" only. No Exam/Bundle/Vendor writes.
 *  - Never sets published / deletedAt. Never deletes.
 *  - Idempotent: NOT EXISTS on (examId, stem).
 *  - status = PUBLISHED (prod Elastic exams are INACTIVE/hidden; they only
 *    surface when an admin reactivates them — admin already set qc=65).
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();
const T = '$ece$';
// local code -> prod code (now identical — prod renamed to match local)
const MAP = { 'ECE-P1': 'ECE-P1', 'ECE-P2': 'ECE-P2', 'ECE-P3': 'ECE-P3' };

function q(v) {
  const s = String(v);
  if (s.includes(T)) throw new Error(`delimiter ${T} present in data: ${s.slice(0, 80)}`);
  return `${T}${s}${T}`;
}
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;

async function main() {
  const out = [
    '-- Elastic Certified Engineer question-only top-up (Wave 2 content -> prod).',
    '-- Codes aligned: local ECE-P{n} == prod ECE-P{n} (admin renamed prod).',
    '-- SAFE: only INSERT INTO "Question"; idempotent via NOT EXISTS(examId,stem);',
    '-- no Exam/Bundle writes; never touches published/deletedAt; no deletes.',
    '-- Target prod exams are INACTIVE — questions land PUBLISHED and become',
    '-- visible only when an admin reactivates the exams.',
    '',
    'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    ''
  ];

  let total = 0;
  for (const [localCode, prodCode] of Object.entries(MAP)) {
    const exam = await db.exam.findFirst({ where: { code: localCode } });
    if (!exam) throw new Error(`local exam not found for code ${localCode}`);
    const qs = await db.question.findMany({ where: { examId: exam.id }, orderBy: { createdAt: 'asc' } });
    out.push(`-- ${localCode} (local) -> ${prodCode} (prod): ${qs.length} questions`);
    for (const x of qs) {
      total++;
      out.push(
        `INSERT INTO "Question" (id, "examId", domain, difficulty, type, stem, options, correct, explanation, "references", status, "generatedBy", "isTeaser", version, "createdAt", "updatedAt") ` +
        `SELECT gen_random_uuid()::text, e.id, ${q(x.domain)}, ${x.difficulty}, ${q(x.type)}::"QType", ${q(x.stem)}, ${j(x.options)}, ${j(x.correct)}, ${q(x.explanation)}, ${x.references == null ? 'NULL' : j(x.references)}, ${q('PUBLISHED')}::"QStatus", ${x.generatedBy == null ? 'NULL' : q(x.generatedBy)}, ${x.isTeaser}, ${x.version}, NOW(), NOW() ` +
        `FROM "Exam" e WHERE e.code = ${q(prodCode)} ` +
        `AND NOT EXISTS (SELECT 1 FROM "Question" q2 WHERE q2."examId" = e.id AND q2.stem = ${q(x.stem)});`
      );
    }
    out.push('');
  }

  const ts = '20260519130000';
  const dir = path.join('prisma', 'migrations', `${ts}_elastic_topup`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'migration.sql');
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  console.log(`wrote ${file}`);
  console.log(`map=${JSON.stringify(MAP)} questions=${total} | ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
