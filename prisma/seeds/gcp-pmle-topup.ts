/* Local runner for the grounded PMLE P1–P3 top-up.
 *   npx tsx prisma/seeds/gcp-pmle-topup.ts
 */
import { PrismaClient } from '@prisma/client';
import { topupGcpPmle } from '../../src/lib/seed/gcp-pmle-topup';

const db = new PrismaClient();
topupGcpPmle(db)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
