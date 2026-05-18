/* Verify Wave 2: 21 thin variants now 65 Q, clean, published. */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const SLUGS = [
  'docker-dca-p1','docker-dca-p2','docker-dca-p3',
  'elastic-certified-engineer-p1','elastic-certified-engineer-p2','elastic-certified-engineer-p3',
  'gitlab-certified-associate-p1','gitlab-certified-associate-p2','gitlab-certified-associate-p3',
  'hashicorp-terraform-associate-p1','hashicorp-terraform-associate-p2','hashicorp-terraform-associate-p3',
  'redhat-rhcsa-ex200-p1','redhat-rhcsa-ex200-p2','redhat-rhcsa-ex200-p3',
  'linuxfoundation-cka-p1','linuxfoundation-cka-p2','linuxfoundation-cka-p3',
  'linuxfoundation-ckad-p1','linuxfoundation-ckad-p2','linuxfoundation-ckad-p3'
];

async function main() {
  const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  let problems = 0;
  for (const slug of SLUGS) {
    const e = await db.exam.findUnique({ where: { slug } });
    if (!e) { console.log(`MISSING ${slug}`); problems++; continue; }
    const qs = await db.question.findMany({ where: { examId: e.id } });
    const stems = new Set<string>();
    let badCorrect = 0, dup = 0;
    for (const q of qs) {
      const opts = (q.options as { id: string }[] | null) ?? [];
      const ids = opts.map((o) => o.id);
      const cor = (q.correct as string[] | null) ?? [];
      if (!cor.length || !cor.every((c) => ids.includes(c))) badCorrect++;
      const k = norm(q.stem);
      if (stems.has(k)) dup++; else stems.add(k);
    }
    const flag = qs.length !== 65 || badCorrect || dup || !e.published;
    if (flag) problems++;
    console.log(`${slug.padEnd(34)} Q=${qs.length} pub=${e.published} badCorrect=${badCorrect} dup=${dup} ${flag ? 'PROBLEM' : 'OK'}`);
  }
  console.log(problems === 0 ? '\nALL 21 OK (65 Q, published, no bad keys, no dup stems)' : `\n${problems} PROBLEM(S)`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
