/* Local runner for the archived-but-published state-hygiene fix.
 *   npx tsx prisma/seeds/fix-archived-published.ts
 */
import { PrismaClient } from '@prisma/client';
import { fixArchivedPublished } from '../../src/lib/seed/fix-archived-published';

const db = new PrismaClient();
fixArchivedPublished(db)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
