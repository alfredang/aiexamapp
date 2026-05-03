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
- Every question gets a clear explanation and at least one reference URL pointing to official vendor documentation (Microsoft Learn, AWS docs, Google Cloud docs, RFCs, vendor study guide, etc).
- Single-answer questions have exactly one option with isCorrect.
- Multi-answer questions have 2-3 correct options of 5-6 total options.

Use the submit_question tool repeatedly — once per question — to emit a question. Do not include questions in your final text response. After all questions are submitted, reply with the literal string "DONE".`;

function userPrompt(input: GenerateInput) {
  const weights = input.domainWeights?.length
    ? `Domain weighting:\n${input.domainWeights.map(d => `- ${d.name}: ${d.weight}%`).join('\n')}\n`
    : '';
  return `Generate ${input.count} ${input.type} practice questions.

Vendor: ${input.vendor}
Certification: ${input.certification}
Exam code: ${input.examCode}
Target domain (focus): ${input.domain}
Difficulty: ${input.difficulty}/5
${weights}${input.examGuideUrl ? `Official exam guide: ${input.examGuideUrl}\n` : ''}
Call submit_question once per question. Then reply DONE.`;
}

const submitQuestionTool = {
  name: 'submit_question',
  description: 'Submit one practice question with options, correct answers, explanation, and references.',
  input_schema: {
    type: 'object',
    properties: {
      stem: { type: 'string' },
      type: { type: 'string', enum: ['SINGLE', 'MULTI', 'TRUE_FALSE'] },
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'string' }, text: { type: 'string' } },
          required: ['id', 'text']
        },
        minItems: 2,
        maxItems: 6
      },
      correct: { type: 'array', items: { type: 'string' }, minItems: 1 },
      explanation: { type: 'string' },
      domain: { type: 'string' },
      difficulty: { type: 'integer', minimum: 1, maximum: 5 },
      references: {
        type: 'array',
        items: {
          type: 'object',
          properties: { label: { type: 'string' }, url: { type: 'string' } },
          required: ['label', 'url']
        }
      },
      tags: { type: 'array', items: { type: 'string' } }
    },
    required: ['stem', 'type', 'options', 'correct', 'explanation', 'domain', 'difficulty']
  }
};

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
        maxTurns: input.count + 4,
        tools: [submitQuestionTool] as any
      } as any
    });

    for await (const msg of result) {
      if (msg.type !== 'assistant') continue;
      for (const block of msg.message.content) {
        if (block.type === 'tool_use' && block.name === 'submit_question') {
          const parsed = QuestionSchema.safeParse(block.input);
          if (parsed.success) {
            count += 1;
            yield { type: 'question', question: parsed.data };
            yield { type: 'progress', count, total: input.count };
          } else {
            yield { type: 'error', message: `Validation failed: ${parsed.error.issues[0]?.message}` };
          }
        }
      }
    }
    yield { type: 'done', total: count };
  } catch (err: any) {
    yield { type: 'error', message: err?.message || 'Generation failed' };
  }
}
