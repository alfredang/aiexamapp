/* MS-102 wipe-and-fill refill migration.
 *
 * Mirrors gen-az104-refill-wipe.mjs. Prod state for MS-102 p1/p2/p3 may be
 * partial/mixed-source; this lands a clean curated 65x3 by:
 *   1. DELETEing every question on microsoft-ms-102-p1/p2/p3 (slug-keyed).
 *   2. INSERTing the 195 curated questions from local (manual:ms102-seed).
 *
 * SAFE BY CONSTRUCTION:
 *  - Scoped to the 3 specific slugs only. microsoft-ms-102-p4 untouched
 *    (orphan; admin handles separately).
 *  - No Exam/Bundle writes. Never touches published/deletedAt.
 *  - INSERTs are NOT EXISTS-guarded (idempotent vs the just-deleted state).
 *  - status = PUBLISHED. Prod exams are INACTIVE per user; surface only
 *    on admin reactivation.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();
const T = '$ms102r$';
const SLUGS = ['microsoft-ms-102-p1', 'microsoft-ms-102-p2', 'microsoft-ms-102-p3'];

function q(v) {
  const s = String(v);
  if (s.includes(T)) throw new Error(`delimiter ${T} present in data: ${s.slice(0, 80)}`);
  return `${T}${s}${T}`;
}
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;

async function main() {
  const out = [
    '-- MS-102 wipe-and-fill refill (curated 65x3 -> prod p1/p2/p3).',
    '-- Prod had partial/mixed-source content; this clears those exam rows',
    '-- and inserts the manual:ms102-seed canonical set (18/18/21/8 blueprint).',
    '-- SAFE: scoped to 3 slugs; no Exam/Bundle writes; never touches',
    '-- published/deletedAt; p4 untouched; INSERTs idempotent via NOT EXISTS.',
    '',
    'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    '',
    `-- 1. Wipe existing questions for MS-102 p1/p2/p3 only`,
    `DELETE FROM "Question" WHERE "examId" IN (SELECT id FROM "Exam" WHERE slug IN (${SLUGS.map((s) => q(s)).join(', ')}));`,
    '',
    '-- 2. Insert the curated 65 per variant from local'
  ];

  let total = 0;
  for (const slug of SLUGS) {
    const exam = await db.exam.findUnique({ where: { slug } });
    if (!exam) throw new Error(`local exam not found: ${slug}`);
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

  const ts = '20260520130000';
  const dir = path.join('prisma', 'migrations', `${ts}_ms102_refill_wipe`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'migration.sql');
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  console.log(`wrote ${file}`);
  console.log(`slugs=${SLUGS.join(',')} questions=${total} | ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
