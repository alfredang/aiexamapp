/* Apply reviewed fixes to questions and append a changelog.
 * Reads backups/review/<name>-fixes.json:
 *   [{ id, reason, correct?, explanation?, options?, domain?, difficulty?, references? }]
 * Only the provided fields are updated. Never deletes/creates questions.
 * Usage: npx tsx scripts/review/apply.ts <name> */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();

type Fix = {
  id: string;
  reason: string;
  stem?: string;
  type?: 'SINGLE' | 'MULTI' | 'TRUE_FALSE';
  correct?: string[];
  explanation?: string;
  options?: { id: string; text: string }[];
  domain?: string;
  difficulty?: number;
  references?: { label: string; url: string }[];
};

async function main() {
  const name = process.argv[2];
  if (!name) throw new Error('usage: apply.ts <name>');
  const fixesPath = path.join('backups', 'review', `${name}-fixes.json`);
  const fixes: Fix[] = JSON.parse(fs.readFileSync(fixesPath, 'utf8'));

  const logLines: string[] = [`# Review changelog: ${name}`, `Applied: ${new Date().toISOString()}`, `Total fixes: ${fixes.length}`, ''];
  let applied = 0;

  for (const fx of fixes) {
    const before = await db.question.findUnique({ where: { id: fx.id } });
    if (!before) { logLines.push(`- SKIP ${fx.id} (not found)`); continue; }
    const data: Record<string, unknown> = {};
    if (fx.stem) data.stem = fx.stem;
    if (fx.type) data.type = fx.type;
    if (fx.correct) data.correct = fx.correct;
    if (fx.explanation) data.explanation = fx.explanation;
    if (fx.options) data.options = fx.options;
    if (fx.domain) data.domain = fx.domain;
    if (typeof fx.difficulty === 'number') data.difficulty = fx.difficulty;
    if (fx.references) data.references = fx.references;
    if (Object.keys(data).length === 0) { logLines.push(`- NOOP ${fx.id}`); continue; }
    await db.question.update({ where: { id: fx.id }, data });
    applied++;
    logLines.push(`- FIX ${fx.id} [${Object.keys(data).join(',')}] — ${fx.reason}`);
    if (fx.correct) logLines.push(`    correct: ${JSON.stringify(before.correct)} -> ${JSON.stringify(fx.correct)}`);
  }

  const logPath = path.join('backups', 'review', `${name}-changelog.md`);
  fs.writeFileSync(logPath, logLines.join('\n'));
  console.log(`applied ${applied}/${fixes.length} fixes | log: ${logPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
