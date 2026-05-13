import { query } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { getSetting } from '@/lib/settings';

const DomainSchema = z.object({ name: z.string().min(1), weight: z.number().min(0).max(100) });

const ResultSchema = z.object({
  infoUrl: z.string().url(),
  examSets: z.number().int().min(1).max(6),
  notes: z.string().optional(),
  description: z.string().min(20).max(500).optional(),
  durationMinutes: z.number().int().min(15).max(360).optional(),
  passingScore: z.number().int().min(40).max(100).optional(),
  questionCount: z.number().int().min(10).max(120).optional(),
  domains: z.array(DomainSchema).optional()
});
export type ExamInfoLookup = z.infer<typeof ResultSchema>;

const SYSTEM = `You research IT certification exams on the open web.
Your job: given a vendor name, exam title, and exam code, find the OFFICIAL vendor page
that describes the certification (overview, blueprint, or exam guide PDF), and return
structured metadata about the exam.

Use the WebSearch + WebFetch tools to find the canonical vendor page (aws.amazon.com,
learn.microsoft.com, cloud.google.com, comptia.org, isc2.org, cisco.com, etc.).

Then extract:
- infoUrl: the canonical vendor page URL
- examSets: number of distinct practice exam variants (1-6, default 1)
- description: 1-3 sentence exam overview, 100-400 chars
- durationMinutes: exam length in minutes (typically 60-240)
- passingScore: passing percentage (typically 65-75)
- questionCount: number of questions in a full exam sitting (typically 40-90)
- domains: array of { name, weight } from the published blueprint. Weights as
  percentages summing to ~100. Use the exact domain names from the vendor page.

Output ONLY a single JSON object (no prose, no fences) with all fields you can fill
confidently. Omit fields you cannot verify from the vendor page rather than guessing.

Example shape:
{
  "infoUrl": "https://aws.amazon.com/certification/...",
  "examSets": 1,
  "description": "...",
  "durationMinutes": 130,
  "passingScore": 72,
  "questionCount": 65,
  "domains": [
    { "name": "Design Secure Architectures", "weight": 30 },
    { "name": "Design Resilient Architectures", "weight": 26 }
  ],
  "notes": "..."
}`;

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
  if (storedKey && !process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = storedKey;

  const prompt = `Vendor: ${input.vendor}
Certification title: ${input.title}
Exam code: ${input.code}

Find the official vendor page and extract: infoUrl, examSets, description,
durationMinutes, passingScore, questionCount, and the domain blueprint with weights.`;

  const result = query({
    prompt,
    options: {
      systemPrompt: SYSTEM,
      model: 'claude-sonnet-4-6',
      allowedTools: ['WebSearch', 'WebFetch'],
      maxTurns: 8
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
