/* Local runner for the consolidated 2026-05-29 known-issues fix.
 *   npx tsx prisma/seeds/fix-known-issues.ts
 */
import { PrismaClient } from '@prisma/client';
import { fixKnownIssues } from '../../src/lib/seed/fix-known-issues';

const db = new PrismaClient();
fixKnownIssues(db)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
