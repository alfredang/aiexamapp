/* Local runner for the PL-300 re-grounding fix.
 *   npx tsx prisma/seeds/pl300-regrounding.ts
 */
import { PrismaClient } from '@prisma/client';
import { regroundPl300 } from '../../src/lib/seed/pl300-regrounding';

const db = new PrismaClient();
regroundPl300(db)
  .then((r) => {
    console.log('PL-300 re-grounding complete:');
    console.log(`  trimmed:  ${r.trimmed}`);
    console.log(`  removed:  ${r.removed}`);
    console.log(`  inserted: ${r.inserted}`);
    console.log('  per exam (total / teasers):');
    for (const [slug, s] of Object.entries(r.perExam)) console.log(`    ${slug}: ${s.total} / ${s.teasers}`);
  })
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
