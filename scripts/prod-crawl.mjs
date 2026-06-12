/* READ-ONLY one-level internal link crawl.
 * Loads hub pages (home, catalog, every vendor page, plus all sitemap URLs)
 * extracts internal href="/..." links from the HTML, dedupes, and GETs each,
 * reporting any non-200. Catches nav/footer/cross-links not in the sitemap.
 *
 * Run:  node scripts/prod-crawl.mjs
 */
import fs from 'fs';

const BASE = process.env.PROD_BASE || 'https://ai-exams.tertiaryinfo.tech';
const CONCURRENCY = 12;

function sitemapUrls() {
  const xml = fs.readFileSync('scripts/_sitemap.xml', 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

async function fetchHtml(url) {
  try { const r = await fetch(url); return await r.text(); } catch { return ''; }
}

function extractInternal(html) {
  const out = new Set();
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    let p = m[1];
    if (p.startsWith('/_next') || p.startsWith('/api') || /\.(png|jpg|svg|ico|webp|css|js|xml|txt)$/.test(p)) continue;
    out.add(p.replace(/\/$/, '') || '/');
  }
  return out;
}

async function status(url) {
  try { const r = await fetch(url, { redirect: 'manual' }); return r.status; }
  catch (e) { return `ERR ${e.message}`; }
}

async function mapPool(items, fn) {
  const res = []; let i = 0;
  async function w() { while (i < items.length) { const k = i++; res[k] = await fn(items[k]); process.stdout.write('.'); } }
  await Promise.all(Array.from({ length: CONCURRENCY }, w));
  return res;
}

async function main() {
  // Hub pages to scrape links from
  const hubs = [`${BASE}/`, `${BASE}/practice-exams`, ...sitemapUrls()];
  console.log(`# scraping links from ${hubs.length} hub pages...`);
  const htmls = await mapPool(hubs, fetchHtml);
  console.log('');

  const links = new Set();
  for (const h of htmls) for (const l of extractInternal(h)) links.add(BASE + l);
  const urls = [...links].sort();
  console.log(`\n# found ${urls.length} unique internal links; checking status...`);
  const codes = await mapPool(urls, status);
  console.log('');

  const results = urls.map((u, i) => ({ url: u, status: codes[i] }));
  const byCode = {};
  for (const r of results) byCode[r.status] = (byCode[r.status] || 0) + 1;
  console.log('\n===== STATUS BREAKDOWN =====');
  for (const [c, n] of Object.entries(byCode).sort()) console.log(`  ${c}: ${n}`);

  const bad = results.filter(r => r.status !== 200 && r.status !== 307 && r.status !== 308);
  console.log('\n===== NON-200 (excluding auth redirects 307/308) =====');
  console.log(bad.length ? bad.map(r => `  ${r.status}  ${r.url}`).join('\n') : '  (none)');

  // show the redirects too, for transparency
  const reds = results.filter(r => r.status === 307 || r.status === 308);
  if (reds.length) {
    console.log('\n===== REDIRECTS (likely auth-gated, expected) =====');
    console.log(reds.map(r => `  ${r.status}  ${r.url}`).join('\n'));
  }

  fs.writeFileSync('scripts/_crawl.json', JSON.stringify(results, null, 2));
}
main().catch(e => { console.error('CRAWL ERROR:', e.message); process.exit(1); });
