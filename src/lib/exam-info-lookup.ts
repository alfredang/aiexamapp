import { query } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { getSetting } from '@/lib/settings';

const ResultSchema = z.object({
  infoUrl: z.string().url(),
  examSets: z.number().int().min(1).max(6),
  notes: z.string().optional()
});
export type ExamInfoLookup = z.infer<typeof ResultSchema>;

const SYSTEM = `You research IT certification exams on the open web.
Your job: given a vendor name, exam title, and exam code, find the OFFICIAL vendor page
that describes the certification (overview, blueprint, or exam guide PDF).

Use the WebSearch tool to find candidate URLs, then prefer the canonical vendor
domain (aws.amazon.com, learn.microsoft.com, cloud.google.com, comptia.org,
isc2.org, cisco.com, etc.) over third-party sites.

Also estimate how many distinct full-length practice exam variants are typically
offered by the vendor for this certification on its official site or its first-party
training platform. Constrain to an integer between 1 and 6. If unknown, use 1.

When you're done, output ONLY a single JSON object (no prose, no fences) of shape:
{ "infoUrl": "<full https URL>", "examSets": <1-6>, "notes": "<one short sentence>" }`;

function extractJsonObject(text: string): unknown | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function lookupExamInfo(input: {
  vendor: string;
  title: string;
  code: string;
}): Promise<ExamInfoLookup> {
  const storedKey = await getSetting('ANTHROPIC_API_KEY');
  if (storedKey && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = storedKey;
  }

  const prompt = `Vendor: ${input.vendor}
Certification title: ${input.title}
Exam code: ${input.code}

Search the web and return the official vendor URL plus the typical number of
full-length practice exam variants offered for this certification.`;

  const result = query({
    prompt,
    options: {
      systemPrompt: SYSTEM,
      model: 'claude-sonnet-4-6',
      allowedTools: ['WebSearch', 'WebFetch'],
      maxTurns: 6
    } as any
  });

  let assistantText = '';
  for await (const msg of result) {
    if (msg.type === 'assistant') {
      for (const block of (msg as any).message.content) {
        if (block.type === 'text') assistantText += block.text;
      }
    } else if (msg.type === 'result' && (msg as any).result && !assistantText) {
      assistantText = (msg as any).result;
    }
  }

  const obj = extractJsonObject(assistantText);
  if (!obj) throw new Error(`Could not parse JSON from Claude response: ${assistantText.slice(0, 200)}`);
  const parsed = ResultSchema.safeParse(obj);
  if (!parsed.success) {
    throw new Error(`Invalid lookup payload: ${parsed.error.issues[0]?.message}`);
  }
  return parsed.data;
}
