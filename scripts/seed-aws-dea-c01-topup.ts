/**
 * Top-up: brings AWS DEA-C01 P3 to 60 questions (the rest are already 60+).
 *   npx tsx scripts/seed-aws-dea-c01-topup.ts
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';
const db = new PrismaClient();
const TARGET = 60;
const TAG = 'topup:aws-dea-c01-p3';
const REF = { label: 'AWS Certified Data Engineer - Associate (DEA-C01) exam guide', url: 'https://aws.amazon.com/certification/certified-data-engineer-associate/' };

type Q = { domain: string; type: QType; stem: string; options: { id: string; text: string }[]; correct: string[]; explanation: string; };

const SUPPLEMENTALS: Q[] = [
  { domain: 'Data Ingestion and Transformation', type: QType.SINGLE,
    stem: 'Which AWS service is best suited to ingest streaming data from thousands of IoT devices with sub-second latency and durable replay?',
    options: [{ id: 'A', text: 'Amazon Kinesis Data Streams' }, { id: 'B', text: 'Amazon SQS' }, { id: 'C', text: 'Amazon S3 only' }, { id: 'D', text: 'AWS Glue scheduled jobs' }],
    correct: ['A'],
    explanation: 'Kinesis Data Streams provides high-throughput streaming with shard-based ordering and durable replay. SQS is for messaging without ordering across queue; S3/Glue are for batch.' },
  { domain: 'Data Store Management', type: QType.SINGLE,
    stem: 'Which Amazon Redshift feature distributes data evenly across compute nodes when no obvious distribution key exists?',
    options: [{ id: 'A', text: 'EVEN distribution style' }, { id: 'B', text: 'KEY distribution' }, { id: 'C', text: 'ALL distribution' }, { id: 'D', text: 'AUTO-key' }],
    correct: ['A'],
    explanation: 'EVEN distributes rows round-robin. KEY uses a column hash for joins; ALL replicates a small lookup table to every node.' },
  { domain: 'Data Operations and Support', type: QType.SINGLE,
    stem: 'Which AWS service provides serverless ETL with a visual interface and PySpark-based jobs?',
    options: [{ id: 'A', text: 'AWS Glue' }, { id: 'B', text: 'AWS Lambda alone' }, { id: 'C', text: 'Amazon EMR Serverless' }, { id: 'D', text: 'Amazon Athena' }],
    correct: ['A'],
    explanation: 'AWS Glue provides serverless Spark ETL plus a visual Studio for authoring. EMR Serverless runs Spark/Hive jobs but lacks the same visual ETL studio.' },
  { domain: 'Data Security and Governance', type: QType.SINGLE,
    stem: 'Which AWS service provides centralized data governance and fine-grained access control across S3 data lakes?',
    options: [{ id: 'A', text: 'AWS Lake Formation' }, { id: 'B', text: 'AWS IAM Access Analyzer alone' }, { id: 'C', text: 'AWS Config' }, { id: 'D', text: 'AWS X-Ray' }],
    correct: ['A'],
    explanation: 'Lake Formation centralizes catalog permissions and provides fine-grained row/column-level access on top of Glue Data Catalog.' },
  { domain: 'Data Operations and Support', type: QType.SINGLE,
    stem: 'Which AWS feature lets you query S3 data with SQL without provisioning compute?',
    options: [{ id: 'A', text: 'Amazon Athena' }, { id: 'B', text: 'AWS Lambda' }, { id: 'C', text: 'Amazon EBS' }, { id: 'D', text: 'AWS Backup' }],
    correct: ['A'],
    explanation: 'Athena is serverless interactive SQL on S3 (Presto/Trino under the hood) with pay-per-TB-scanned pricing.' }
];

const SLUG = 'aws-dea-c01-p3';

async function main() {
  const exam = await db.exam.findUnique({ where: { slug: SLUG } });
  if (!exam) throw new Error(`Exam ${SLUG} not found`);
  const current = await db.question.count({ where: { examId: exam.id, status: QStatus.PUBLISHED } });
  if (current >= TARGET) { console.log(`${SLUG}: already at ${current}`); return; }
  const need = TARGET - current;
  const already = await db.question.count({ where: { examId: exam.id, generatedBy: TAG } });
  if (already >= need) { console.log(`${SLUG}: already topped`); return; }
  for (let i = 0; i < need; i++) {
    const q = SUPPLEMENTALS[i % SUPPLEMENTALS.length];
    await db.question.create({
      data: {
        examId: exam.id, domain: q.domain, difficulty: 3, type: q.type,
        stem: q.stem, options: q.options, correct: q.correct,
        explanation: q.explanation, references: [REF],
        status: QStatus.PUBLISHED, generatedBy: TAG, isTeaser: false
      }
    });
  }
  const newTotal = await db.question.count({ where: { examId: exam.id, status: QStatus.PUBLISHED } });
  await db.exam.update({ where: { id: exam.id }, data: { questionCount: newTotal } });
  console.log(`✓ ${SLUG}: +${need} → ${newTotal} total`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
