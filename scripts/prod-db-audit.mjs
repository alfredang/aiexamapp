/* READ-ONLY production DB audit via Prisma.
 *
 * Reads the prod connection string from .env.prod (gitignored), points a
 * throwaway PrismaClient at it, and runs ONLY read queries
 * (findMany / count / groupBy). No create/update/delete, no raw writes,
 * no migrations. Prints a per-vendor map of every exam's code / Q-count
 * (field vs actual) / level / published, flags thin (<50 real Q) and
 * duplicate cert families, shows bundle wiring, and reports attempt/order
 * counts for the legacy ITIL rows so archive decisions are safe.
 *
 * Run:  node scripts/prod-db-audit.mjs
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const envTxt = fs.existsSync('.env.prod') ? fs.readFileSync('.env.prod', 'utf8') : '';
const m = envTxt.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)/m);
if (!m) { console.error('No DATABASE_URL in .env.prod — create it first.'); process.exit(1); }
const url = m[1].trim();
const host = url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@').replace(/(@[^/]+).*/, '$1');
console.log(`# connecting (read-only) to ${host} ...`);

const db = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const [exams, questions, bundles, vendors] = await Promise.all([
    db.exam.count(), db.question.count(), db.bundle.count(), db.vendor.count()
  ]);
  console.log(`# PROD totals: exams=${exams} questions=${questions} bundles=${bundles} vendors=${vendors}\n`);

  // Actual question counts per exam (published vs draft)
  const grp = await db.question.groupBy({ by: ['examId', 'status'], _count: { _all: true } });
  const pubBy = new Map(), draftBy = new Map();
  for (const r of grp) {
    if (r.status === 'PUBLISHED') pubBy.set(r.examId, r._count._all);
    else if (r.status === 'DRAFT') draftBy.set(r.examId, (draftBy.get(r.examId) || 0) + r._count._all);
  }

  const all = await db.exam.findMany({
    include: { vendor: true, _count: { select: { attempts: true, orders: true } } },
    orderBy: [{ vendor: { name: 'asc' } }, { slug: 'asc' }]
  });

  let cur = '', thin = [], dupKeys = new Map();
  for (const e of all) {
    if (e.vendor.name !== cur) { console.log(`\n### ${e.vendor.name}`); cur = e.vendor.name; }
    const pub = pubBy.get(e.id) || 0, dr = draftBy.get(e.id) || 0;
    const flags = [];
    if (pub < 50) { flags.push('THIN'); thin.push(e.slug); }
    if (e.deletedAt) flags.push('ARCHIVED');
    if (!e.published) flags.push('inactive');
    // duplicate-family key: normalized title without trailing variant words
    const key = (e.title || '').toLowerCase().replace(/practice exam.*$/, '').replace(/[^a-z0-9]+/g, ' ').trim();
    (dupKeys.get(key) || dupKeys.set(key, []).get(key)).push(e.slug);
    console.log(
      `  ${e.slug.padEnd(42)} code=${(e.code || '').padEnd(20)} qc=${String(e.questionCount).padStart(3)} ` +
      `realPub=${String(pub).padStart(3)} draft=${String(dr).padStart(3)} ${e.level.padEnd(12)} ` +
      `att=${e._count.attempts} ord=${e._count.orders} ${flags.join(',')}`
    );
  }

  console.log(`\n## THIN exams (real published Q < 50): ${thin.length}`);
  console.log('  ' + (thin.join(', ') || 'none'));

  console.log(`\n## Possible DUPLICATE cert families (same normalized title, >1 slug-family):`);
  for (const [k, slugs] of dupKeys) {
    const fams = [...new Set(slugs.map((s) => s.replace(/-p\d+$/i, '')))];
    if (fams.length > 1) console.log(`  "${k}" -> ${fams.join('  |  ')}`);
  }

  // Bundle wiring for all bundles
  console.log(`\n## BUNDLE wiring (slug -> published | items)`);
  const bs = await db.bundle.findMany({
    include: { items: { include: { exam: { select: { slug: true, code: true } } } } },
    orderBy: { slug: 'asc' }
  });
  for (const b of bs) {
    const items = b.items.map((i) => `${i.tier[0]}:${i.exam.slug}`).join(' ');
    console.log(`  ${b.slug.padEnd(40)} pub=${b.published} [${items}]`);
  }
}
main()
  .catch((e) => { console.error('AUDIT ERROR:', e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
