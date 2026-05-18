/* Verify Wave 3c: pass BASE slugs as argv (one or more). Each must have
 * p1/p2/p3 = 65 Q, published, clean keys, refs+expl, no dup stems, domains
 * match the exam blueprint. */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const bases = process.argv.slice(2);
  if (!bases.length) throw new Error('usage: verify-wave3c.ts <base-slug...>');
  const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  let problems = 0;
  for (const base of bases) {
    for (const i of [1, 2, 3]) {
      const slug = `${base}-p${i}`;
      const e = await db.exam.findUnique({ where: { slug } });
      if (!e) { console.log(`MISSING ${slug}`); problems++; continue; }
      const qs = await db.question.findMany({ where: { examId: e.id } });
      const stems = new Set<string>();
      let badCorrect = 0, dup = 0, noRef = 0, noExpl = 0;
      const dom: Record<string, number> = {};
      for (const q of qs) {
        const opts = (q.options as { id: string }[] | null) ?? [];
        const ids = opts.map((o) => o.id);
        const cor = (q.correct as string[] | null) ?? [];
        if (!cor.length || !cor.every((c) => ids.includes(c))) badCorrect++;
        const refs = (q.references as unknown[] | null) ?? [];
        if (!Array.isArray(refs) || refs.length < 1) noRef++;
        if (!q.explanation || q.explanation.length < 20) noExpl++;
        const k = norm(q.stem);
        if (stems.has(k)) dup++; else stems.add(k);
        dom[q.domain] = (dom[q.domain] || 0) + 1;
      }
      const examDomains = ((e.domains as { name: string }[] | null) ?? []).map((d) => d.name);
      const domMismatch = examDomains.length
        ? Object.keys(dom).some((d) => !examDomains.includes(d))
        : true;
      const flag = qs.length !== 65 || badCorrect || dup || noRef || noExpl || domMismatch || !e.published;
      if (flag) problems++;
      const fl = [
        qs.length !== 65 && `Q=${qs.length}`,
        !e.published && 'UNPUB',
        badCorrect && `badCorrect=${badCorrect}`,
        dup && `dup=${dup}`,
        noRef && `noRef=${noRef}`,
        noExpl && `noExpl=${noExpl}`,
        domMismatch && 'domMismatch'
      ].filter(Boolean).join(',');
      console.log(`${slug.padEnd(48)} Q=${qs.length} pub=${e.published} ${flag ? 'PROBLEM ' + fl : 'OK'}`);
    }
  }
  console.log(problems === 0
    ? `\nALL ${bases.length * 3} OK (${bases.length} certs x 65 Q x 3, published, clean keys, refs+expl, no dup, domains match)`
    : `\n${problems} PROBLEM(S)`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
