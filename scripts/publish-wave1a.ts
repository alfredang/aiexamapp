/* Wave 1a: publish the 67 reviewed PUBLISH-READY exams (set published=true). */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const SLUGS = [
  'comptia-cloud-plus-practice-1','comptia-cloud-plus-practice-5','comptia-cloud-plus-practice-6','comptia-cloud-plus-practice-7','comptia-cloud-plus-practice-8','comptia-server-plus-p1','comptia-server-plus-p2','comptia-server-plus-p3','comptia-server-plus-p4','comptia-data-plus-p6',
  'github-foundations-p1','github-foundations-p2','github-foundations-p3','github-foundations-p4',
  'google-ace-p1','google-ace-p2','google-professional-ml-engineer-p1','google-professional-ml-engineer-p2','google-professional-ml-engineer-p3','google-professional-ml-engineer-p4','google-professional-ml-engineer-p5','google-professional-ml-engineer-p6',
  'iassc-clssgb-p1',
  'isc2-cissp-p1','isc2-cissp-p2','isc2-cissp-p3','isc2-cissp-p4','isc2-cissp-p5','isc2-cissp-p6',
  'microsoft-ai-900-p3','microsoft-ai-900-p5','microsoft-ai-900-p6','microsoft-az-104-p3','microsoft-az-500-p1','microsoft-dp-203-practice-6','microsoft-dp-900-p1','microsoft-dp-900-p2','microsoft-dp-900-p3','microsoft-dp-900-p4','microsoft-md-102-p2','microsoft-md-102-p3','microsoft-md-102-p4','microsoft-pl-300-p1','microsoft-pl-300-p2','microsoft-pl-300-p4','microsoft-sc-200-p2','microsoft-sc-200-p4','microsoft-sc-200-p5',
  'pmi-pmp-p1','pmi-pmp-p2','pmi-pmp-p4','pmi-pmp-p5',
  'scrum-org-psm-i-p1','scrum-org-psm-i-p5','scrum-org-psm-i-p6',
  'tableau-foundations-p1','tableau-foundations-p2','tableau-foundations-p3','tableau-foundations-p4','tableau-foundations-p5','tableau-foundations-p6','tableau-tds-p1','tableau-tds-p2','tableau-tds-p3','tableau-tds-p4','tableau-tds-p5','tableau-tds-p6'
];

async function main() {
  const r = await db.exam.updateMany({ where: { slug: { in: SLUGS } }, data: { published: true } });
  const live = await db.exam.count({ where: { slug: { in: SLUGS }, published: true } });
  console.log(`updated=${r.count} | now published (of ${SLUGS.length})=${live}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
