import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
try {
  const exam = await db.exam.findUnique({ where: { slug: 'anthropic-cca-foundations' } });
  if (!exam) { console.log('No exam'); process.exit(1); }

  // Breakdown by generatedBy tag
  const byTag = await db.question.groupBy({
    by: ['generatedBy'],
    where: { examId: exam.id },
    _count: true
  });
  console.log('Question counts by generatedBy tag:');
  for (const row of byTag) {
    console.log(`  ${row.generatedBy ?? '(null)'}: ${row._count}`);
  }

  // Teaser by tag
  const teasersByTag = await db.question.groupBy({
    by: ['generatedBy'],
    where: { examId: exam.id, isTeaser: true },
    _count: true
  });
  console.log('Teaser counts by generatedBy tag:');
  for (const row of teasersByTag) {
    console.log(`  ${row.generatedBy ?? '(null)'}: ${row._count}`);
  }

  // A sample of any non-matching ones so we can see where they came from
  const others = await db.question.findMany({
    where: { examId: exam.id, NOT: { generatedBy: 'manual:cca-foundations-seed' } },
    take: 5,
    select: { id: true, generatedBy: true, stem: true, createdAt: true }
  });
  if (others.length) {
    console.log('\nSample of NON-cca-seed questions on this exam (showing 5):');
    for (const q of others) {
      console.log(`  [${q.generatedBy ?? 'null'}] ${q.createdAt.toISOString()}`);
      console.log(`     ${q.stem.slice(0, 100)}...`);
    }
  }
} finally {
  await db.$disconnect();
}
