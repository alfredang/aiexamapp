/* Retire pre-existing duplicate cert products superseded by Wave 3b.
 * "Keep new, retire old": unpublish the older Tableau Desktop Specialist
 * (tableau-tds, 6 variants) + its bundle, and the thin IASSC CLSSGB stub.
 * Non-destructive: sets published=false only (rows + questions preserved). */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const examSlugs = [
    'tableau-tds-p1', 'tableau-tds-p2', 'tableau-tds-p3',
    'tableau-tds-p4', 'tableau-tds-p5', 'tableau-tds-p6',
    'iassc-clssgb-p1'
  ];
  const bundleSlugs = ['tableau-tds'];

  const ex = await db.exam.updateMany({
    where: { slug: { in: examSlugs } }, data: { published: false }
  });
  const bn = await db.bundle.updateMany({
    where: { slug: { in: bundleSlugs } }, data: { published: false }
  });

  // Sanity: confirm the kept new products are still live.
  const keepEx = await db.exam.count({
    where: { published: true, slug: { startsWith: 'tableau-desktop-specialist-' } }
  });
  const keepIa = await db.exam.count({
    where: { published: true, slug: { startsWith: 'iassc-lean-six-sigma-green-belt-' } }
  });

  console.log(`unpublished exams=${ex.count} (expected 7), bundles=${bn.count} (expected 1)`);
  console.log(`kept live: tableau-desktop-specialist variants=${keepEx} (expect 3), iassc-lean-six-sigma-green-belt variants=${keepIa} (expect 3)`);
  const stillOld = await db.exam.count({ where: { published: true, slug: { startsWith: 'tableau-tds-' } } });
  console.log(stillOld === 0 ? 'OK — no old tableau-tds variants still published' : `PROBLEM — ${stillOld} old tableau-tds still published`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
