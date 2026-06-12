import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
try {
  const b = await db.bundle.findUnique({
    where: { slug: 'anthropic-cca-foundations' },
    include: { items: { include: { exam: { select: { slug: true, title: true, code: true } } } } }
  });
  if (!b) { console.log('Bundle NOT found locally'); process.exit(1); }
  console.log('Bundle in local DB:');
  console.log('  slug:        ', b.slug);
  console.log('  title:       ', b.title);
  console.log('  price (cents):', b.price);
  console.log('  priceVoucher:', b.priceVoucher);
  console.log('  published:   ', b.published);
  console.log('  items:');
  for (const it of b.items) {
    console.log('    - exam:', it.exam.code, '|', it.exam.slug, '| tier:', it.tier, '| position:', it.position);
  }
  const qCount = await db.question.count({ where: { exam: { slug: 'anthropic-cca-foundations' } } });
  const teaser = await db.question.count({ where: { exam: { slug: 'anthropic-cca-foundations' }, isTeaser: true } });
  console.log('  exam questions:', qCount, '(teaser:', teaser + ')');
} finally {
  await db.$disconnect();
}
