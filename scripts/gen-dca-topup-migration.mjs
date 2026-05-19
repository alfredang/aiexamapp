/* Generate the Docker DCA question-only top-up migration from the local DB.
 *
 * Mirrors the proven repo pattern (20260515030000_linux_plus_topup):
 *   INSERT INTO "Question" ... SELECT ... FROM "Exam" e
 *     WHERE e.code = $dca$DCA-P1$dca$
 *     AND NOT EXISTS (SELECT 1 FROM "Question" q2
 *                     WHERE q2."examId"=e.id AND q2.stem = $dca$...$dca$);
 *
 * SAFE BY CONSTRUCTION:
 *  - Touches ONLY "Question" rows. No Exam/Bundle/Vendor writes.
 *  - Never sets published / deletedAt. Never deletes anything.
 *  - Idempotent: NOT EXISTS on (examId, stem) — re-runs are no-ops.
 *  - Keyed by exam CODE (DCA-P1/2/3) which matches prod exactly.
 *  - status = PUBLISHED (target prod exams are INACTIVE/hidden, so this is
 *    safe; they only become visible when the admin reactivates them).
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();
const T = '$dca$';
const CODES = ['DCA-P1', 'DCA-P2', 'DCA-P3'];

function q(v) {
  const s = String(v);
  if (s.includes(T)) throw new Error(`delimiter ${T} present in data: ${s.slice(0, 80)}`);
  return `${T}${s}${T}`;
}
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;

async function main() {
  const out = [
    '-- Docker DCA question-only top-up (Wave 2 content -> prod).',
    '-- Adds the curated 65-question DCA pool to DCA-P1/P2/P3.',
    '-- SAFE: only INSERT INTO "Question"; idempotent via NOT EXISTS(examId,stem);',
    '-- no Exam/Bundle writes; never touches published/deletedAt; no deletes.',
    '-- Target prod exams are INACTIVE — questions land PUBLISHED and become',
    '-- visible only when an admin reactivates the exams.',
    '',
    'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    ''
  ];

  let total = 0;
  for (const code of CODES) {
    const exam = await db.exam.findFirst({ where: { code } });
    if (!exam) throw new Error(`local exam not found for code ${code}`);
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

  const ts = '20260519120000';
  const dir = path.join('prisma', 'migrations', `${ts}_dca_topup`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'migration.sql');
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  console.log(`wrote ${file}`);
  console.log(`codes=${CODES.join(',')} questions=${total} | ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
