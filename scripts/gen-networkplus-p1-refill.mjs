/* Refill comptia-network-plus-p1 ONLY (admin emptied it on prod).
 * Slug-keyed, idempotent, question-only — same proven pattern as the
 * RHCSA/DCA/etc. v2 fixes.
 *
 * SAFE: INSERT INTO "Question" only; NOT EXISTS(examId,stem) so safe even
 * if not fully empty; no Exam/Bundle/Vendor writes; never touches
 * published/deletedAt; no deletes. status = PUBLISHED. Scoped to the
 * single slug comptia-network-plus-p1.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();
const T = '$np1$';
const SLUG = 'comptia-network-plus-p1';

function q(v) {
  const s = String(v);
  if (s.includes(T)) throw new Error(`delimiter ${T} present in data: ${s.slice(0, 80)}`);
  return `${T}${s}${T}`;
}
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;

async function main() {
  const exam = await db.exam.findUnique({ where: { slug: SLUG } });
  if (!exam) throw new Error(`local exam not found: ${SLUG}`);
  const qs = await db.question.findMany({ where: { examId: exam.id }, orderBy: { createdAt: 'asc' } });

  const out = [
    `-- Refill ${SLUG} (admin emptied it on prod). Single exam only.`,
    '-- Slug-keyed, idempotent (NOT EXISTS examId,stem), question-only.',
    '-- No Exam/Bundle writes; never touches published/deletedAt; no deletes.',
    '',
    'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    '',
    `-- ${SLUG} (${qs.length} questions)`
  ];
  for (const x of qs) {
    out.push(
      `INSERT INTO "Question" (id, "examId", domain, difficulty, type, stem, options, correct, explanation, "references", status, "generatedBy", "isTeaser", version, "createdAt", "updatedAt") ` +
      `SELECT gen_random_uuid()::text, e.id, ${q(x.domain)}, ${x.difficulty}, ${q(x.type)}::"QType", ${q(x.stem)}, ${j(x.options)}, ${j(x.correct)}, ${q(x.explanation)}, ${x.references == null ? 'NULL' : j(x.references)}, ${q('PUBLISHED')}::"QStatus", ${x.generatedBy == null ? 'NULL' : q(x.generatedBy)}, ${x.isTeaser}, ${x.version}, NOW(), NOW() ` +
      `FROM "Exam" e WHERE e.slug = ${q(SLUG)} ` +
      `AND NOT EXISTS (SELECT 1 FROM "Question" q2 WHERE q2."examId" = e.id AND q2.stem = ${q(x.stem)});`
    );
  }
  out.push('');

  const ts = '20260519220000';
  const dir = path.join('prisma', 'migrations', `${ts}_networkplus_p1_refill`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'migration.sql');
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  console.log(`wrote ${file}`);
  console.log(`slug=${SLUG} questions=${qs.length} | ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
