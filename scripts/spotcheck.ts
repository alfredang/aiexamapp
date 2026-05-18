/* Catalog + content spot-check across the whole DB. */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // 1. Catalog totals
  const totalExams = await db.exam.count();
  const pubExams = await db.exam.count({ where: { published: true } });
  const totalQ = await db.question.count();
  const pubQ = await db.question.count({ where: { status: 'PUBLISHED' } });
  const bundles = await db.bundle.count();
  console.log('=== CATALOG TOTALS ===');
  console.log(`exams: ${pubExams} published / ${totalExams} total`);
  console.log(`questions: ${pubQ} PUBLISHED / ${totalQ} total`);
  console.log(`bundles: ${bundles}`);

  // 2. Per-vendor published exam counts
  console.log('\n=== PER-VENDOR (published exams) ===');
  const vendors = await db.vendor.findMany({ orderBy: { name: 'asc' } });
  for (const v of vendors) {
    const ex = await db.exam.count({ where: { vendorId: v.id, published: true } });
    console.log(`${v.name.padEnd(20)} exams=${String(ex).padStart(3)}`);
  }

  // 3. Bundle wiring sanity for the 36 Wave-3 bundles (3 PRACTICE + 1 VOUCHER)
  const w3 = [
    'microsoft-az-305','microsoft-az-204','microsoft-sc-900','comptia-a-plus','comptia-network-plus','comptia-security-plus',
    'google-professional-cloud-architect','google-professional-data-engineer','isc2-ccsp','linuxfoundation-cks','pmi-capm','scrum-org-pspo-i',
    'axelos-itil4-foundation','tableau-desktop-specialist','iassc-lean-six-sigma-green-belt','comptia-pentest-plus','comptia-securityx','isc2-cc',
    'microsoft-sc-300','microsoft-pl-900','cisco-devnet-associate-200-901','linuxfoundation-kcna','hashicorp-vault-associate','pmi-acp',
    'microsoft-sc-100','microsoft-dp-600','microsoft-pl-600','google-professional-cloud-devops-engineer','google-professional-cloud-network-engineer','cisco-ccnp-security-350-701',
    'comptia-project-plus','oracle-java-se-17-1z0-829','isc2-sscp','pmi-rmp','linuxfoundation-kcsa','hashicorp-consul-associate'
  ];
  console.log('\n=== WAVE-3 BUNDLE WIRING (expect P=3 V=1) ===');
  let bad = 0;
  for (const slug of w3) {
    const b = await db.bundle.findUnique({ where: { slug }, include: { items: true } });
    if (!b) { console.log(`MISSING bundle ${slug}`); bad++; continue; }
    const p = b.items.filter((i) => i.tier === 'PRACTICE').length;
    const vc = b.items.filter((i) => i.tier === 'VOUCHER').length;
    const flag = p !== 3 || vc !== 1;
    if (flag) bad++;
    if (flag) console.log(`${slug.padEnd(46)} P=${p} V=${vc} price=${b.price} voucher=${b.priceVoucher} ${flag ? 'PROBLEM' : ''}`);
  }
  console.log(bad ? `${bad} bundle problem(s)` : 'all 36 Wave-3 bundles wired P=3 V=1 ✓');

  // 4. Content eyeball: 1 random question from 4 diverse new exams
  console.log('\n=== CONTENT SAMPLES ===');
  for (const slug of ['axelos-itil4-foundation-p1','oracle-java-se-17-1z0-829-p2','microsoft-sc-100-p1','hashicorp-consul-associate-p3']) {
    const e = await db.exam.findUnique({ where: { slug } });
    if (!e) { console.log(`(missing ${slug})`); continue; }
    const q = await db.question.findFirst({ where: { examId: e.id }, orderBy: { createdAt: 'asc' } });
    if (!q) { console.log(`(no questions ${slug})`); continue; }
    const opts = q.options as { id: string; text: string }[];
    const refs = q.references as { label: string; url: string }[];
    console.log(`\n--- ${slug}  [${q.domain}]  type=${q.type} diff=${q.difficulty} teaser=${q.isTeaser}`);
    console.log(`Q: ${q.stem}`);
    for (const o of opts) console.log(`   (${o.id}) ${o.text}`);
    console.log(`correct: ${JSON.stringify(q.correct)}`);
    console.log(`explanation: ${q.explanation.slice(0, 240)}${q.explanation.length > 240 ? '…' : ''}`);
    console.log(`refs: ${refs.map((r) => r.url).join(' | ')}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
