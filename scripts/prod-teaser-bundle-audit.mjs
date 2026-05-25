/* READ-ONLY prod audit answering two questions:
 *
 *   Q1. Which published exams have ZERO teaser questions?
 *       (clicking "Start free practice exam" on such a bundle
 *        returns 404 from the teaser route — that's where the
 *        prior "teaser=unavailable" notice fires)
 *
 *   Q2. Which published bundles are EMPTY?
 *       (zero BundleItem rows — checkout would fulfil nothing)
 *
 * Reads prod DATABASE_URL from .env.prod (gitignored). No writes.
 *
 * Run: node scripts/prod-teaser-bundle-audit.mjs
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const envTxt = fs.existsSync('.env.prod') ? fs.readFileSync('.env.prod', 'utf8') : '';
const m = envTxt.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)/m);
if (!m) {
  console.error('No DATABASE_URL in .env.prod — create it first (gitignored).');
  process.exit(1);
}
const url = m[1].trim();
const safeHost = url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@').replace(/(@[^/]+).*/, '$1');
console.log(`# connecting (read-only) to ${safeHost}\n`);

const db = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  // ── Q1: teaser coverage per exam ──────────────────────────────────
  const exams = await db.exam.findMany({
    where: { deletedAt: null },
    include: { vendor: { select: { slug: true, name: true } } },
    orderBy: [{ vendor: { slug: 'asc' } }, { slug: 'asc' }]
  });

  // One groupBy pass: published teaser questions per exam.
  const teaserGroups = await db.question.groupBy({
    by: ['examId'],
    where: { isTeaser: true, status: 'PUBLISHED' },
    _count: { _all: true }
  });
  const teaserBy = new Map(teaserGroups.map((g) => [g.examId, g._count._all]));

  // And total published questions (for context — a fully-empty exam is
  // a different problem from a populated exam with no teaser flag).
  const pubGroups = await db.question.groupBy({
    by: ['examId'],
    where: { status: 'PUBLISHED' },
    _count: { _all: true }
  });
  const pubBy = new Map(pubGroups.map((g) => [g.examId, g._count._all]));

  const noTeaser = [];
  const lowTeaser = []; // 1–9 — borderline; default teaser size is 20
  for (const e of exams) {
    if (!e.published) continue; // skip drafts — they're not user-visible
    const t = teaserBy.get(e.id) || 0;
    const p = pubBy.get(e.id) || 0;
    if (t === 0) noTeaser.push({ vendor: e.vendor.slug, slug: e.slug, code: e.code, pub: p });
    else if (t < 10) lowTeaser.push({ vendor: e.vendor.slug, slug: e.slug, code: e.code, teaser: t, pub: p });
  }

  console.log('## Q1. Published exams with ZERO teaser questions');
  console.log(`   (clicking the teaser CTA on these bounces to ?teaser=unavailable)\n`);
  if (noTeaser.length === 0) {
    console.log('   ✅ none — every published exam has at least one teaser question.\n');
  } else {
    console.log(`   ❌ ${noTeaser.length} exam(s) missing teaser:\n`);
    let cur = '';
    for (const x of noTeaser) {
      if (x.vendor !== cur) { console.log(`   ### ${x.vendor}`); cur = x.vendor; }
      console.log(`     ${x.slug.padEnd(42)} code=${(x.code || '').padEnd(18)} pubQ=${x.pub}`);
    }
    console.log('');
  }

  console.log('## Q1b. Exams with FEW teaser questions (1–9)');
  console.log('   (default teaser size is 20; fewer means the launcher reshuffles a small pool)\n');
  if (lowTeaser.length === 0) {
    console.log('   ✅ none — every populated exam has ≥10 teaser questions.\n');
  } else {
    let cur = '';
    for (const x of lowTeaser) {
      if (x.vendor !== cur) { console.log(`   ### ${x.vendor}`); cur = x.vendor; }
      console.log(`     ${x.slug.padEnd(42)} teaser=${String(x.teaser).padStart(2)}/20 pubQ=${x.pub}`);
    }
    console.log('');
  }

  // ── Q2: empty bundles ─────────────────────────────────────────────
  const bundles = await db.bundle.findMany({
    where: { deletedAt: null },
    include: {
      vendor: { select: { slug: true, name: true } },
      _count: { select: { items: true } },
      items: {
        include: { exam: { select: { slug: true, published: true, deletedAt: true } } }
      }
    },
    orderBy: [{ vendor: { slug: 'asc' } }, { slug: 'asc' }]
  });

  const empty = [];     // zero BundleItem rows
  const allUnpub = [];  // has items, but every linked exam is unpublished/archived
  for (const b of bundles) {
    if (b._count.items === 0) {
      empty.push({ vendor: b.vendor.slug, slug: b.slug, pub: b.published });
      continue;
    }
    const live = b.items.filter((i) => i.exam.published && !i.exam.deletedAt);
    if (live.length === 0) {
      allUnpub.push({
        vendor: b.vendor.slug,
        slug: b.slug,
        pub: b.published,
        items: b.items.map((i) => i.exam.slug)
      });
    }
  }

  console.log('## Q2. Empty bundles (zero BundleItem rows)\n');
  if (empty.length === 0) {
    console.log('   ✅ none — every bundle has at least one item wired.\n');
  } else {
    console.log(`   ❌ ${empty.length} empty bundle(s):\n`);
    let cur = '';
    for (const x of empty) {
      if (x.vendor !== cur) { console.log(`   ### ${x.vendor}`); cur = x.vendor; }
      console.log(`     ${x.slug.padEnd(42)} published=${x.pub}`);
    }
    console.log('');
  }

  console.log('## Q2b. Bundles whose every item points at an unpublished/archived exam\n');
  if (allUnpub.length === 0) {
    console.log('   ✅ none — every bundle links to at least one live exam.\n');
  } else {
    console.log(`   ⚠️ ${allUnpub.length} bundle(s) wired but invisible:\n`);
    let cur = '';
    for (const x of allUnpub) {
      if (x.vendor !== cur) { console.log(`   ### ${x.vendor}`); cur = x.vendor; }
      console.log(`     ${x.slug.padEnd(42)} pub=${x.pub} -> [${x.items.join(', ')}]`);
    }
    console.log('');
  }

  console.log(`# scanned: ${exams.length} exams, ${bundles.length} bundles`);
}

main()
  .catch((e) => { console.error('AUDIT ERROR:', e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
