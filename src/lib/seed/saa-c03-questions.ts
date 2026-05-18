/**
 * AWS Certified Solutions Architect – Associate (SAA-C03) practice-exam
 * seed. Replaces ALL questions on the six published practice variants
 * (aws-saa-c03-p1 … aws-saa-c03-p6) with 65 fresh, original,
 * scenario-based questions per variant (390 total), authored against
 * the published SAA-C03 exam-guide domains.
 *
 * Idempotent: on every run it deletes every existing question on the
 * six variant exams and recreates the current sets. Exported as
 * `seedSaaC03(db)` so the same code path runs from the standalone CLI
 * shim (`prisma/seeds/saa-c03.ts`) and the protected admin API
 * (`/api/admin/seed-saa-c03`).
 *
 * Questions are original re-authored scenarios grounded in official AWS
 * documentation — not copied from any third-party question bank. No
 * real/official-exam claims are made.
 */
import { PrismaClient, QStatus } from '@prisma/client';
import { SAA_C03_DOMAINS, Q } from './saa-c03/types';
import { P1 } from './saa-c03/p1';
import { P2 } from './saa-c03/p2';
import { P3 } from './saa-c03/p3';
import { P4 } from './saa-c03/p4';
import { P5 } from './saa-c03/p5';
import { P6 } from './saa-c03/p6';

const VARIANTS: { slug: string; questions: Q[] }[] = [
  { slug: 'aws-saa-c03-p1', questions: P1 },
  { slug: 'aws-saa-c03-p2', questions: P2 },
  { slug: 'aws-saa-c03-p3', questions: P3 },
  { slug: 'aws-saa-c03-p4', questions: P4 },
  { slug: 'aws-saa-c03-p5', questions: P5 },
  { slug: 'aws-saa-c03-p6', questions: P6 }
];

const GENERATED_BY = 'manual:saa-c03-pdf';

type SeedResult = {
  exams: { slug: string; deleted: number; created: number; teaserCount: number }[];
};

/**
 * Idempotent seed for the SAA-C03 practice variants. Pass an existing
 * PrismaClient (lifecycle managed by caller).
 */
export async function seedSaaC03(db: PrismaClient): Promise<SeedResult> {
  const exams: SeedResult['exams'] = [];

  for (const v of VARIANTS) {
    const exam = await db.exam.findUnique({ where: { slug: v.slug } });
    if (!exam) {
      throw new Error(`Exam ${v.slug} not found — run the base catalog seed (npm run db:seed) first.`);
    }

    // Keep blueprint + presentation in sync, ensure variant is live.
    await db.exam.update({
      where: { id: exam.id },
      data: {
        level: 'Associate',
        durationMinutes: 130,
        passingScore: 72,
        questionCount: v.questions.length,
        domains: SAA_C03_DOMAINS,
        published: true
      }
    });

    // The boss asked to remove the old questions entirely: delete every
    // existing question on this variant, then recreate from scratch.
    const del = await db.question.deleteMany({ where: { examId: exam.id } });

    let teaserCount = 0;
    for (const q of v.questions) {
      await db.question.create({
        data: {
          examId: exam.id,
          domain: q.domain,
          difficulty: q.difficulty,
          type: q.type,
          stem: q.stem,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
          references: q.references,
          status: QStatus.PUBLISHED,
          generatedBy: GENERATED_BY,
          isTeaser: !!q.isTeaser
        }
      });
      if (q.isTeaser) teaserCount++;
    }

    exams.push({
      slug: v.slug,
      deleted: del.count,
      created: v.questions.length,
      teaserCount
    });
  }

  return { exams };
}
