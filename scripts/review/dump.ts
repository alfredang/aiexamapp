/* Dump all questions for the given exam slugs to a JSON file for review.
 * Usage: npx tsx scripts/review/dump.ts <outName> <slug1> <slug2> ... */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();

async function main() {
  const [outName, ...slugs] = process.argv.slice(2);
  if (!outName || slugs.length === 0) {
    throw new Error('usage: dump.ts <outName> <slug...>');
  }
  const exams = await db.exam.findMany({
    where: { slug: { in: slugs } },
    include: { questions: true }
  });
  const payload = exams.map((e) => ({
    examSlug: e.slug,
    examTitle: e.title,
    domains: e.domains,
    questions: e.questions.map((q) => ({
      id: q.id,
      domain: q.domain,
      difficulty: q.difficulty,
      type: q.type,
      stem: q.stem,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
      references: q.references
    }))
  }));
  const dir = path.join('backups', 'review');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `${outName}-questions.json`);
  fs.writeFileSync(f, JSON.stringify(payload, null, 2));
  const total = payload.reduce((s, e) => s + e.questions.length, 0);
  console.log(`wrote ${f} | exams=${payload.length} questions=${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
