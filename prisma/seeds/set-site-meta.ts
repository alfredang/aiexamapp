import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const KV: Record<string, string> = {
  SITE_HOME_TITLE: 'Tertiary Exams — Practice Smarter for Your Next Certification',
  SITE_HOME_DESCRIPTION:
    'Original, blueprint-aligned practice questions for AWS, Microsoft, Cisco, CompTIA, Google Cloud, Kubernetes, Anthropic and more. By Tertiary Infotech Academy.',
  SITE_HOME_KEYWORDS:
    'IT certification practice exams, AWS practice exam, Azure practice exam, CompTIA practice exam, Cisco practice exam, Google Cloud practice exam, Kubernetes practice exam, CKAD, CKA, SAA-C03, AZ-900, exam voucher, Tertiary Infotech Academy, Tertiary Exams'
};
(async () => {
  for (const [key, value] of Object.entries(KV)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    console.log('set', key);
  }
  await db.$disconnect();
})();
