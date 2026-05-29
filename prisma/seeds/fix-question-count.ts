/* Local runner for the questionCount field-sync hygiene fix.
 *   npx tsx prisma/seeds/fix-question-count.ts
 */
import { PrismaClient } from '@prisma/client';
import { fixQuestionCount } from '../../src/lib/seed/fix-question-count';

const db = new PrismaClient();
fixQuestionCount(db)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
