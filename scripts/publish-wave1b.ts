/* Wave 1b: publish the 34 remediated NEEDS-FIX exams (set published=true). */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const SLUGS = [
  'comptia-data-plus-p1','comptia-data-plus-p2','comptia-data-plus-p3','comptia-data-plus-p4','comptia-data-plus-p5',
  'microsoft-ai-102-p1','microsoft-ai-102-p2','microsoft-ai-102-p3','microsoft-ai-102-p4','microsoft-ai-102-p5','microsoft-ai-102-practice',
  'microsoft-ai-900-p1','microsoft-ai-900-p2','microsoft-ai-900-p4',
  'microsoft-az-104-p1','microsoft-az-104-p4',
  'microsoft-dp-100-p1','microsoft-dp-100-p2',
  'microsoft-dp-203-p1',
  'microsoft-dp-300-p1','microsoft-dp-300-p2','microsoft-dp-300-p3','microsoft-dp-300-p4',
  'microsoft-md-102-p1',
  'microsoft-ms-102-p1','microsoft-ms-102-p2','microsoft-ms-102-p3','microsoft-ms-102-p4',
  'microsoft-pl-300-p3','microsoft-pl-300-p5',
  'microsoft-sc-200-p1','microsoft-sc-200-p3',
  'pmi-pmp-p3','pmi-pmp-p6'
];

async function main() {
  const r = await db.exam.updateMany({ where: { slug: { in: SLUGS } }, data: { published: true } });
  const live = await db.exam.count({ where: { slug: { in: SLUGS }, published: true } });
  console.log(`updated=${r.count} | now published (of ${SLUGS.length})=${live}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
