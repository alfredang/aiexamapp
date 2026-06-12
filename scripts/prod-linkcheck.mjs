/* READ-ONLY public link checker.
 * Pulls every <loc> from the live sitemap.xml and GETs each URL,
 * reporting any status that isn't 200. Runs with limited concurrency.
 *
 * Run:  node scripts/prod-linkcheck.mjs
 */
import fs from 'fs';

const BASE = process.env.PROD_BASE || 'https://ai-exams.tertiaryinfo.tech';
const CONCURRENCY = 12;

async function getUrls() {
  const r = await fetch(`${BASE}/sitemap.xml`);
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

async function check(url) {
  try {
    const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'linkcheck/1.0' } });
    return { url, status: r.status, loc: r.headers.get('location') || '' };
  } catch (e) {
    return { url, status: 0, loc: `ERR ${e.message}` };
  }
}

async function main() {
  const urls = await getUrls();
  console.log(`# checking ${urls.length} sitemap URLs on ${BASE}\n`);
  const results = [];
  let i = 0;
  async function worker() {
    while (i < urls.length) {
      const idx = i++;
      results[idx] = await check(urls[idx]);
      process.stdout.write('.');
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log('\n');

  const bad = results.filter(r => r.status !== 200);
  const byCode = {};
  for (const r of results) byCode[r.status] = (byCode[r.status] || 0) + 1;
  console.log('===== STATUS BREAKDOWN =====');
  for (const [code, n] of Object.entries(byCode).sort()) console.log(`  ${code}: ${n}`);

  console.log('\n===== NON-200 =====');
  console.log(bad.length ? bad.map(r => `  ${r.status}  ${r.url}${r.loc ? '  -> ' + r.loc : ''}`).join('\n') : '  (none — all 200)');

  fs.writeFileSync('scripts/_linkcheck.json', JSON.stringify(results, null, 2));
}
main().catch(e => { console.error('LINKCHECK ERROR:', e.message); process.exit(1); });
