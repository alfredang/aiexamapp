/**
 * Seed: 35 hand-authored AWS SAP-C02 (Solutions Architect Professional) questions — second batch.
 * Together with the 25-question starter this brings the exam to 60.
 *
 *   npx tsx scripts/seed-sap-c02-fill2.ts
 *
 * Distribution adds toward the 26/29/25/20 blueprint:
 *   Design Solutions for Organizational Complexity   +9
 *   Design for New Solutions                         +11
 *   Continuous Improvement for Existing Solutions    +9
 *   Accelerate Workload Migration and Modernization  +6
 *
 * Idempotent via generatedBy='manual:sap-c02-fill2'.
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

const db = new PrismaClient();
const EXAM_SLUG = 'aws-sap-c02';
const TAG = 'manual:sap-c02-fill2';

type Q = {
  domain: string;
  type: QType;
  stem: string;
  options: { id: string; text: string }[];
  correct: string[];
  explanation: string;
  ref: { label: string; url: string };
};

const REFS = {
  guide:    { label: 'AWS SAP-C02 exam guide', url: 'https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html' },
  org:      { label: 'AWS Organizations + SCPs', url: 'https://docs.aws.amazon.com/organizations/' },
  ct:       { label: 'AWS Control Tower', url: 'https://docs.aws.amazon.com/controltower/' },
  sso:      { label: 'AWS IAM Identity Center', url: 'https://docs.aws.amazon.com/singlesignon/' },
  ram:      { label: 'AWS Resource Access Manager', url: 'https://docs.aws.amazon.com/ram/' },
  tgw:      { label: 'AWS Transit Gateway', url: 'https://docs.aws.amazon.com/vpc/latest/tgw/' },
  cwan:     { label: 'AWS Cloud WAN', url: 'https://docs.aws.amazon.com/network-manager/latest/cloudwan/' },
  svccat:   { label: 'AWS Service Catalog', url: 'https://docs.aws.amazon.com/servicecatalog/' },
  iam:      { label: 'AWS IAM', url: 'https://docs.aws.amazon.com/iam/' },
  s3:       { label: 'Amazon S3', url: 'https://docs.aws.amazon.com/AmazonS3/' },
  s3mrap:   { label: 'S3 Multi-Region Access Points', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/MultiRegionAccessPoints.html' },
  cf:       { label: 'Amazon CloudFront', url: 'https://docs.aws.amazon.com/cloudfront/' },
  r53:      { label: 'Amazon Route 53', url: 'https://docs.aws.amazon.com/route53/' },
  ga:       { label: 'AWS Global Accelerator', url: 'https://docs.aws.amazon.com/global-accelerator/' },
  ddb:      { label: 'Amazon DynamoDB Global Tables', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html' },
  rds:      { label: 'Amazon RDS / Aurora', url: 'https://docs.aws.amazon.com/rds/' },
  ecs:      { label: 'Amazon ECS / EKS / Fargate', url: 'https://docs.aws.amazon.com/ecs/' },
  step:     { label: 'AWS Step Functions', url: 'https://docs.aws.amazon.com/step-functions/' },
  outpost:  { label: 'AWS Outposts / Local Zones / Wavelength', url: 'https://docs.aws.amazon.com/outposts/' },
  kms:      { label: 'AWS KMS multi-region keys', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/multi-region-keys-overview.html' },
  costex:   { label: 'AWS Cost Explorer + Compute Optimizer', url: 'https://docs.aws.amazon.com/cost-management/' },
  trusted:  { label: 'AWS Trusted Advisor', url: 'https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html' },
  wellarch: { label: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/' },
  mgn:      { label: 'AWS Application Migration Service (MGN)', url: 'https://docs.aws.amazon.com/mgn/' },
  dms:      { label: 'AWS Database Migration Service (DMS) + SCT', url: 'https://docs.aws.amazon.com/dms/' },
  datasync: { label: 'AWS DataSync', url: 'https://docs.aws.amazon.com/datasync/' },
  storagegw:{ label: 'AWS Storage Gateway', url: 'https://docs.aws.amazon.com/storagegateway/' },
  snowball: { label: 'AWS Snow Family', url: 'https://docs.aws.amazon.com/snowball/' },
  hub:      { label: 'AWS Migration Hub', url: 'https://docs.aws.amazon.com/migrationhub/' }
};

const QUESTIONS: Q[] = [

  // ───── Design Solutions for Organizational Complexity (9) ─────
  {
    domain: 'Design Solutions for Organizational Complexity',
    type: QType.SINGLE,
    stem: 'A central network team owns all VPCs. Workload accounts must launch resources directly in shared subnets owned by the network account (not their own copy). Which fits?',
    options: [
      { id: 'A', text: 'AWS Resource Access Manager (RAM) — share VPC subnets from the network account to the workload accounts.' },
      { id: 'B', text: 'VPC peering between every account pair.' },
      { id: 'C', text: 'A Direct Connect to each workload account.' },
      { id: 'D', text: 'Manually copying subnet IDs into each account.' }
    ],
    correct: ['A'],
    explanation: 'RAM enables shared VPC subnets owned by the network account. Workload accounts launch ENIs directly in them. Peering doesn\'t share subnets.',
    ref: REFS.ram
  },
  {
    domain: 'Design Solutions for Organizational Complexity',
    type: QType.SINGLE,
    stem: 'A regulated company wants pre-built guardrails (preventive SCPs + detective Config rules), a log-archive + audit account, and Account Factory for new account vending. Which fits?',
    options: [
      { id: 'A', text: 'AWS Control Tower (with Account Factory and pre-built guardrails).' },
      { id: 'B', text: 'AWS Trusted Advisor.' },
      { id: 'C', text: 'A custom CloudFormation per account.' },
      { id: 'D', text: 'Manual onboarding emails.' }
    ],
    correct: ['A'],
    explanation: 'Control Tower automates landing-zone creation with guardrails and Account Factory. The other options are off-pattern.',
    ref: REFS.ct
  },
  {
    domain: 'Design Solutions for Organizational Complexity',
    type: QType.SINGLE,
    stem: 'A central tooling account vends standardised, pre-approved CloudFormation products to engineering teams in member accounts (e.g., approved RDS configurations) with per-product IAM scoping. Which fits?',
    options: [
      { id: 'A', text: 'AWS Service Catalog (Portfolio + Product + cross-account sharing).' },
      { id: 'B', text: 'A wiki of approved JSON.' },
      { id: 'C', text: 'CloudFront caching.' },
      { id: 'D', text: 'AWS Trusted Advisor.' }
    ],
    correct: ['A'],
    explanation: 'Service Catalog is the AWS-native curated-product offering with cross-account sharing. The other options aren\'t product catalogs.',
    ref: REFS.svccat
  },
  {
    domain: 'Design Solutions for Organizational Complexity',
    type: QType.SINGLE,
    stem: 'Multiple regions and accounts need centrally-managed global network policy, segmentation, and a unified dashboard — beyond what TGW alone offers. Which fits?',
    options: [
      { id: 'A', text: 'AWS Cloud WAN.' },
      { id: 'B', text: 'A pair of VPC peerings.' },
      { id: 'C', text: 'A NAT Gateway in every account.' },
      { id: 'D', text: 'A spreadsheet.' }
    ],
    correct: ['A'],
    explanation: 'Cloud WAN is the AWS managed global WAN for multi-region/account network policy. The other options don\'t scale.',
    ref: REFS.cwan
  },
  {
    domain: 'Design Solutions for Organizational Complexity',
    type: QType.SINGLE,
    stem: 'A security team needs to ensure that NEW resources created across an Organization always inherit a baseline (e.g., S3 Block Public Access, default encryption). Which combination fits?',
    options: [
      { id: 'A', text: 'Service Control Policies (preventive) + AWS Config Conformance Packs (detective + remediation) + Account Factory baseline (Control Tower).' },
      { id: 'B', text: 'A daily email reminding admins.' },
      { id: 'C', text: 'A wiki page only.' },
      { id: 'D', text: 'A weekly meeting.' }
    ],
    correct: ['A'],
    explanation: 'Layered preventive (SCP) + detective (Config) + provisioning baselines is the documented multi-account governance pattern.',
    ref: REFS.org
  },
  {
    domain: 'Design Solutions for Organizational Complexity',
    type: QType.SINGLE,
    stem: 'You want CloudTrail organization trail centralised in one account, with logs encrypted by a customer-managed KMS key the audit team controls. Which configuration fits?',
    options: [
      { id: 'A', text: 'Organisation trail in the management account → audit account\'s S3 bucket; the bucket policy and KMS key policy explicitly grant CloudTrail and the audit team access.' },
      { id: 'B', text: 'A trail in each account, no central bucket.' },
      { id: 'C', text: 'Disable CloudTrail.' },
      { id: 'D', text: 'Email logs to auditors weekly.' }
    ],
    correct: ['A'],
    explanation: 'Org trail to a centrally-controlled audit bucket with KMS is the documented log-archive pattern. Per-account trails miss centralisation; the other options are off-pattern.',
    ref: REFS.org
  },
  {
    domain: 'Design Solutions for Organizational Complexity',
    type: QType.SINGLE,
    stem: 'A workforce with Active Directory needs SSO into AWS accounts AND into 30 SaaS apps. Which fits?',
    options: [
      { id: 'A', text: 'AWS IAM Identity Center connected to AD (managed AD or AD Connector) — SSO into AWS accounts and SAML/OIDC SaaS apps with permission sets and app assignments.' },
      { id: 'B', text: 'IAM users for every employee.' },
      { id: 'C', text: 'Cognito User Pools for workforce.' },
      { id: 'D', text: 'Email passwords daily.' }
    ],
    correct: ['A'],
    explanation: 'IAM Identity Center supports AD as identity source and SaaS-app SSO. The other options don\'t scale or are unsafe.',
    ref: REFS.sso
  },
  {
    domain: 'Design Solutions for Organizational Complexity',
    type: QType.MULTI,
    stem: 'Which TWO are valid uses of AWS Organizations Service Control Policies (SCPs)?',
    options: [
      { id: 'A', text: 'Restrict member accounts to specific approved AWS regions.' },
      { id: 'B', text: 'Block specific high-risk APIs (e.g., `ec2:DisableImageDeprecation`) across all principals in target OU.' },
      { id: 'C', text: 'Grant permissions to users (SCPs are deny-only — they don\'t grant).' },
      { id: 'D', text: 'Manage per-user IAM credentials.' },
      { id: 'E', text: 'Apply outside the AWS Organization boundary.' }
    ],
    correct: ['A', 'B'],
    explanation: 'SCPs are guardrails (deny-only) targeting accounts/OUs. They don\'t grant or manage credentials, and only apply within an Organization.',
    ref: REFS.org
  },
  {
    domain: 'Design Solutions for Organizational Complexity',
    type: QType.MULTI,
    stem: 'Which TWO statements about AWS RAM are TRUE?',
    options: [
      { id: 'A', text: 'RAM can share VPC subnets, Transit Gateways, License Manager configs, Route 53 Resolver rules, and more across an Organization.' },
      { id: 'B', text: 'RAM allows the resource owner to retain operational control while consumers use the resource directly in their own account.' },
      { id: 'C', text: 'RAM transfers ownership of resources between accounts.' },
      { id: 'D', text: 'RAM is only for S3 buckets.' },
      { id: 'E', text: 'RAM cannot share with an entire Organization.' }
    ],
    correct: ['A', 'B'],
    explanation: 'A and B describe RAM accurately. RAM does NOT transfer ownership, supports many resource types beyond S3, and CAN share Organization-wide.',
    ref: REFS.ram
  },

  // ───── Design for New Solutions (11) ─────
  {
    domain: 'Design for New Solutions',
    type: QType.SINGLE,
    stem: 'A global write-anywhere read-anywhere NoSQL workload needs ms latency from any region with active-active multi-region writes. Which fits?',
    options: [
      { id: 'A', text: 'DynamoDB Global Tables.' },
      { id: 'B', text: 'Aurora Global Database (single primary writer; not active-active).' },
      { id: 'C', text: 'Self-managed Cassandra on EC2.' },
      { id: 'D', text: 'Single-region RDS.' }
    ],
    correct: ['A'],
    explanation: 'Global Tables = active-active multi-region NoSQL. Aurora Global has one writer. Self-managed defeats managed-service goal.',
    ref: REFS.ddb
  },
  {
    domain: 'Design for New Solutions',
    type: QType.SINGLE,
    stem: 'A global object-storage workload needs a single S3 endpoint that auto-routes clients to the lowest-latency healthy bucket in multiple regions. Which fits?',
    options: [
      { id: 'A', text: 'S3 Multi-Region Access Points (MRAP) with failover routing.' },
      { id: 'B', text: 'Manual DNS round-robin.' },
      { id: 'C', text: 'Direct Connect to one region only.' },
      { id: 'D', text: 'CloudFront with one origin.' }
    ],
    correct: ['A'],
    explanation: 'MRAP gives a single global endpoint with replicated buckets and intelligent routing/failover. The other options are inferior or wrong.',
    ref: REFS.s3mrap
  },
  {
    domain: 'Design for New Solutions',
    type: QType.SINGLE,
    stem: 'A workload requires sub-5-millisecond latency from end-user mobile devices on 5G — beyond regular regions. Which AWS option fits?',
    options: [
      { id: 'A', text: 'AWS Wavelength (5G edge inside carrier networks).' },
      { id: 'B', text: 'A regular us-east-1 region.' },
      { id: 'C', text: 'CloudFront alone.' },
      { id: 'D', text: 'Direct Connect.' }
    ],
    correct: ['A'],
    explanation: 'Wavelength runs AWS compute inside 5G carrier networks for ultra-low-latency mobile workloads. The other options don\'t reach that latency floor.',
    ref: REFS.outpost
  },
  {
    domain: 'Design for New Solutions',
    type: QType.SINGLE,
    stem: 'A regulated workload requires AWS managed services running ON premises (e.g., for data-residency compliance). Which fits?',
    options: [
      { id: 'A', text: 'AWS Outposts (rack or server) — managed AWS services in your data center.' },
      { id: 'B', text: 'A self-managed VMware cluster.' },
      { id: 'C', text: 'CloudFront edge locations.' },
      { id: 'D', text: 'Snowball Edge for years at a time.' }
    ],
    correct: ['A'],
    explanation: 'Outposts is the AWS managed-on-prem hardware for data-residency / latency requirements. The other options aren\'t managed AWS on-prem.',
    ref: REFS.outpost
  },
  {
    domain: 'Design for New Solutions',
    type: QType.SINGLE,
    stem: 'A multi-region active-passive web app needs a single global static IP, fast failover, and TCP/UDP support — beyond what CloudFront offers. Which fits?',
    options: [
      { id: 'A', text: 'AWS Global Accelerator.' },
      { id: 'B', text: 'CloudFront (HTTP only).' },
      { id: 'C', text: 'Route 53 simple routing.' },
      { id: 'D', text: 'Direct Connect.' }
    ],
    correct: ['A'],
    explanation: 'Global Accelerator gives static anycast IPs + AWS-edge acceleration for TCP/UDP across regions, with health-aware failover. CloudFront is HTTP-only.',
    ref: REFS.ga
  },
  {
    domain: 'Design for New Solutions',
    type: QType.SINGLE,
    stem: 'A multi-region encryption strategy requires the SAME KMS key (key material) usable in two regions for encrypting and decrypting cross-region replicated data. Which fits?',
    options: [
      { id: 'A', text: 'KMS multi-region keys (replica keys in multiple regions sharing the same key material and ID).' },
      { id: 'B', text: 'A single-region CMK and hope.' },
      { id: 'C', text: 'AWS-owned keys.' },
      { id: 'D', text: 'No encryption.' }
    ],
    correct: ['A'],
    explanation: 'Multi-region keys allow same key material in multiple regions. Single-region CMKs are not portable. AWS-owned keys aren\'t customer-controlled.',
    ref: REFS.kms
  },
  {
    domain: 'Design for New Solutions',
    type: QType.SINGLE,
    stem: 'A workload has bursty intermittent traffic at unpredictable times. The DB tier should auto-scale capacity DOWN to near-zero when idle. Which fits?',
    options: [
      { id: 'A', text: 'Aurora Serverless v2 — auto-scales ACUs (capacity units) down to a low minimum.' },
      { id: 'B', text: 'Aurora Provisioned with the largest instance class always running.' },
      { id: 'C', text: 'A 24/7 oversized RDS PostgreSQL.' },
      { id: 'D', text: 'A bare-metal server.' }
    ],
    correct: ['A'],
    explanation: 'Aurora Serverless v2 is the scale-on-demand option ideal for bursty workloads. The other options always cost.',
    ref: REFS.rds
  },
  {
    domain: 'Design for New Solutions',
    type: QType.SINGLE,
    stem: 'A long-running batch workflow (>5 minutes) with branches and retries that touches many AWS services. Which Step Functions workflow type fits?',
    options: [
      { id: 'A', text: 'Step Functions Standard (up to 1 year, full execution history, exactly-once).' },
      { id: 'B', text: 'Step Functions Express only.' },
      { id: 'C', text: 'A single Lambda doing everything.' },
      { id: 'D', text: 'Cron on EC2.' }
    ],
    correct: ['A'],
    explanation: 'Standard supports long durations and full audit. Express is for short high-throughput. Long-running monoliths in Lambda hit the 15-min cap.',
    ref: REFS.step
  },
  {
    domain: 'Design for New Solutions',
    type: QType.SINGLE,
    stem: 'A workload uses ECS on EC2 today. The team wants to remove all instance management overhead while keeping ECS task definitions and integrations. Which fits?',
    options: [
      { id: 'A', text: 'Switch the task launch type to AWS Fargate (serverless container compute).' },
      { id: 'B', text: 'Switch to EC2 t2.micro for everything.' },
      { id: 'C', text: 'Migrate to Lambda regardless of fit.' },
      { id: 'D', text: 'Run on Outposts.' }
    ],
    correct: ['A'],
    explanation: 'ECS Fargate keeps ECS abstractions while removing instance management. The other options don\'t match the requirement.',
    ref: REFS.ecs
  },
  {
    domain: 'Design for New Solutions',
    type: QType.MULTI,
    stem: 'Which TWO are documented patterns for an event-driven, loosely-coupled architecture on AWS?',
    options: [
      { id: 'A', text: 'SNS topic with multiple SQS subscribers (fan-out).' },
      { id: 'B', text: 'EventBridge rules routing service events to Lambda or Step Functions.' },
      { id: 'C', text: 'Producers calling consumers synchronously over SSH for every event.' },
      { id: 'D', text: 'Storing all events in a SQLite file on a developer\'s laptop.' },
      { id: 'E', text: 'A static text file polled every second.' }
    ],
    correct: ['A', 'B'],
    explanation: 'SNS+SQS and EventBridge are the two canonical AWS pub/sub and event-routing primitives.',
    ref: REFS.guide
  },
  {
    domain: 'Design for New Solutions',
    type: QType.MULTI,
    stem: 'Which TWO statements about Direct Connect resilience are TRUE?',
    options: [
      { id: 'A', text: 'For high resilience, use multiple Direct Connect connections terminating at multiple Direct Connect locations across multiple devices.' },
      { id: 'B', text: 'Site-to-Site VPN can serve as encrypted backup for Direct Connect using BGP path preference.' },
      { id: 'C', text: 'A single Direct Connect connection without backup is sufficient for a "highly available" architecture.' },
      { id: 'D', text: 'Direct Connect cannot be combined with Site-to-Site VPN.' },
      { id: 'E', text: 'Direct Connect provides built-in encryption by default (it does not — MACsec is opt-in for selected port speeds).' }
    ],
    correct: ['A', 'B'],
    explanation: 'A and B are documented HA patterns. The other statements are wrong.',
    ref: REFS.guide
  },

  // ───── Continuous Improvement for Existing Solutions (9) ─────
  {
    domain: 'Continuous Improvement for Existing Solutions',
    type: QType.SINGLE,
    stem: 'You discover EBS gp2 volumes attached to many instances. The team wants better performance and lower cost. Which migration is recommended?',
    options: [
      { id: 'A', text: 'Migrate to gp3 — independent IOPS/throughput provisioning, generally cheaper and more flexible than gp2.' },
      { id: 'B', text: 'Migrate to magnetic (standard).' },
      { id: 'C', text: 'Stay on gp2 forever.' },
      { id: 'D', text: 'Move to st1 (HDD).' }
    ],
    correct: ['A'],
    explanation: 'gp3 is generally cheaper and more flexible than gp2. Magnetic / HDD are slower; staying on gp2 forgoes savings.',
    ref: REFS.guide
  },
  {
    domain: 'Continuous Improvement for Existing Solutions',
    type: QType.SINGLE,
    stem: 'A 50TB S3 bucket has unknown access patterns — some objects are hot, others cold, with high variability. Which storage class minimises cost without performance trade-offs?',
    options: [
      { id: 'A', text: 'S3 Intelligent-Tiering — automatically moves objects between tiers based on observed access patterns.' },
      { id: 'B', text: 'S3 Glacier Deep Archive (multi-hour retrieval — wrong for hot/cold mix).' },
      { id: 'C', text: 'Stay on S3 Standard everywhere.' },
      { id: 'D', text: 'Manually classify each object weekly.' }
    ],
    correct: ['A'],
    explanation: 'Intelligent-Tiering monitors and tiers automatically — ideal for unknown/changing patterns. Deep Archive breaks hot access.',
    ref: REFS.s3
  },
  {
    domain: 'Continuous Improvement for Existing Solutions',
    type: QType.SINGLE,
    stem: 'A SaaS website is single-region in `us-east-1`. Read-heavy global users complain about latency. Which is the lowest-effort improvement?',
    options: [
      { id: 'A', text: 'Add CloudFront in front with appropriate cache TTLs.' },
      { id: 'B', text: 'Migrate to a different cloud provider.' },
      { id: 'C', text: 'Move the database to read-only on the client devices.' },
      { id: 'D', text: 'Disable HTTPS to "go faster".' }
    ],
    correct: ['A'],
    explanation: 'CloudFront delivers cached content from edge globally — the canonical low-effort latency improvement.',
    ref: REFS.cf
  },
  {
    domain: 'Continuous Improvement for Existing Solutions',
    type: QType.SINGLE,
    stem: 'You want continuous, multi-account visibility into right-sizing recommendations and Savings Plans / RI gaps. Which fits?',
    options: [
      { id: 'A', text: 'AWS Cost Explorer + Compute Optimizer (Org-wide).' },
      { id: 'B', text: 'Manual spreadsheets each month.' },
      { id: 'C', text: 'CloudFront caches.' },
      { id: 'D', text: 'AWS WAF.' }
    ],
    correct: ['A'],
    explanation: 'Cost Explorer + Compute Optimizer with Organization access is the documented continuous-cost-optimisation pair.',
    ref: REFS.costex
  },
  {
    domain: 'Continuous Improvement for Existing Solutions',
    type: QType.SINGLE,
    stem: 'A team uses RDS PostgreSQL with single-AZ. They want HA with no app code changes and < 60s failover. Which fits?',
    options: [
      { id: 'A', text: 'Enable Multi-AZ for RDS — synchronous standby with same DNS endpoint and automated failover.' },
      { id: 'B', text: 'Add a read replica for "HA".' },
      { id: 'C', text: 'A pair of unrelated DBs and copy nightly.' },
      { id: 'D', text: 'A DynamoDB migration.' }
    ],
    correct: ['A'],
    explanation: 'Multi-AZ is the documented RDS HA primitive. Read replicas are not HA. The other options are not equivalent.',
    ref: REFS.rds
  },
  {
    domain: 'Continuous Improvement for Existing Solutions',
    type: QType.SINGLE,
    stem: 'An existing workload uses a Classic Load Balancer (CLB). The team wants L7 features (path/host routing, gRPC, WebSocket). Which fits?',
    options: [
      { id: 'A', text: 'Migrate to Application Load Balancer (ALB).' },
      { id: 'B', text: 'Stay on CLB forever.' },
      { id: 'C', text: 'Migrate to NLB (L4 only).' },
      { id: 'D', text: 'Replace LB with a single EC2.' }
    ],
    correct: ['A'],
    explanation: 'ALB is the modern L7 LB. NLB is L4. CLB is deprecated. Single EC2 isn\'t a load balancer.',
    ref: REFS.guide
  },
  {
    domain: 'Continuous Improvement for Existing Solutions',
    type: QType.SINGLE,
    stem: 'Stakeholders want a structured Well-Architected review of an existing workload across the 6 pillars. Which fits?',
    options: [
      { id: 'A', text: 'AWS Well-Architected Tool review with appropriate lenses (Serverless, ML, etc.).' },
      { id: 'B', text: 'AWS Trusted Advisor only.' },
      { id: 'C', text: 'Compute Optimizer only.' },
      { id: 'D', text: 'A wiki page.' }
    ],
    correct: ['A'],
    explanation: 'WA Tool is the structured review tool. Trusted Advisor / Compute Optimizer are narrower.',
    ref: REFS.wellarch
  },
  {
    domain: 'Continuous Improvement for Existing Solutions',
    type: QType.MULTI,
    stem: 'Which TWO actions improve resilience of an existing single-AZ stateless web tier at lowest effort?',
    options: [
      { id: 'A', text: 'Move EC2 fleet behind an ALB across multiple AZs with an Auto Scaling group.' },
      { id: 'B', text: 'Use cross-zone load balancing on the ALB so traffic is balanced evenly across all healthy targets.' },
      { id: 'C', text: 'Run a single oversized EC2 instance.' },
      { id: 'D', text: 'Disable health checks.' },
      { id: 'E', text: 'Skip backups.' }
    ],
    correct: ['A', 'B'],
    explanation: 'Multi-AZ ASG behind ALB + cross-zone LB are documented foundational resilience patterns.',
    ref: REFS.guide
  },
  {
    domain: 'Continuous Improvement for Existing Solutions',
    type: QType.MULTI,
    stem: 'Which TWO are documented cost-optimisation actions for steady-state EC2 baselines?',
    options: [
      { id: 'A', text: 'Right-size with Compute Optimizer recommendations BEFORE committing to Savings Plans.' },
      { id: 'B', text: 'Use Spot Instances for interruption-tolerant tiers.' },
      { id: 'C', text: 'Always buy 3-year No-Upfront RIs at current oversized capacity.' },
      { id: 'D', text: 'Disable monitoring to save cost.' },
      { id: 'E', text: 'Use root credentials for CI to skip IAM cost.' }
    ],
    correct: ['A', 'B'],
    explanation: 'Right-size first, then commit; Spot for fault-tolerant. The other options waste money or are anti-patterns.',
    ref: REFS.costex
  },

  // ───── Accelerate Workload Migration and Modernization (6) ─────
  {
    domain: 'Accelerate Workload Migration and Modernization',
    type: QType.SINGLE,
    stem: 'You want a single pane of glass to track multiple migrations, sources, and statuses across AWS Application Migration Service, DMS, and partner tools. Which fits?',
    options: [
      { id: 'A', text: 'AWS Migration Hub.' },
      { id: 'B', text: 'A spreadsheet.' },
      { id: 'C', text: 'AWS WAF.' },
      { id: 'D', text: 'Amazon Polly.' }
    ],
    correct: ['A'],
    explanation: 'Migration Hub aggregates migration progress across tools. The other options aren\'t.',
    ref: REFS.hub
  },
  {
    domain: 'Accelerate Workload Migration and Modernization',
    type: QType.SINGLE,
    stem: 'You\'re moving 100 TB of file shares from on-prem NAS to S3 over an existing 1 Gbps WAN. Which fits?',
    options: [
      { id: 'A', text: 'AWS DataSync — managed, parallelised, encrypted file/object transfer with bandwidth limits and incremental syncs.' },
      { id: 'B', text: 'Manual rsync from a single laptop.' },
      { id: 'C', text: 'Email the files.' },
      { id: 'D', text: 'Snowball Edge (offline) — faster only if the WAN is too slow; with 1 Gbps and 100 TB, online via DataSync is reasonable.' }
    ],
    correct: ['A'],
    explanation: 'DataSync is purpose-built for online migration of file/object data. Snowball is the offline alternative for low-bandwidth scenarios.',
    ref: REFS.datasync
  },
  {
    domain: 'Accelerate Workload Migration and Modernization',
    type: QType.SINGLE,
    stem: 'On-prem applications need ongoing access to AWS storage backed by S3 with NFS/SMB semantics for users. Which fits?',
    options: [
      { id: 'A', text: 'AWS Storage Gateway (File Gateway / Volume Gateway / Tape Gateway).' },
      { id: 'B', text: 'A 24/7 EC2 host with manual rsync.' },
      { id: 'C', text: 'Email backups.' },
      { id: 'D', text: 'CloudFront.' }
    ],
    correct: ['A'],
    explanation: 'Storage Gateway is the bridge between on-prem and AWS storage with NFS/SMB/iSCSI/VTL semantics.',
    ref: REFS.storagegw
  },
  {
    domain: 'Accelerate Workload Migration and Modernization',
    type: QType.SINGLE,
    stem: 'Migrating a heterogeneous database (Oracle → Aurora PostgreSQL) requires schema + code conversion plus continuous data replication. Which combination fits?',
    options: [
      { id: 'A', text: 'AWS SCT for schema/code conversion + AWS DMS for ongoing replication and final cutover.' },
      { id: 'B', text: 'A single mysqldump emailed to the DBA.' },
      { id: 'C', text: 'Snowmobile for the schema.' },
      { id: 'D', text: 'EBS snapshot.' }
    ],
    correct: ['A'],
    explanation: 'SCT + DMS is the documented heterogeneous DB migration path. The others aren\'t.',
    ref: REFS.dms
  },
  {
    domain: 'Accelerate Workload Migration and Modernization',
    type: QType.SINGLE,
    stem: 'A team wants to lift-and-shift a fleet of VMware VMs to EC2 with continuous block-level replication so cutover is fast and tested. Which fits?',
    options: [
      { id: 'A', text: 'AWS Application Migration Service (MGN).' },
      { id: 'B', text: 'AWS DataSync.' },
      { id: 'C', text: 'AWS Snowball Edge.' },
      { id: 'D', text: 'Amazon Polly.' }
    ],
    correct: ['A'],
    explanation: 'MGN is the AWS lift-and-shift tool with block-level continuous replication and orchestrated cutover.',
    ref: REFS.mgn
  },
  {
    domain: 'Accelerate Workload Migration and Modernization',
    type: QType.MULTI,
    stem: 'Which TWO statements about modernization paths are TRUE?',
    options: [
      { id: 'A', text: 'Replatform from self-managed MySQL on EC2 to Aurora MySQL reduces operational overhead while keeping the engine.' },
      { id: 'B', text: 'Refactor a monolith to microservices on ECS / EKS / Lambda can improve scalability and deployment velocity, but is a longer effort.' },
      { id: 'C', text: 'Modernization always requires rewriting all code in one sprint.' },
      { id: 'D', text: 'Lift-and-shift workloads cannot benefit from Auto Scaling.' },
      { id: 'E', text: 'Managed services should be avoided because of vendor lock-in.' }
    ],
    correct: ['A', 'B'],
    explanation: 'A and B are correct. Modernization is iterative; lift-and-shift workloads still benefit from Auto Scaling; managed services usually win on TCO.',
    ref: REFS.guide
  }
];

async function main() {
  const exam = await db.exam.findUnique({ where: { slug: EXAM_SLUG } });
  if (!exam) throw new Error(`Exam "${EXAM_SLUG}" not found`);
  const already = await db.question.count({ where: { examId: exam.id, generatedBy: TAG } });
  if (already > 0) {
    console.log(`Already have ${already} questions tagged "${TAG}" — skipping.`);
    return;
  }
  for (const q of QUESTIONS) {
    await db.question.create({
      data: {
        examId: exam.id,
        domain: q.domain,
        difficulty: 4,
        type: q.type,
        stem: q.stem,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        references: [q.ref],
        status: QStatus.PUBLISHED,
        generatedBy: TAG,
        isTeaser: false
      }
    });
  }
  const total = await db.question.count({ where: { examId: exam.id, status: QStatus.PUBLISHED } });
  console.log(`✓ Inserted ${QUESTIONS.length} questions for ${EXAM_SLUG}`);
  console.log(`  Total published questions for this exam: ${total} (target ${exam.questionCount})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
