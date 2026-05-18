/* Verify Wave 3b: 12 new certs, 65 Q x 3 variants, published, clean keys,
 * no dup stems, domains match the exam blueprint. */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const BASES = [
  'axelos-itil4-foundation',
  'tableau-desktop-specialist',
  'iassc-lean-six-sigma-green-belt',
  'comptia-pentest-plus',
  'comptia-securityx',
  'isc2-cc',
  'microsoft-sc-300',
  'microsoft-pl-900',
  'cisco-devnet-associate-200-901',
  'linuxfoundation-kcna',
  'hashicorp-vault-associate',
  'pmi-acp'
];

async function main() {
  const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  let problems = 0;
  for (const base of BASES) {
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
      console.log(`${slug.padEnd(42)} Q=${qs.length} pub=${e.published} ${flag ? 'PROBLEM ' + fl : 'OK'}`);
    }
  }
  console.log(problems === 0
    ? `\nALL 36 OK (12 certs x 65 Q x 3, published, clean keys, refs+expl, no dup, domains match)`
    : `\n${problems} PROBLEM(S)`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
