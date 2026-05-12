import { getSetting } from '@/lib/settings';

export type ExtractResult = {
  text: string;
  meta: Record<string, any>;
};

/**
 * Extract plain text from a PDF buffer using pdf-parse. Returns the full
 * concatenated text plus the `numpages` count so chunking downstream can
 * make page-aware decisions if needed.
 */
export async function extractFromPdf(buf: Buffer): Promise<ExtractResult> {
  // Lazy-import so the cost is paid only when used.
  const mod: any = await import('pdf-parse');
  const pdfParse = mod.default ?? mod.PdfReader ?? mod;
  const data = await pdfParse(buf);
  return { text: data.text ?? '', meta: { numpages: data.numpages ?? 0, info: data.info } };
}

/**
 * Scrape one or more URLs to markdown via the Firecrawl API. We use the
 * /v1/scrape endpoint which returns clean markdown. Concatenates the
 * outputs in the order supplied.
 */
export async function extractFromUrls(urls: string[]): Promise<ExtractResult> {
  const apiKey = await getSetting('FIRECRAWL_API_KEY');
  if (!apiKey) throw new Error('Firecrawl API key not configured. Settings → Credentials → Firecrawl.');

  const pieces: string[] = [];
  const meta: Record<string, any> = { urls: [] };
  for (const raw of urls) {
    const url = raw.trim();
    if (!url) continue;
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, formats: ['markdown'] })
    });
    const json = (await res.json()) as { success: boolean; data?: { markdown?: string; metadata?: any }; error?: string };
    if (!res.ok || !json.success || !json.data?.markdown) {
      throw new Error(`Firecrawl failed for ${url}: ${json.error ?? res.status}`);
    }
    pieces.push(`# Source: ${url}\n\n${json.data.markdown}\n`);
    meta.urls.push({ url, title: json.data.metadata?.title ?? null });
  }
  return { text: pieces.join('\n---\n\n'), meta };
}
