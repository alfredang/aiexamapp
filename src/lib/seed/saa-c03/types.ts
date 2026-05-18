/**
 * Shared types and helpers for the AWS Certified Solutions Architect –
 * Associate (SAA-C03) practice-exam question sets (variants p1–p6).
 *
 * Each variant file exports a `Q[]` of 65 original, scenario-based
 * questions authored against the published SAA-C03 exam guide domains.
 * Questions are NOT copied from any third-party question bank — they are
 * re-authored scenarios grounded in official AWS documentation, with a
 * verified correct answer, an explanation of why the distractors are
 * wrong, and at least one AWS documentation reference.
 *
 * SAA-C03 official domain weighting:
 *   - Design Secure Architectures            — 30%
 *   - Design Resilient Architectures         — 26%
 *   - Design High-Performing Architectures   — 24%
 *   - Design Cost-Optimized Architectures    — 20%
 */
import { QType } from '@prisma/client';

export type Opt = { id: string; text: string };

export type Q = {
  domain: string;
  difficulty: number; // 1 (easy) – 4 (hard)
  type: QType;
  stem: string;
  options: Opt[];
  correct: string[]; // option ids
  explanation: string;
  references: { label: string; url: string }[];
  isTeaser?: boolean;
};

// Canonical SAA-C03 domain names. Use these exact strings so the
// per-domain results breakdown lines up with Exam.domains.
export const SECURE = 'Design Secure Architectures';
export const RESILIENT = 'Design Resilient Architectures';
export const PERF = 'Design High-Performing Architectures';
export const COST = 'Design Cost-Optimized Architectures';

export const SAA_C03_DOMAINS = [
  { name: SECURE, weight: 30 },
  { name: RESILIENT, weight: 26 },
  { name: PERF, weight: 24 },
  { name: COST, weight: 20 }
];

// Per-variant target distribution for 65 questions, proportional to the
// blueprint weights (20 + 17 + 16 + 12 = 65).
export const PER_VARIANT_TARGET = {
  [SECURE]: 20,
  [RESILIENT]: 17,
  [PERF]: 16,
  [COST]: 12
};

// 4-option SINGLE helper with ids a–d.
export const opts4 = (a: string, b: string, c: string, d: string): Opt[] => [
  { id: 'a', text: a },
  { id: 'b', text: b },
  { id: 'c', text: c },
  { id: 'd', text: d }
];

// 5-option helper (used for "choose two" MULTI questions) with ids a–e.
export const opts5 = (a: string, b: string, c: string, d: string, e: string): Opt[] => [
  { id: 'a', text: a },
  { id: 'b', text: b },
  { id: 'c', text: c },
  { id: 'd', text: d },
  { id: 'e', text: e }
];

