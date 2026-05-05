/**
 * Seed: 35 hand-authored AWS SCS-C03 (Security Specialty) questions — second batch.
 * Together with the 25-question starter this brings the exam to 60.
 *
 *   npx tsx scripts/seed-scs-c03-fill2.ts
 *
 * Distribution adds toward the 16/14/18/20/18/14 blueprint:
 *   Detection                                +6
 *   Incident Response                        +5
 *   Infrastructure Security                  +7
 *   Identity and Access Management           +8
 *   Data Protection                          +6
 *   Security Foundations and Governance      +3
 *
 * Idempotent via generatedBy='manual:scs-c03-fill2'.
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

const db = new PrismaClient();
const EXAM_SLUG = 'aws-scs-c03';
const TAG = 'manual:scs-c03-fill2';

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
  guide:    { label: 'AWS SCS-C03 exam guide', url: 'https://docs.aws.amazon.com/aws-certification/latest/security-specialty-03/security-specialty-03.html' },
  guard:    { label: 'Amazon GuardDuty', url: 'https://docs.aws.amazon.com/guardduty/' },
  macie:    { label: 'Amazon Macie', url: 'https://docs.aws.amazon.com/macie/' },
  hub:      { label: 'AWS Security Hub', url: 'https://docs.aws.amazon.com/securityhub/' },
  ct:       { label: 'AWS CloudTrail', url: 'https://docs.aws.amazon.com/cloudtrail/' },
  config:   { label: 'AWS Config', url: 'https://docs.aws.amazon.com/config/' },
  inspector:{ label: 'Amazon Inspector', url: 'https://docs.aws.amazon.com/inspector/' },
  iam:      { label: 'AWS IAM (roles, policies, condition keys)', url: 'https://docs.aws.amazon.com/iam/' },
  sso:      { label: 'AWS IAM Identity Center', url: 'https://docs.aws.amazon.com/singlesignon/' },
  org:      { label: 'AWS Organizations + SCPs', url: 'https://docs.aws.amazon.com/organizations/' },
  kms:      { label: 'AWS KMS', url: 'https://docs.aws.amazon.com/kms/' },
  s3:       { label: 'Amazon S3 security and encryption', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingEncryption.html' },
  secrets:  { label: 'AWS Secrets Manager', url: 'https://docs.aws.amazon.com/secretsmanager/' },
  acm:      { label: 'AWS Certificate Manager + ACM Private CA', url: 'https://docs.aws.amazon.com/acm/' },
  vpc:      { label: 'Amazon VPC security (SG, NACL, Flow Logs)', url: 'https://docs.aws.amazon.com/vpc/' },
  fw:       { label: 'AWS Network Firewall', url: 'https://docs.aws.amazon.com/network-firewall/' },
  waf:      { label: 'AWS WAF + Shield', url: 'https://docs.aws.amazon.com/waf/' },
  audit:    { label: 'AWS Audit Manager', url: 'https://docs.aws.amazon.com/audit-manager/' },
  access:   { label: 'IAM Access Analyzer', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html' },
  fwm:      { label: 'AWS Firewall Manager', url: 'https://docs.aws.amazon.com/firewall-manager/' },
  ssm:      { label: 'AWS Systems Manager', url: 'https://docs.aws.amazon.com/systems-manager/' },
  ddos:     { label: 'AWS Shield Standard / Advanced', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/shield-chapter.html' },
  cogn:     { label: 'Amazon Cognito', url: 'https://docs.aws.amazon.com/cognito/' }
};

const QUESTIONS: Q[] = [

  // ───── Detection (6) ─────
  {
    domain: 'Detection',
    type: QType.SINGLE,
    stem: 'You enable GuardDuty in a delegated administrator account for your Organization. What does this give you?',
    options: [
      { id: 'A', text: 'A central admin account that auto-enables GuardDuty across all member accounts and aggregates findings.' },
      { id: 'B', text: 'A separate GuardDuty account for each region with no central view.' },
      { id: 'C', text: 'Disabling of CloudTrail.' },
      { id: 'D', text: 'Migration of all data to that account.' }
    ],
    correct: ['A'],
    explanation: 'Delegated admin centralises GuardDuty across an Organization with auto-enable for new accounts and a single console for findings.',
    ref: REFS.guard
  },
  {
    domain: 'Detection',
    type: QType.SINGLE,
    stem: 'You want to scan EC2 instances and ECR container images for software vulnerabilities and unintended network exposure with continuous coverage. Which fits?',
    options: [
      { id: 'A', text: 'Amazon Inspector v2 (continuous, account/Org scope, EC2 + ECR + Lambda).' },
      { id: 'B', text: 'Amazon Macie (S3-only sensitive-data discovery).' },
      { id: 'C', text: 'AWS Trusted Advisor.' },
      { id: 'D', text: 'AWS Config rules alone.' }
    ],
    correct: ['A'],
    explanation: 'Inspector v2 is the AWS continuous vulnerability assessment service. Macie targets S3 data. Trusted Advisor is best-practice checks. Config tracks resource state.',
    ref: REFS.inspector
  },
  {
    domain: 'Detection',
    type: QType.SINGLE,
    stem: 'A team aggregates security findings from GuardDuty, Macie, and Inspector. Auditors also want CIS / PCI / NIST compliance scoring. Which service provides BOTH?',
    options: [
      { id: 'A', text: 'AWS Security Hub.' },
      { id: 'B', text: 'AWS Audit Manager only.' },
      { id: 'C', text: 'CloudWatch dashboards.' },
      { id: 'D', text: 'AWS Trusted Advisor only.' }
    ],
    correct: ['A'],
    explanation: 'Security Hub aggregates findings AND runs CIS/PCI/NIST conformance packs. Audit Manager focuses on auditor-evidence collection.',
    ref: REFS.hub
  },
  {
    domain: 'Detection',
    type: QType.SINGLE,
    stem: 'You want an immutable audit trail of all AWS API calls in an Organization with 7-year retention and tamper detection. Which combination fits?',
    options: [
      { id: 'A', text: 'Organization trail in CloudTrail delivering to an S3 bucket with Object Lock + log-file integrity validation enabled.' },
      { id: 'B', text: 'Per-account CloudTrails with no central bucket.' },
      { id: 'C', text: 'Disable CloudTrail and rely on access logs.' },
      { id: 'D', text: 'Manual screenshots taken weekly.' }
    ],
    correct: ['A'],
    explanation: 'Org trail + S3 Object Lock + log-file integrity validation is the documented immutable-audit pattern. The other options fail one or more requirements.',
    ref: REFS.ct
  },
  {
    domain: 'Detection',
    type: QType.SINGLE,
    stem: 'GuardDuty raises a `Recon:EC2/PortProbeUnprotectedPort` finding. What does it indicate?',
    options: [
      { id: 'A', text: 'A known malicious source has probed an unprotected EC2 port — investigate exposure and apply tighter Security Groups / NACLs.' },
      { id: 'B', text: 'AWS upgraded the EC2 hypervisor.' },
      { id: 'C', text: 'A KMS key was rotated.' },
      { id: 'D', text: 'A Lambda function timed out.' }
    ],
    correct: ['A'],
    explanation: 'GuardDuty Recon findings indicate scanning/probing activity. The other options are unrelated to that finding type.',
    ref: REFS.guard
  },
  {
    domain: 'Detection',
    type: QType.MULTI,
    stem: 'Which TWO statements about Macie are TRUE?',
    options: [
      { id: 'A', text: 'Macie discovers and classifies sensitive data (PII, financial info, secrets) in S3 using ML and managed identifiers.' },
      { id: 'B', text: 'Findings can be sent to Security Hub or to EventBridge for automation.' },
      { id: 'C', text: 'Macie scans EC2 disks.' },
      { id: 'D', text: 'Macie replaces CloudTrail.' },
      { id: 'E', text: 'Macie cannot integrate with KMS.' }
    ],
    correct: ['A', 'B'],
    explanation: 'A and B are correct. Macie focuses on S3 (not EC2 disks). It doesn\'t replace CloudTrail and works with KMS-encrypted objects (with key access).',
    ref: REFS.macie
  },

  // ───── Incident Response (5) ─────
  {
    domain: 'Incident Response',
    type: QType.SINGLE,
    stem: 'A GuardDuty finding indicates an EC2 instance is mining cryptocurrency. The IR runbook should auto-isolate the instance and snapshot its volumes for forensics. Which AWS native pattern fits?',
    options: [
      { id: 'A', text: 'EventBridge rule on the GuardDuty finding → Lambda that replaces the instance\'s SG with a "quarantine" SG (deny all) and creates EBS snapshots.' },
      { id: 'B', text: 'Email and wait.' },
      { id: 'C', text: 'Disable GuardDuty.' },
      { id: 'D', text: 'Public-IP the instance.' }
    ],
    correct: ['A'],
    explanation: 'EventBridge → Lambda automated remediation (isolate + preserve evidence) is the canonical IR automation pattern.',
    ref: REFS.guard
  },
  {
    domain: 'Incident Response',
    type: QType.SINGLE,
    stem: 'Credential compromise: an IAM user\'s access keys were posted publicly. What is the FIRST priority?',
    options: [
      { id: 'A', text: 'Immediately deactivate (or delete) the keys and reset the user\'s console password; review CloudTrail for actions taken with the keys.' },
      { id: 'B', text: 'Schedule a meeting next week.' },
      { id: 'C', text: 'Do nothing — the keys may not have been used.' },
      { id: 'D', text: 'Make the bucket public to "outrun" the attacker.' }
    ],
    correct: ['A'],
    explanation: 'Revoke + audit is the canonical IR step for credential leaks. Delays let the attacker keep operating.',
    ref: REFS.iam
  },
  {
    domain: 'Incident Response',
    type: QType.SINGLE,
    stem: 'A KMS key was scheduled for deletion 7 days ago by a former admin. Today, an EC2 EBS volume needs the key. What can you do?',
    options: [
      { id: 'A', text: 'Cancel the key deletion (KMS keys have a 7-30 day waiting period and can be cancelled before the scheduled deletion completes).' },
      { id: 'B', text: 'Recover instantly — KMS keys are never actually deleted.' },
      { id: 'C', text: 'Re-import the key bytes from a backup file (not possible for AWS-generated keys).' },
      { id: 'D', text: 'Nothing — the data is permanently lost.' }
    ],
    correct: ['A'],
    explanation: 'KMS supports a 7-30 day waiting period during which deletion can be cancelled. Once the period elapses, the key is destroyed and AWS-generated key material is unrecoverable.',
    ref: REFS.kms
  },
  {
    domain: 'Incident Response',
    type: QType.SINGLE,
    stem: 'During IR, you need to understand the path a request took through the AWS network and which SG/NACL would deny it. Which fits?',
    options: [
      { id: 'A', text: 'VPC Reachability Analyzer.' },
      { id: 'B', text: 'AWS Trusted Advisor.' },
      { id: 'C', text: 'CloudWatch dashboards.' },
      { id: 'D', text: 'Amazon Polly.' }
    ],
    correct: ['A'],
    explanation: 'Reachability Analyzer simulates path between two ENIs and pinpoints denying configuration. The other tools don\'t path-trace.',
    ref: REFS.vpc
  },
  {
    domain: 'Incident Response',
    type: QType.MULTI,
    stem: 'During an active attack on a public web app, which TWO actions help mitigate immediately?',
    options: [
      { id: 'A', text: 'Apply a rate-based AWS WAF rule to block IPs sending abnormally high request rates.' },
      { id: 'B', text: 'Engage AWS Shield Advanced DDoS Response Team (DRT) if subscribed and the attack is volumetric.' },
      { id: 'C', text: 'Disable HTTPS to "go faster".' },
      { id: 'D', text: 'Open all SGs to 0.0.0.0/0 to "improve flow".' },
      { id: 'E', text: 'Delete CloudWatch alarms to silence alerting.' }
    ],
    correct: ['A', 'B'],
    explanation: 'WAF rate-based rules + Shield Advanced DRT are documented active-mitigation tools. The other options are critical anti-patterns.',
    ref: REFS.ddos
  },

  // ───── Infrastructure Security (7) ─────
  {
    domain: 'Infrastructure Security',
    type: QType.SINGLE,
    stem: 'You need centrally-managed stateful firewall protection for VPC traffic — Suricata-compatible rules, FQDN/domain filtering, IDS/IPS. Which fits?',
    options: [
      { id: 'A', text: 'AWS Network Firewall.' },
      { id: 'B', text: 'AWS WAF (L7 web-app firewall, not for arbitrary VPC traffic).' },
      { id: 'C', text: 'Security Groups alone.' },
      { id: 'D', text: 'Route 53 Resolver alone.' }
    ],
    correct: ['A'],
    explanation: 'Network Firewall is the AWS-managed L3-L7 stateful firewall with Suricata rules and domain filtering. WAF is L7 web-app. SGs are per-ENI allow rules.',
    ref: REFS.fw
  },
  {
    domain: 'Infrastructure Security',
    type: QType.SINGLE,
    stem: 'You want to manage WAF, Shield Advanced, Security Groups (audit), and Network Firewall policies consistently across all accounts in an Organization. Which fits?',
    options: [
      { id: 'A', text: 'AWS Firewall Manager.' },
      { id: 'B', text: 'AWS Config conformance packs alone.' },
      { id: 'C', text: 'Manual per-account configuration.' },
      { id: 'D', text: 'AWS Trusted Advisor.' }
    ],
    correct: ['A'],
    explanation: 'Firewall Manager centrally administers WAF, Shield Advanced, Network Firewall policies, and audited SG content across an Organization.',
    ref: REFS.fwm
  },
  {
    domain: 'Infrastructure Security',
    type: QType.SINGLE,
    stem: 'A team needs to run shell commands on EC2 fleet without opening port 22 / having a bastion host. Which fits?',
    options: [
      { id: 'A', text: 'AWS Systems Manager Session Manager (and Run Command for non-interactive).' },
      { id: 'B', text: 'Open SSH from 0.0.0.0/0.' },
      { id: 'C', text: 'A web shell exposed publicly.' },
      { id: 'D', text: 'A shared keypair posted to a public wiki.' }
    ],
    correct: ['A'],
    explanation: 'SSM Session Manager / Run Command don\'t need inbound ports and integrate with IAM, CloudTrail, encryption. The other options are critical anti-patterns.',
    ref: REFS.ssm
  },
  {
    domain: 'Infrastructure Security',
    type: QType.SINGLE,
    stem: 'A Lambda must reach an RDS database in a private subnet. What is the LEAST-privilege networking setup?',
    options: [
      { id: 'A', text: 'Configure the Lambda with VPC config in the same VPC and a Lambda-only Security Group; allow that SG as a source on the RDS SG.' },
      { id: 'B', text: 'Make the RDS publicly accessible.' },
      { id: 'C', text: 'Open all SGs to 0.0.0.0/0.' },
      { id: 'D', text: 'Send credentials over plaintext HTTP.' }
    ],
    correct: ['A'],
    explanation: 'Lambda-in-VPC + SG-as-source on the DB is the documented secure pattern. Public RDS / open SGs / plaintext defy security baselines.',
    ref: REFS.vpc
  },
  {
    domain: 'Infrastructure Security',
    type: QType.SINGLE,
    stem: 'You need a private internal CA to issue certificates for internal microservice TLS, with managed root + revocation. Which fits?',
    options: [
      { id: 'A', text: 'AWS Private Certificate Authority (ACM Private CA).' },
      { id: 'B', text: 'A self-signed certificate emailed to teammates.' },
      { id: 'C', text: 'AWS WAF.' },
      { id: 'D', text: 'AWS GuardDuty.' }
    ],
    correct: ['A'],
    explanation: 'ACM Private CA is the AWS managed private PKI. The other options don\'t issue certificates or are unrelated.',
    ref: REFS.acm
  },
  {
    domain: 'Infrastructure Security',
    type: QType.SINGLE,
    stem: 'A PCI workload must keep cardholder traffic INSIDE AWS — no internet egress for AWS service API calls. Which fits?',
    options: [
      { id: 'A', text: 'VPC Interface and Gateway endpoints (PrivateLink) for the AWS services in use.' },
      { id: 'B', text: 'A public NAT Gateway.' },
      { id: 'C', text: 'Direct Connect.' },
      { id: 'D', text: 'Open SGs to 0.0.0.0/0.' }
    ],
    correct: ['A'],
    explanation: 'VPC endpoints keep traffic to AWS services on the AWS network. NAT GWs go to the internet. DX is for hybrid; the question is about intra-AWS.',
    ref: REFS.vpc
  },
  {
    domain: 'Infrastructure Security',
    type: QType.MULTI,
    stem: 'Which TWO statements about Network ACLs are TRUE?',
    options: [
      { id: 'A', text: 'NACLs are stateless — return traffic must be explicitly allowed.' },
      { id: 'B', text: 'NACL rules are evaluated in numbered order; lowest-numbered match wins.' },
      { id: 'C', text: 'NACLs attach to ENIs.' },
      { id: 'D', text: 'NACLs cannot have deny rules.' },
      { id: 'E', text: 'NACLs only apply to outbound traffic.' }
    ],
    correct: ['A', 'B'],
    explanation: 'A and B are correct. NACLs attach to subnets (not ENIs), DO support deny rules, and apply to BOTH directions.',
    ref: REFS.vpc
  },

  // ───── Identity and Access Management (8) ─────
  {
    domain: 'Identity and Access Management',
    type: QType.SINGLE,
    stem: 'A workforce uses Okta for corporate identity. What is the recommended way to grant SSO into AWS accounts?',
    options: [
      { id: 'A', text: 'AWS IAM Identity Center federated to Okta with permission sets mapped to Okta groups.' },
      { id: 'B', text: 'Per-user IAM users in every account, sourced from Okta.' },
      { id: 'C', text: 'Cognito User Pools.' },
      { id: 'D', text: 'AWS Directory Service alone.' }
    ],
    correct: ['A'],
    explanation: 'IAM Identity Center is the AWS-managed workforce SSO with Org-wide permission sets, federated to corporate IdPs.',
    ref: REFS.sso
  },
  {
    domain: 'Identity and Access Management',
    type: QType.SINGLE,
    stem: 'You want developers to have admin power in a dev account but be UNABLE to access production no matter what. Which is the right combination?',
    options: [
      { id: 'A', text: 'Permission boundaries on IAM principals capping the dev role + SCPs on production OU denying actions for those principals.' },
      { id: 'B', text: 'Documentation in a wiki.' },
      { id: 'C', text: 'Trust developers.' },
      { id: 'D', text: 'A read-only S3 bucket.' }
    ],
    correct: ['A'],
    explanation: 'Permission boundaries (per-principal) + SCPs (per-account/OU) are documented enforcement mechanisms. The other options aren\'t enforcement.',
    ref: REFS.iam
  },
  {
    domain: 'Identity and Access Management',
    type: QType.SINGLE,
    stem: 'A Lambda assumes an IAM role to access services. Which IAM construct grants the Lambda the permissions and ALLOWS Lambda service to assume it?',
    options: [
      { id: 'A', text: 'An IAM role with a permissions policy AND a trust policy allowing `lambda.amazonaws.com` to assume it.' },
      { id: 'B', text: 'An IAM user with embedded keys.' },
      { id: 'C', text: 'An ACM certificate.' },
      { id: 'D', text: 'A KMS grant.' }
    ],
    correct: ['A'],
    explanation: 'IAM roles need both a permissions policy AND a trust policy specifying who can assume them. The other options aren\'t IAM roles.',
    ref: REFS.iam
  },
  {
    domain: 'Identity and Access Management',
    type: QType.SINGLE,
    stem: 'You want to ENFORCE that all IAM users in an account have MFA enabled and require MFA before they can perform any privileged action. Which fits?',
    options: [
      { id: 'A', text: 'An IAM policy condition `aws:MultiFactorAuthPresent = true` on the privileged actions, plus alerting / blocking when MFA is missing on user accounts.' },
      { id: 'B', text: 'Document MFA in onboarding and hope.' },
      { id: 'C', text: 'Disable IAM.' },
      { id: 'D', text: 'Use a public S3 bucket.' }
    ],
    correct: ['A'],
    explanation: 'aws:MultiFactorAuthPresent is the documented IAM policy condition for MFA-gated actions. Documentation alone isn\'t enforcement.',
    ref: REFS.iam
  },
  {
    domain: 'Identity and Access Management',
    type: QType.SINGLE,
    stem: 'You suspect a resource (e.g., an S3 bucket or KMS key) may have a policy granting external access. Which service surfaces that?',
    options: [
      { id: 'A', text: 'IAM Access Analyzer.' },
      { id: 'B', text: 'AWS Trusted Advisor IAM check (limited scope).' },
      { id: 'C', text: 'CloudWatch Logs Insights.' },
      { id: 'D', text: 'A spreadsheet.' }
    ],
    correct: ['A'],
    explanation: 'IAM Access Analyzer uses provable security to flag resources accessible from outside the trust zone (account/Org). Trusted Advisor offers narrower checks.',
    ref: REFS.access
  },
  {
    domain: 'Identity and Access Management',
    type: QType.SINGLE,
    stem: 'A workload running on EC2 needs short-lived credentials to assume cross-account roles. What\'s the documented pattern?',
    options: [
      { id: 'A', text: 'Use the EC2 instance role to call `sts:AssumeRole` against the target-account role; the trust policy lists the source-account role/principal.' },
      { id: 'B', text: 'Embed the target account\'s root keys on the instance.' },
      { id: 'C', text: 'Make the target bucket public.' },
      { id: 'D', text: 'Use a hard-coded long-lived access key.' }
    ],
    correct: ['A'],
    explanation: 'Cross-account role assumption via STS is the documented pattern. The other options are critical anti-patterns.',
    ref: REFS.iam
  },
  {
    domain: 'Identity and Access Management',
    type: QType.SINGLE,
    stem: 'A consumer mobile app needs end-user sign-in (email + password, social IdPs) and needs the signed-in user to call AWS APIs directly with TEMPORARY credentials. Which combination fits?',
    options: [
      { id: 'A', text: 'Cognito User Pools (auth) + Cognito Identity Pools (federated identities exchanging the JWT for STS credentials).' },
      { id: 'B', text: 'IAM users for every app user.' },
      { id: 'C', text: 'Embed your AWS keys in the mobile binary.' },
      { id: 'D', text: 'Use root credentials.' }
    ],
    correct: ['A'],
    explanation: 'User Pools + Identity Pools is the documented mobile/web identity pattern. Embedding keys / using root / per-user IAM users are critical anti-patterns.',
    ref: REFS.cogn
  },
  {
    domain: 'Identity and Access Management',
    type: QType.MULTI,
    stem: 'Which TWO statements about IAM policy evaluation are TRUE?',
    options: [
      { id: 'A', text: 'An explicit deny in any policy (identity, resource, SCP, permission boundary, session) overrides any allow.' },
      { id: 'B', text: 'In the absence of an explicit allow, the request is implicitly denied.' },
      { id: 'C', text: 'A wildcard allow always wins regardless of denies.' },
      { id: 'D', text: 'IAM evaluates policies in alphabetical order of file name.' },
      { id: 'E', text: 'Resource policies are not considered.' }
    ],
    correct: ['A', 'B'],
    explanation: 'Explicit deny wins; implicit deny is the default. The other options misstate the policy-evaluation logic.',
    ref: REFS.iam
  },

  // ───── Data Protection (6) ─────
  {
    domain: 'Data Protection',
    type: QType.SINGLE,
    stem: 'You want to ENFORCE that no S3 PUT can succeed without SSE-KMS encryption with a specific KMS key. Which fits?',
    options: [
      { id: 'A', text: 'Bucket policy with deny conditions on `s3:PutObject` when `s3:x-amz-server-side-encryption-aws-kms-key-id` does not match the required key ARN.' },
      { id: 'B', text: 'A daily Lambda audit.' },
      { id: 'C', text: 'Documentation only.' },
      { id: 'D', text: 'CloudFront restriction.' }
    ],
    correct: ['A'],
    explanation: 'Bucket-policy deny is API-layer enforcement. Audits/docs detect after the fact.',
    ref: REFS.s3
  },
  {
    domain: 'Data Protection',
    type: QType.SINGLE,
    stem: 'You\'re protecting a KMS CMK from accidental use by other principals. Which mechanism scopes who can use the key?',
    options: [
      { id: 'A', text: 'The KMS key policy (and optional grants) — the primary access-control surface for KMS keys.' },
      { id: 'B', text: 'Network ACLs.' },
      { id: 'C', text: 'CloudFront restrictions.' },
      { id: 'D', text: 'AWS Trusted Advisor.' }
    ],
    correct: ['A'],
    explanation: 'KMS uses key policies (and optional grants). NACLs/CloudFront/Trusted Advisor don\'t control KMS access.',
    ref: REFS.kms
  },
  {
    domain: 'Data Protection',
    type: QType.SINGLE,
    stem: 'A regulated workload requires that sensitive data in S3 be encrypted with keys whose key-material the customer supplied (BYOK). Which KMS option fits?',
    options: [
      { id: 'A', text: 'KMS with imported key material (CMK created with origin EXTERNAL).' },
      { id: 'B', text: 'AWS-owned keys.' },
      { id: 'C', text: 'Aws-managed keys.' },
      { id: 'D', text: 'No encryption.' }
    ],
    correct: ['A'],
    explanation: 'KMS supports importing customer-supplied key material (CMK with origin=EXTERNAL). The other options don\'t accept BYOK.',
    ref: REFS.kms
  },
  {
    domain: 'Data Protection',
    type: QType.SINGLE,
    stem: 'You want secrets stored centrally with native automatic rotation for Aurora and DocumentDB credentials. Which fits?',
    options: [
      { id: 'A', text: 'AWS Secrets Manager.' },
      { id: 'B', text: 'SSM Parameter Store standard tier (no built-in rotation).' },
      { id: 'C', text: 'A `.env` file in S3.' },
      { id: 'D', text: 'Hard-coded constants.' }
    ],
    correct: ['A'],
    explanation: 'Secrets Manager has native rotation for RDS, Aurora, DocumentDB, Redshift. Parameter Store standard lacks built-in rotation.',
    ref: REFS.secrets
  },
  {
    domain: 'Data Protection',
    type: QType.SINGLE,
    stem: 'A team wants to centrally rotate ALL public TLS certificates for ALBs and CloudFront with no-touch renewal. Which fits?',
    options: [
      { id: 'A', text: 'AWS Certificate Manager (ACM) with auto-renewal for AWS-integrated endpoints.' },
      { id: 'B', text: 'Manually buying yearly third-party certs.' },
      { id: 'C', text: 'Self-signed certs deployed manually.' },
      { id: 'D', text: 'Disabling HTTPS.' }
    ],
    correct: ['A'],
    explanation: 'ACM provides free public TLS certs that auto-renew for AWS-integrated endpoints. The other options are manual / unsafe.',
    ref: REFS.acm
  },
  {
    domain: 'Data Protection',
    type: QType.MULTI,
    stem: 'Which TWO statements about S3 encryption options are TRUE?',
    options: [
      { id: 'A', text: 'SSE-S3 uses S3-managed keys; SSE-KMS uses KMS keys with audit and customer control; SSE-C lets the customer supply the encryption key per request.' },
      { id: 'B', text: 'Default bucket encryption applies SSE-S3 or SSE-KMS automatically to PUT objects without explicit headers.' },
      { id: 'C', text: 'Only client-side encryption is supported.' },
      { id: 'D', text: 'S3 cannot be encrypted at rest.' },
      { id: 'E', text: 'SSE-KMS always costs the same as SSE-S3.' }
    ],
    correct: ['A', 'B'],
    explanation: 'A and B describe the documented S3 encryption modes. The other statements are wrong.',
    ref: REFS.s3
  },

  // ───── Security Foundations and Governance (3) ─────
  {
    domain: 'Security Foundations and Governance',
    type: QType.SINGLE,
    stem: 'Auditors require continuous evidence collection mapped to NIST 800-53 controls — no manual screenshots. Which fits?',
    options: [
      { id: 'A', text: 'AWS Audit Manager with the NIST 800-53 framework template.' },
      { id: 'B', text: 'AWS Trusted Advisor.' },
      { id: 'C', text: 'CloudWatch dashboards.' },
      { id: 'D', text: 'A weekly meeting.' }
    ],
    correct: ['A'],
    explanation: 'Audit Manager continuously collects evidence mapped to control frameworks. The other options are off-pattern.',
    ref: REFS.audit
  },
  {
    domain: 'Security Foundations and Governance',
    type: QType.SINGLE,
    stem: 'You want to GUARANTEE that no member account can disable Security Hub or use unapproved regions. Which fits?',
    options: [
      { id: 'A', text: 'Service Control Policies (SCPs) at the OU/Org level denying the relevant API actions.' },
      { id: 'B', text: 'IAM permission boundaries on every IAM user.' },
      { id: 'C', text: 'A wiki page.' },
      { id: 'D', text: 'CloudWatch alarms.' }
    ],
    correct: ['A'],
    explanation: 'SCPs are the only mechanism that caps permissions for ALL principals (including root) in member accounts.',
    ref: REFS.org
  },
  {
    domain: 'Security Foundations and Governance',
    type: QType.MULTI,
    stem: 'Which TWO are core principles of the AWS Well-Architected Security Pillar?',
    options: [
      { id: 'A', text: 'Implement a strong identity foundation — least privilege, separation of duties, central identity.' },
      { id: 'B', text: 'Apply security at all layers (network, host, app, data) — defense in depth.' },
      { id: 'C', text: 'Trust developers blindly to skip code review.' },
      { id: 'D', text: 'Disable monitoring once production is stable.' },
      { id: 'E', text: 'Hard-code production credentials in source code.' }
    ],
    correct: ['A', 'B'],
    explanation: 'Strong identity foundation and defense in depth are documented Security Pillar design principles. The other options are anti-patterns.',
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
