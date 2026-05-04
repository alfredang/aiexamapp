import { query } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export const QuestionSchema = z.object({
  stem: z.string().min(10),
  type: z.enum(['SINGLE', 'MULTI', 'TRUE_FALSE']),
  options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2).max(6),
  correct: z.array(z.string()).min(1),
  explanation: z.string().min(10),
  domain: z.string(),
  difficulty: z.number().int().min(1).max(5),
  references: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  tags: z.array(z.string()).default([])
});
export type GeneratedQuestion = z.infer<typeof QuestionSchema>;

export type GenerateInput = {
  vendor: string;
  certification: string;
  examCode: string;
  domain: string;
  domainWeights?: { name: string; weight: number }[];
  count: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  type: 'SINGLE' | 'MULTI' | 'TRUE_FALSE';
  examGuideUrl?: string;
};

const SYSTEM = `You are an expert practice-exam author for industry IT certifications.

Rules — these are non-negotiable:
- Produce ORIGINAL questions for educational use only.
- NEVER reproduce real exam questions or claim to be official dumps.
- Every question gets a clear explanation and at least one reference URL pointing to official vendor documentation (Microsoft Learn, AWS docs, Anthropic docs, Google Cloud docs, RFCs, vendor study guide, etc).
- Single-answer questions have exactly one option with isCorrect.
- Multi-answer questions have 2-3 correct options of 5-6 total options.

Output format: respond with ONLY a JSON array — no prose, no markdown fences, no explanation outside the JSON.

Each array element MUST match this exact schema:
{
  "stem": string (the question text, at least 10 chars),
  "type": "SINGLE" | "MULTI" | "TRUE_FALSE",
  "options": [{ "id": "a"|"b"|"c"|"d"|"e"|"f", "text": string }],
  "correct": [string]  (option ids that are correct, length 1 for SINGLE),
  "explanation": string (why the correct answer is right and why distractors are wrong),
  "domain": string (the exam domain this question covers),
  "difficulty": integer 1-5,
  "references": [{ "label": string, "url": string (full https URL) }],
  "tags": [string]
}

Output ONLY the JSON array. Do not wrap in code fences. Do not add commentary before or after.`;

function userPrompt(input: GenerateInput) {
  const weights = input.domainWeights?.length
    ? `Full exam blueprint (for context):\n${input.domainWeights.map(d => `- ${d.name}: ${d.weight}%`).join('\n')}\n\n`
    : '';
  return `Generate exactly ${input.count} ${input.type} practice questions in JSON.

Vendor: ${input.vendor}
Certification: ${input.certification}
Exam code: ${input.examCode}
Focus domain (every question must cover this domain): ${input.domain}
Difficulty target: ${input.difficulty}/5
${weights}${input.examGuideUrl ? `Official exam guide: ${input.examGuideUrl}\n\n` : ''}Respond with the JSON array only.`;
}

function extractJsonArray(text: string): unknown[] | null {
  // Strip code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  // Find first '[' and last ']' to be lenient about prose around the array
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export type StreamEvent =
  | { type: 'question'; question: GeneratedQuestion }
  | { type: 'progress'; count: number; total: number }
  | { type: 'done'; total: number }
  | { type: 'error'; message: string };

export async function* streamGenerateQuestions(input: GenerateInput): AsyncGenerator<StreamEvent> {
  let count = 0;
  try {
    const result = query({
      prompt: userPrompt(input),
      options: {
        systemPrompt: SYSTEM,
        model: 'claude-sonnet-4-6',
        maxTurns: 1
      } as any
    });

    let assistantText = '';
    for await (const msg of result) {
      if (msg.type === 'assistant') {
        for (const block of msg.message.content) {
          if (block.type === 'text') assistantText += (block as any).text;
        }
      }
    }
    // Fallback: if no assistant text was captured (some SDK builds), use result event
    if (!assistantText) {
      const result2 = query({
        prompt: userPrompt(input),
        options: { systemPrompt: SYSTEM, model: 'claude-sonnet-4-6', maxTurns: 1 } as any
      });
      for await (const msg of result2) {
        if (msg.type === 'result' && (msg as any).result) assistantText = (msg as any).result;
      }
    }

    const arr = extractJsonArray(assistantText);
    if (!arr) {
      if (process.env.DEBUG_CLAUDE) {
        const fs = await import('fs');
        const path = `/tmp/claude-debug-${Date.now()}.txt`;
        fs.writeFileSync(path, assistantText);
        yield { type: 'error', message: `Could not parse JSON. Raw output saved to ${path} (${assistantText.length} chars).` };
      } else {
        const preview = assistantText.slice(0, 400).replace(/\s+/g, ' ');
        yield { type: 'error', message: `Could not parse JSON array (${assistantText.length} chars). Preview: ${preview}` };
      }
      yield { type: 'done', total: 0 };
      return;
    }

    for (const raw of arr) {
      const parsed = QuestionSchema.safeParse(raw);
      if (parsed.success) {
        count += 1;
        yield { type: 'question', question: parsed.data };
        yield { type: 'progress', count, total: input.count };
      } else {
        yield { type: 'error', message: `Validation failed: ${parsed.error.issues[0]?.message}` };
      }
    }
    yield { type: 'done', total: count };
  } catch (err: any) {
    yield { type: 'error', message: err?.message || 'Generation failed' };
  }
}