// Frequently-used AWS documentation references.
export const REF = {
  S3_STORAGE_CLASSES: { label: 'Amazon S3 — Storage Classes', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html' },
  S3_LIFECYCLE: { label: 'Amazon S3 — Lifecycle configuration', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html' },
  S3_OBJECT_LOCK: { label: 'Amazon S3 — Object Lock', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html' },
  VPC_ENDPOINTS: { label: 'AWS PrivateLink — VPC endpoints', url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html' },
  GATEWAY_ENDPOINT: { label: 'Gateway VPC endpoints', url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html' },
  SQS: { label: 'Amazon SQS — Developer Guide', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html' },
  SNS: { label: 'Amazon SNS — Developer Guide', url: 'https://docs.aws.amazon.com/sns/latest/dg/welcome.html' },
  RDS_MULTI_AZ: { label: 'Amazon RDS — Multi-AZ deployments', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html' },
  RDS_READ_REPLICA: { label: 'Amazon RDS — Read replicas', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html' },
  AURORA: { label: 'Amazon Aurora — User Guide', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html' },
  DYNAMODB: { label: 'Amazon DynamoDB — Developer Guide', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html' },
  AUTOSCALING: { label: 'Amazon EC2 Auto Scaling — User Guide', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html' },
  ALB: { label: 'Elastic Load Balancing — Application Load Balancers', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html' },
  NLB: { label: 'Elastic Load Balancing — Network Load Balancers', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html' },
  CLOUDFRONT: { label: 'Amazon CloudFront — Developer Guide', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html' },
  ROUTE53: { label: 'Amazon Route 53 — Developer Guide', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html' },
  GLOBAL_ACCELERATOR: { label: 'AWS Global Accelerator — Developer Guide', url: 'https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html' },
  EFS: { label: 'Amazon EFS — User Guide', url: 'https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html' },
  FSX_WINDOWS: { label: 'Amazon FSx for Windows File Server', url: 'https://docs.aws.amazon.com/fsx/latest/WindowsGuide/what-is.html' },
  FSX_LUSTRE: { label: 'Amazon FSx for Lustre', url: 'https://docs.aws.amazon.com/fsx/latest/LustreGuide/what-is.html' },
  KMS: { label: 'AWS KMS — Developer Guide', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/overview.html' },
  IAM_ROLES: { label: 'IAM — Roles', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html' },
  IAM_POLICY_EVAL: { label: 'IAM — Policy evaluation logic', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html' },
  ORGANIZATIONS_SCP: { label: 'AWS Organizations — Service control policies', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html' },
  SECRETS_MANAGER: { label: 'AWS Secrets Manager — User Guide', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html' },
  WAF: { label: 'AWS WAF — Developer Guide', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html' },
  SHIELD: { label: 'AWS Shield — Developer Guide', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/shield-chapter.html' },
  KINESIS: { label: 'Amazon Kinesis Data Streams — Developer Guide', url: 'https://docs.aws.amazon.com/streams/latest/dev/introduction.html' },
  FIREHOSE: { label: 'Amazon Data Firehose — Developer Guide', url: 'https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html' },
  LAMBDA: { label: 'AWS Lambda — Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html' },
  API_GATEWAY: { label: 'Amazon API Gateway — Developer Guide', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html' },
  ECS: { label: 'Amazon ECS — Developer Guide', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html' },
  EKS: { label: 'Amazon EKS — User Guide', url: 'https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html' },
  FARGATE: { label: 'AWS Fargate', url: 'https://docs.aws.amazon.com/AmazonECS/latest/userguide/what-is-fargate.html' },
  EBS: { label: 'Amazon EBS — User Guide', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html' },
  DATASYNC: { label: 'AWS DataSync — User Guide', url: 'https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html' },
  SNOWBALL: { label: 'AWS Snowball Edge — Developer Guide', url: 'https://docs.aws.amazon.com/snowball/latest/developer-guide/whatisedge.html' },
  STORAGE_GATEWAY: { label: 'AWS Storage Gateway — User Guide', url: 'https://docs.aws.amazon.com/storagegateway/latest/userguide/WhatIsStorageGateway.html' },
  TRANSFER_FAMILY: { label: 'AWS Transfer Family — User Guide', url: 'https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html' },
  DIRECT_CONNECT: { label: 'AWS Direct Connect — User Guide', url: 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html' },
  TRANSIT_GATEWAY: { label: 'AWS Transit Gateway — Guide', url: 'https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html' },
  NAT_GATEWAY: { label: 'Amazon VPC — NAT gateways', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html' },
  ATHENA: { label: 'Amazon Athena — User Guide', url: 'https://docs.aws.amazon.com/athena/latest/ug/what-is.html' },
  GLUE: { label: 'AWS Glue — Developer Guide', url: 'https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html' },
  BACKUP: { label: 'AWS Backup — Developer Guide', url: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html' },
  COST_EXPLORER: { label: 'AWS Cost Management — Cost Explorer', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html' },
  BUDGETS: { label: 'AWS Budgets — User Guide', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html' },
  SAVINGS_PLANS: { label: 'AWS Savings Plans — User Guide', url: 'https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html' },
  EC2_PURCHASE: { label: 'Amazon EC2 — Instance purchasing options', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-purchasing-options.html' },
  WELL_ARCHITECTED: { label: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' }
};
