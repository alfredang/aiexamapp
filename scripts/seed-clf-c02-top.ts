/**
 * Seed: 1 final CLF-C02 question to round the exam to exactly 65
 * (matches the official AWS blueprint — 64 + 1 = 65).
 *
 *   npx tsx scripts/seed-clf-c02-top.ts
 *
 * Adds a Security and Compliance question on cross-account IAM roles —
 * a foundational topic not yet covered by the prior 19 Security questions
 * across batch 1 + batch 2.
 *
 * Idempotent via generatedBy='manual:clf-c02-top'.
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

const db = new PrismaClient();
const EXAM_SLUG = 'aws-clf-c02';
const TAG = 'manual:clf-c02-top';

async function main() {
  const exam = await db.exam.findUnique({ where: { slug: EXAM_SLUG } });
  if (!exam) throw new Error(`Exam "${EXAM_SLUG}" not found`);

  const already = await db.question.count({ where: { examId: exam.id, generatedBy: TAG } });
  if (already > 0) {
    console.log(`Already have ${already} question(s) tagged "${TAG}" — skipping.`);
    return;
  }

  await db.question.create({
    data: {
      examId: exam.id,
      domain: 'Security and Compliance',
      difficulty: 2,
      type: QType.SINGLE,
      stem: 'An auditing team operating from a separate AWS account needs read-only access to CloudTrail logs in the production AWS account. What is the MOST secure approach?',
      options: [
        { id: 'A', text: 'Create an IAM user in the production account and share its long-lived access keys with the auditing team.' },
        { id: 'B', text: 'Create an IAM role in the production account with the minimum read-only permissions needed, and configure its trust policy so the auditing account can assume the role via `sts:AssumeRole`.' },
        { id: 'C', text: 'Make the CloudTrail logs S3 bucket public so anyone can read it.' },
        { id: 'D', text: 'Share the production root user credentials with the auditing team for the duration of the audit.' }
      ],
      correct: ['B'],
      explanation: 'Cross-account access via IAM roles with `sts:AssumeRole` is the documented AWS best practice — credentials are temporary, automatically rotated, and scoped to the role\'s permission policy. The trust policy explicitly identifies which external principals can assume the role. Sharing long-lived IAM user keys (A), making the bucket public (C), or sharing root credentials (D) all violate AWS security best practices.',
      references: [{ label: 'IAM tutorial: Delegate access across AWS accounts using IAM roles', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html' }],
      status: QStatus.PUBLISHED,
      generatedBy: TAG,
      isTeaser: false
    }
  });

  const total = await db.question.count({ where: { examId: exam.id, status: QStatus.PUBLISHED } });
  console.log(`✓ Inserted 1 question for ${EXAM_SLUG}`);
  console.log(`  Total published questions for this exam: ${total} (target ${exam.questionCount})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
