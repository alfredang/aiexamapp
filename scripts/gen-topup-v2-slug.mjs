/* Combined corrective top-up V2 — keyed by SLUG — for the 6 certs whose
 * original code-keyed migrations inserted 0 on prod (prod codes differ
 * from local; migrations run once and are now spent).
 *
 * Proven by RHCSA v2: slug is identical local<->prod, so slug-keyed
 * inserts land correctly. One migration, all 6 certs (18 exams, 1170 Q).
 *
 * SAFE: INSERT INTO "Question" only; idempotent NOT EXISTS(examId,stem);
 * no Exam/Bundle/Vendor writes; never touches published/deletedAt; no
 * deletes. status = PUBLISHED. New folder (never edit a spent migration).
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();
const T = '$tv2$';
const GROUPS = {
  elastic: ['elastic-certified-engineer-p1', 'elastic-certified-engineer-p2', 'elastic-certified-engineer-p3'],
  cka: ['linuxfoundation-cka-p1', 'linuxfoundation-cka-p2', 'linuxfoundation-cka-p3'],
  ckad: ['linuxfoundation-ckad-p1', 'linuxfoundation-ckad-p2', 'linuxfoundation-ckad-p3'],
  dca: ['docker-dca-p1', 'docker-dca-p2', 'docker-dca-p3'],
  gitlab: ['gitlab-certified-associate-p1', 'gitlab-certified-associate-p2', 'gitlab-certified-associate-p3'],
  terraform: ['hashicorp-terraform-associate-p1', 'hashicorp-terraform-associate-p2', 'hashicorp-terraform-associate-p3']
};

function q(v) {
  const s = String(v);
  if (s.includes(T)) throw new Error(`delimiter ${T} present in data: ${s.slice(0, 80)}`);
  return `${T}${s}${T}`;
}
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;

async function main() {
  const out = [
    '-- Combined corrective top-up V2 — keyed by SLUG (not code).',
    '-- The original code-keyed top-ups (elastic/cka/ckad/dca/gitlab/terraform)',
    '-- matched 0 on prod because prod codes differ from local; migrations run',
    '-- once. Slugs are identical local<->prod (proven by RHCSA v2).',
    '-- SAFE: only INSERT INTO "Question"; idempotent via NOT EXISTS(examId,stem);',
    '-- no Exam/Bundle writes; never touches published/deletedAt; no deletes.',
    '',
    'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    ''
  ];

  let total = 0;
  for (const [cert, slugs] of Object.entries(GROUPS)) {
    out.push(`-- ===== ${cert} =====`);
    for (const slug of slugs) {
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
  }

  const ts = '20260519210000';
  const dir = path.join('prisma', 'migrations', `${ts}_topup_v2_slug`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'migration.sql');
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  console.log(`wrote ${file}`);
  console.log(`certs=${Object.keys(GROUPS).join(',')} questions=${total} | ${(fs.statSync(file).size / 1048576).toFixed(2)} MB`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
