/* CKA + CKAD question-only top-up migration (combined — both Kubernetes
 * certs, 6 exams). Codes match: local == prod == CKA-P{n} / CKAD-P{n}.
 *
 * Prod CKA/CKAD exam rows exist but the admin emptied their question pools,
 * so this is a clean refill. Same safe shape as the DCA top-up:
 *  - INSERT INTO "Question" only. No Exam/Bundle/Vendor writes.
 *  - Idempotent: NOT EXISTS on (examId, stem). status = PUBLISHED.
 *  - Never sets published/deletedAt. No deletes. (prod exams INACTIVE;
 *    admin reactivates after verifying.)
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();
const T = '$k8s$';
const CODES = ['CKA-P1', 'CKA-P2', 'CKA-P3', 'CKAD-P1', 'CKAD-P2', 'CKAD-P3'];

function q(v) {
  const s = String(v);
  if (s.includes(T)) throw new Error(`delimiter ${T} present in data: ${s.slice(0, 80)}`);
  return `${T}${s}${T}`;
}
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;

async function main() {
  const out = [
    '-- CKA + CKAD question-only top-up (Wave 2 content -> prod).',
    '-- Codes match: local == prod == CKA-P{n} / CKAD-P{n}.',
    '-- SAFE: only INSERT INTO "Question"; idempotent via NOT EXISTS(examId,stem);',
    '-- no Exam/Bundle writes; never touches published/deletedAt; no deletes.',
    '-- Prod pools were emptied by admin; exams INACTIVE — clean refill,',
    '-- visible only when an admin reactivates them.',
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

  const ts = '20260519190000';
  const dir = path.join('prisma', 'migrations', `${ts}_cka_ckad_topup`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'migration.sql');
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  console.log(`wrote ${file}`);
  console.log(`codes=${CODES.join(',')} questions=${total} | ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
