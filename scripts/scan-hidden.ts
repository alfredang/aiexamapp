/* One-off: integrity + publish-readiness scan of all hidden exams. */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const isVariant = (s: string) => /-(p\d+|practice-?\d*)$/i.test(s);

async function main() {
  const exs = await db.exam.findMany({
    include: { vendor: true },
    where: { published: false },
    orderBy: [{ vendor: { name: 'asc' } }, { slug: 'asc' }]
  });

  const byV: Record<string, string[]> = {};

  for (const e of exs) {
    const base = !isVariant(e.slug);
    const qs = await db.question.findMany({ where: { examId: e.id } });

    let badOpt = 0, badCorrect = 0, noRef = 0, noExpl = 0, dup = 0;
    const stems = new Set<string>();
    const dom: Record<string, number> = {};

    for (const q of qs) {
      const opts = (q.options as { id: string }[] | null) ?? [];
      const ids = Array.isArray(opts) ? opts.map((o) => o.id) : [];
      if (!Array.isArray(opts) || opts.length < 2) badOpt++;
      const cor = (q.correct as string[] | null) ?? [];
      if (!Array.isArray(cor) || cor.length < 1 || !cor.every((c) => ids.includes(c))) badCorrect++;
      const refs = (q.references as unknown[] | null) ?? [];
      if (!Array.isArray(refs) || refs.length < 1) noRef++;
      if (!q.explanation || q.explanation.length < 20) noExpl++;
      // True-duplicate signature: full normalized stem + sorted option texts.
      // (A shared case-study preamble is NOT a duplicate if the actual
      // question/options differ — only flag identical stem AND options.)
      const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const optSig = Array.isArray(opts)
        ? opts.map((o) => norm((o as { text?: string }).text || '')).sort().join('|')
        : '';
      const k = norm(q.stem || '') + '##' + optSig;
      if (stems.has(k)) dup++; else stems.add(k);
      dom[q.domain] = (dom[q.domain] || 0) + 1;
    }

    const examDomains = ((e.domains as { name: string }[] | null) ?? []).map((d) => d.name);
    const domMismatch = examDomains.length ? Object.keys(dom).some((d) => !examDomains.includes(d)) : true;

    const flags: string[] = [];
    if (badOpt) flags.push(`badOpt=${badOpt}`);
    if (badCorrect) flags.push(`badCorrect=${badCorrect}`);
    if (noRef) flags.push(`noRef=${noRef}`);
    if (noExpl) flags.push(`noExpl=${noExpl}`);
    if (dup) flags.push(`dupStem=${dup}`);
    if (domMismatch) flags.push('domainMismatch');

    const rec = base
      ? 'KEEP-HIDDEN (base shell)'
      : qs.length < 40
        ? 'TOO-THIN'
        : flags.length
          ? 'NEEDS-FIX'
          : 'PUBLISH-READY';

    (byV[e.vendor.name] ||= []).push(
      `  ${e.slug.padEnd(36)} Q=${String(qs.length).padStart(4)}  ${rec.padEnd(24)}  ${flags.join(',') || 'clean'}`
    );
  }

  const out: string[] = [];
  let pubReady = 0, needsFix = 0, thin = 0, keep = 0;
  for (const v of Object.keys(byV)) {
    out.push('', `### ${v}`, ...byV[v]);
    for (const l of byV[v]) {
      if (l.includes('PUBLISH-READY')) pubReady++;
      else if (l.includes('NEEDS-FIX')) needsFix++;
      else if (l.includes('TOO-THIN')) thin++;
      else if (l.includes('KEEP-HIDDEN')) keep++;
    }
  }
  out.push('', `SUMMARY: PUBLISH-READY=${pubReady}  NEEDS-FIX=${needsFix}  TOO-THIN=${thin}  KEEP-HIDDEN=${keep}  (total hidden exams=${exs.length})`);
  console.log(out.join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
