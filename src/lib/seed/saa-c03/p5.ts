/**
 * AWS Certified Solutions Architect – Associate (SAA-C03)
 * Practice-exam variant p5.
 *
 * Service emphasis: Security, Identity & Compliance — IAM roles &
 * policy evaluation, cross-account AssumeRole, Organizations SCPs,
 * permission boundaries, KMS, Secrets Manager, WAF/Shield, GuardDuty,
 * Macie, Inspector, Detective, Cognito, VPC endpoint policies, S3
 * bucket policies & Block Public Access, ACM/TLS, CloudTrail/Config.
 *
 * 65 original scenario questions. Domain split: 20 SECURE, 17
 * RESILIENT, 16 PERF, 12 COST. 30 isTeaser. Not copied from any
 * third-party bank.
 */
import { QType } from '@prisma/client';
import { Q, opts4, opts5, SECURE, RESILIENT, PERF, COST, REF } from './types';

export const P5: Q[] = [
  // ───────────────────────── SECURE (20) ─────────────────────────
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application running on Amazon EC2 needs to read objects from an S3 bucket and put items into a DynamoDB table. The development team has hard-coded long-lived IAM user access keys into the application configuration. A solutions architect must eliminate the static credentials while preserving the application’s access. What should the architect do?',
    options: opts4(
      'Create an IAM role with the required permissions and attach it to the EC2 instances using an instance profile.',
      'Store the IAM user access keys in AWS Secrets Manager and have the application fetch them at startup.',
      'Rotate the IAM user access keys every 24 hours with a scheduled AWS Lambda function.',
      'Encrypt the access keys with AWS KMS and decrypt them at runtime within the application.'
    ),
    correct: ['a'],
    explanation: 'An IAM role attached via an instance profile supplies temporary, automatically rotated credentials through the instance metadata service, removing the need for any static keys. Storing, rotating, or encrypting long-lived user keys still leaves persistent credentials that must be managed and can be exfiltrated.',
    references: [REF.IAM_ROLES]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company has an AWS Organization. An IAM policy attached to a developer grants s3:* on a bucket, but an SCP applied to the developer’s OU allows only ec2:* and s3:GetObject. A resource-based bucket policy explicitly allows s3:PutObject for the developer’s principal. When the developer attempts s3:PutObject, what is the result?',
    options: opts4(
      'Allowed, because the bucket policy explicitly allows the action.',
      'Denied, because the SCP does not permit s3:PutObject, so the action is implicitly denied at the organization boundary.',
      'Allowed, because the identity-based policy grants s3:*.',
      'Denied, because resource-based policies always take precedence over identity-based policies.'
    ),
    correct: ['b'],
    explanation: 'An SCP sets the maximum available permissions for member-account principals. Because the SCP does not include s3:PutObject, the action is effectively denied regardless of what identity- or resource-based policies allow. SCPs filter permissions before the normal allow/deny evaluation.',
    references: [REF.ORGANIZATIONS_SCP, REF.IAM_POLICY_EVAL]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A team in Account A must let an application in Account B read files from an S3 bucket in Account A. Security requires that access be auditable and use temporary credentials, with no long-lived keys shared between accounts. Which solution meets these requirements?',
    options: opts4(
      'Create an IAM role in Account A trusting Account B, grant the role read access to the bucket, and have the Account B application call sts:AssumeRole.',
      'Create an IAM user in Account A, generate access keys, and store them in the Account B application.',
      'Make the S3 bucket public and restrict it with a bucket policy condition on Account B’s VPC ID.',
      'Enable S3 Cross-Region Replication from Account A to Account B.'
    ),
    correct: ['a'],
    explanation: 'A cross-account IAM role with a trust policy for Account B lets the Account B application call AssumeRole to obtain short-lived STS credentials; the calls are recorded in CloudTrail for auditing. Sharing IAM user keys uses long-lived credentials, public buckets are insecure, and replication copies data rather than granting access.',
    references: [REF.IAM_ROLES],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company stores database credentials that must be automatically rotated every 30 days without application downtime, and the rotation logic should be managed by AWS for Amazon RDS. Which service should the solutions architect use?',
    options: opts4(
      'AWS Secrets Manager with the built-in RDS rotation function.',
      'AWS Systems Manager Parameter Store SecureString parameters.',
      'AWS KMS with automatic key rotation enabled.',
      'Amazon S3 with server-side encryption and object versioning.'
    ),
    correct: ['a'],
    explanation: 'Secrets Manager provides native, scheduled rotation for Amazon RDS credentials using AWS-managed Lambda rotation functions, so credentials change without application changes. Parameter Store does not rotate secrets natively, and KMS key rotation rotates encryption keys, not database passwords.',
    references: [REF.SECRETS_MANAGER],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A security team must ensure that newly created IAM roles delegated to developers can never grant permissions broader than a defined baseline, even if a developer attaches a more permissive policy. Which IAM feature enforces this maximum?',
    options: opts4(
      'A permissions boundary attached to the roles the developers create.',
      'An IAM group with a deny-all policy.',
      'An inline policy on each developer’s IAM user.',
      'An IAM Access Analyzer archive rule.'
    ),
    correct: ['a'],
    explanation: 'A permissions boundary is a managed policy that defines the maximum permissions an identity-based policy can grant to an IAM entity. Even if a developer attaches a broader policy, the effective permissions are the intersection of the boundary and the attached policies. Groups, inline policies, and Access Analyzer do not impose a permission ceiling.',
    references: [REF.IAM_POLICY_EVAL]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A public-facing web application behind an Application Load Balancer is being targeted by SQL injection and cross-site scripting attempts, plus a burst of requests from a single IP range. Which AWS service should be deployed to mitigate these application-layer threats?',
    options: opts4(
      'AWS WAF with managed SQLi/XSS rule groups and a rate-based rule, associated with the ALB.',
      'AWS Shield Standard with a custom mitigation profile.',
      'Amazon GuardDuty with S3 protection enabled.',
      'Network ACLs that block the offending IP range.'
    ),
    correct: ['a'],
    explanation: 'AWS WAF inspects HTTP(S) requests and supports managed rule groups for SQL injection and XSS as well as rate-based rules to throttle abusive source IPs, and it can be associated directly with an ALB. Shield Standard addresses network/transport DDoS, GuardDuty is threat detection, and NACLs are coarse and stateless.',
    references: [REF.WAF],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A compliance mandate requires that an S3 bucket be encrypted with a key that the company fully controls, including the ability to disable the key and audit every cryptographic use. Which encryption option meets these requirements?',
    options: opts4(
      'SSE-KMS using a customer managed key (CMK).',
      'SSE-S3 using Amazon S3 managed keys.',
      'Client-side encryption with no key management.',
      'SSE-KMS using the AWS managed aws/s3 key.'
    ),
    correct: ['a'],
    explanation: 'A customer managed KMS key lets the company control the key policy, enable/disable and schedule deletion, and every encrypt/decrypt call is logged in CloudTrail. SSE-S3 and the AWS managed aws/s3 key do not allow disabling the key or applying a custom key policy with full audit control.',
    references: [REF.KMS],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'A bucket policy must allow access only to principals that belong to the company’s AWS Organization, regardless of which member account they are in, and must continue to work as new accounts join. Which policy condition key should be used?',
    options: opts4(
      'aws:PrincipalOrgID matched against the organization ID.',
      'aws:SourceVpc matched against each account’s VPC.',
      'aws:PrincipalAccount listing every member account ID.',
      'aws:userid matched against each IAM user ID.'
    ),
    correct: ['a'],
    explanation: 'The aws:PrincipalOrgID condition key restricts access to principals in any account that is a member of the specified AWS Organization, and it automatically covers new accounts without policy edits. Listing account IDs requires constant maintenance, and the other keys do not scope to the organization.',
    references: [REF.ORGANIZATIONS_SCP],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must give a mobile application secure, scalable user sign-up and sign-in with support for social identity providers, and then exchange the resulting tokens for temporary AWS credentials to call Amazon S3. Which combination should be used?',
    options: opts4(
      'Amazon Cognito user pools for authentication and Cognito identity pools for temporary AWS credentials.',
      'IAM users created per mobile user with access keys distributed in the app.',
      'AWS IAM Identity Center with SAML assertions embedded in the app.',
      'AWS Directory Service with a trust to an on-premises domain.'
    ),
    correct: ['a'],
    explanation: 'Cognito user pools provide managed user directories with social and SAML federation, and Cognito identity pools exchange the authenticated tokens for scoped temporary AWS credentials via STS. Embedding IAM user keys in apps is insecure, and Identity Center/Directory Service target workforce or directory scenarios, not consumer mobile apps.',
    references: [{ label: 'Amazon Cognito — Developer Guide', url: 'https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html' }]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A company wants continuous detection of potentially malicious activity and unauthorized behavior across its AWS accounts, plus discovery and classification of sensitive personally identifiable information stored in Amazon S3. Which two services should the solutions architect use? (Choose two.)',
    options: opts5(
      'Amazon GuardDuty for intelligent threat detection from CloudTrail, VPC Flow Logs, and DNS logs.',
      'Amazon Macie for automated discovery and classification of sensitive data in S3.',
      'AWS Trusted Advisor for sensitive data classification.',
      'Amazon Inspector for S3 PII discovery.',
      'AWS Config for malicious-IP threat intelligence.'
    ),
    correct: ['a', 'b'],
    explanation: 'GuardDuty continuously analyzes CloudTrail, VPC Flow Logs, and DNS logs to surface threats, while Macie uses machine learning to discover and classify sensitive data such as PII in S3. Trusted Advisor gives best-practice checks, Inspector assesses workload vulnerabilities, and Config tracks resource configuration.',
    references: [{ label: 'Amazon GuardDuty — User Guide', url: 'https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html' }, { label: 'Amazon Macie — User Guide', url: 'https://docs.aws.amazon.com/macie/latest/user/what-is-macie.html' }],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'EC2 instances in a private subnet must reach Amazon S3 without traversing the public internet, and a security requirement states that only a specific bucket may be accessed through that path. Which two actions together meet these requirements? (Choose two.)',
    options: opts5(
      'Create an S3 gateway VPC endpoint and update the route tables for the private subnets.',
      'Attach an endpoint policy to the gateway endpoint that allows access only to the specific bucket ARN.',
      'Route S3 traffic through a NAT gateway and restrict the source IP in a bucket policy.',
      'Enable S3 Transfer Acceleration and restrict it with an IAM policy.',
      'Assign public IP addresses to the instances and use a security group rule for S3.'
    ),
    correct: ['a', 'b'],
    explanation: 'A gateway VPC endpoint with the private subnet route tables updated keeps S3 traffic on the AWS network without internet egress, and an endpoint policy scopes access to a specific bucket ARN. A NAT gateway still uses the public S3 endpoint, Transfer Acceleration is a performance feature, and public IPs defeat the private requirement.',
    references: [REF.GATEWAY_ENDPOINT, REF.VPC_ENDPOINTS]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A security review found an S3 bucket that should never be public but had an ACL granting public read. The team wants an account-wide guardrail that prevents any bucket or object from being made public via ACLs or policies. What should the solutions architect enable?',
    options: opts4(
      'S3 Block Public Access at the account level.',
      'S3 Object Lock in governance mode.',
      'S3 Versioning with MFA delete.',
      'Default SSE-KMS encryption on all buckets.'
    ),
    correct: ['a'],
    explanation: 'S3 Block Public Access, applied at the account level, overrides and blocks public access granted through ACLs or bucket policies for all current and future buckets. Object Lock, versioning, and default encryption protect data integrity or confidentiality but do not prevent public exposure.',
    references: [{ label: 'Amazon S3 — Blocking public access', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html' }],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An administrator must be required to authenticate with MFA before being allowed to terminate EC2 instances, while still permitting describe actions without MFA. Which approach implements this?',
    options: opts4(
      'Add an IAM policy statement that denies ec2:TerminateInstances when aws:MultiFactorAuthPresent is false.',
      'Disable the administrator’s console password and require access keys only.',
      'Attach a permissions boundary that removes all EC2 permissions.',
      'Enable AWS Config rules to detect terminations after they occur.'
    ),
    correct: ['a'],
    explanation: 'A conditional Deny on ec2:TerminateInstances with aws:MultiFactorAuthPresent set to false forces MFA for that sensitive action while leaving non-conditioned describe actions available. Removing permissions or detecting actions after the fact does not provide the conditional MFA enforcement required.',
    references: [REF.IAM_POLICY_EVAL]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A regulated workload requires that the same KMS-protected data be decryptable in two AWS Regions for disaster recovery, using a single logical key identity so that ciphertext encrypted in one Region can be decrypted in the other. Which KMS capability meets this?',
    options: opts4(
      'AWS KMS multi-Region keys.',
      'AWS KMS automatic annual key rotation.',
      'AWS KMS grants with a Region condition.',
      'Importing the same key material into two independent single-Region keys and managing them separately.'
    ),
    correct: ['a'],
    explanation: 'Multi-Region keys are interoperable KMS keys with the same key ID and key material in multiple Regions, so ciphertext produced in one Region can be decrypted by the replica in another. Key rotation and grants do not provide cross-Region interoperability, and separately imported keys are not the same logical key.',
    references: [REF.KMS]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company must encrypt traffic between clients and an Application Load Balancer using TLS, and wants AWS to manage certificate issuance and renewal at no additional certificate cost. Which service should be used?',
    options: opts4(
      'AWS Certificate Manager (ACM) to provision and auto-renew a public certificate on the ALB listener.',
      'AWS KMS to generate and serve the TLS certificate.',
      'AWS Secrets Manager to store a self-signed certificate.',
      'Amazon CloudFront field-level encryption.'
    ),
    correct: ['a'],
    explanation: 'ACM issues public TLS certificates at no cost and automatically renews them, and the certificate can be attached directly to the ALB HTTPS listener. KMS manages encryption keys, Secrets Manager stores secrets, and field-level encryption protects specific fields, not the TLS handshake.',
    references: [{ label: 'AWS Certificate Manager — User Guide', url: 'https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html' }],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'After a security incident, investigators need to visualize relationships and analyze the root cause across CloudTrail and GuardDuty findings spanning multiple accounts over time, without building their own data pipeline. Which service is purpose-built for this analysis?',
    options: opts4(
      'Amazon Detective.',
      'Amazon Inspector.',
      'AWS Config aggregator.',
      'Amazon Macie.'
    ),
    correct: ['a'],
    explanation: 'Amazon Detective automatically builds a linked behavior graph from CloudTrail, VPC Flow Logs, and GuardDuty findings to support security investigation and root-cause analysis across accounts and time. Inspector scans for vulnerabilities, Config tracks configuration, and Macie classifies sensitive data.',
    references: [{ label: 'Amazon Detective — Administration Guide', url: 'https://docs.aws.amazon.com/detective/latest/adminguide/what-is-detective.html' }]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect needs a record of every API call made in an AWS account, including the identity, source IP, and parameters, delivered to a tamper-resistant S3 bucket for compliance audits. Which service provides this?',
    options: opts4(
      'AWS CloudTrail with a trail delivering logs to an S3 bucket protected by Object Lock.',
      'Amazon CloudWatch metrics with detailed monitoring.',
      'AWS Config configuration history.',
      'VPC Flow Logs to CloudWatch Logs.'
    ),
    correct: ['a'],
    explanation: 'CloudTrail records management and data API activity with identity, source IP, and request parameters and can deliver immutable logs to an S3 bucket with Object Lock for compliance. CloudWatch metrics, Config, and VPC Flow Logs do not capture full API call detail with caller identity.',
    references: [{ label: 'AWS CloudTrail — User Guide', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html' }],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A SaaS provider must let each customer grant the provider’s account access to resources in the customer’s account while preventing the confused deputy problem. Which mechanism should the cross-account role’s trust policy enforce?',
    options: opts4(
      'Require a unique sts:ExternalId in the AssumeRole trust policy for each customer.',
      'Require the customer to share IAM user access keys with the provider.',
      'Require the provider to use the customer’s root account credentials.',
      'Require an aws:SourceArn condition pointing at the provider’s S3 bucket.'
    ),
    correct: ['a'],
    explanation: 'The sts:ExternalId condition in the role trust policy ensures the provider can assume the customer role only when presenting the agreed external ID, mitigating the confused deputy problem in third-party cross-account access. Sharing keys or root credentials is insecure, and aws:SourceArn here does not address the SaaS AssumeRole pattern.',
    references: [REF.IAM_ROLES]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A team stores non-secret configuration values (feature flags, endpoint URLs) and a few database passwords. They want a free option for plaintext config and managed rotation only for the passwords. Which combination is most cost-effective and appropriate?',
    options: opts4(
      'Use Systems Manager Parameter Store standard parameters for config and AWS Secrets Manager for the rotated database passwords.',
      'Store everything in AWS Secrets Manager with rotation enabled on all values.',
      'Store everything in Parameter Store SecureString parameters and write a custom rotation Lambda.',
      'Hard-code config in the application and store passwords in S3.'
    ),
    correct: ['a'],
    explanation: 'Parameter Store standard parameters are free and ideal for non-secret configuration, while Secrets Manager provides native managed rotation for the database passwords. Putting everything in Secrets Manager adds per-secret cost for non-secrets, and a custom rotation Lambda duplicates managed functionality.',
    references: [REF.SECRETS_MANAGER]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect must prevent any principal in member accounts from disabling AWS CloudTrail or deleting trails, and the control must apply even to account administrators. Which control should be implemented?',
    options: opts4(
      'An AWS Organizations SCP that denies cloudtrail:StopLogging and cloudtrail:DeleteTrail.',
      'An IAM policy attached to each administrator user denying CloudTrail changes.',
      'A CloudWatch alarm that re-enables CloudTrail when it is stopped.',
      'A permissions boundary on the CloudTrail service role.'
    ),
    correct: ['a'],
    explanation: 'An SCP applies an organization-wide guardrail that even account administrators cannot override, so denying CloudTrail stop/delete actions enforces the control globally. Per-user IAM policies can be removed by other admins, an alarm only reacts after the fact, and a service-role boundary does not constrain human principals.',
    references: [REF.ORGANIZATIONS_SCP],
    isTeaser: true
  },

  // ───────────────────────── RESILIENT (17) ─────────────────────────
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company runs a critical Amazon RDS for PostgreSQL database. It must remain available with automatic failover if an Availability Zone fails, with no application reconfiguration during failover. Which configuration meets this requirement?',
    options: opts4(
      'Deploy the RDS instance in a Multi-AZ configuration.',
      'Create a read replica in a second Availability Zone and promote it manually on failure.',
      'Take automated snapshots every hour and restore on failure.',
      'Use a single-AZ instance with an Elastic IP for fast DNS updates.'
    ),
    correct: ['a'],
    explanation: 'RDS Multi-AZ maintains a synchronous standby in another AZ and performs automatic failover by switching the DNS endpoint, requiring no application changes. Read replicas need manual promotion, snapshots involve restore time, and a single-AZ instance is not highly available.',
    references: [REF.RDS_MULTI_AZ],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A stateless web tier behind an Application Load Balancer must automatically replace unhealthy instances and maintain capacity across three Availability Zones during an AZ outage. Which design provides this resilience?',
    options: opts4(
      'An EC2 Auto Scaling group spanning three AZs with ELB health checks and a minimum capacity that tolerates one AZ loss.',
      'A single large EC2 instance with an Elastic IP and a CloudWatch recovery alarm.',
      'Three standalone EC2 instances, one per AZ, registered manually with the ALB.',
      'A spot fleet in one AZ with on-demand fallback.'
    ),
    correct: ['a'],
    explanation: 'An Auto Scaling group across three AZs with ELB health checks automatically terminates and replaces unhealthy instances and redistributes capacity if an AZ fails, provided minimum capacity accounts for losing one AZ. A single instance or manually registered instances do not self-heal or scale.',
    references: [REF.AUTOSCALING, REF.ALB],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A solutions architect is decoupling a synchronous order-processing system so that a spike in orders does not overwhelm downstream workers and no order is lost if a worker crashes mid-processing. Which two AWS features should be used? (Choose two.)',
    options: opts5(
      'Amazon SQS to buffer orders between the front end and workers.',
      'An SQS visibility timeout and dead-letter queue to handle failed processing.',
      'Amazon SNS fan-out as the only durable store for orders.',
      'A single EC2 instance polling a database table in a tight loop.',
      'Synchronous API calls with client-side retries only.'
    ),
    correct: ['a', 'b'],
    explanation: 'An SQS queue buffers bursts so workers consume at their own rate, and a visibility timeout plus dead-letter queue ensure a message becomes visible again (or is isolated) if a worker crashes, preventing loss. SNS alone is not a durable work queue, and the other options reintroduce tight coupling and single points of failure.',
    references: [REF.SQS],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'A globally distributed application uses Amazon DynamoDB and must remain writable in multiple Regions even if an entire Region becomes unavailable, with low-latency local reads and writes. Which DynamoDB feature meets this requirement?',
    options: opts4(
      'DynamoDB global tables with multi-Region, multi-active replication.',
      'DynamoDB Accelerator (DAX) clusters in each Region.',
      'On-demand backups copied to another Region.',
      'A single-Region table with global secondary indexes.'
    ),
    correct: ['a'],
    explanation: 'Global tables provide multi-Region, multi-active replication so the application can read and write in any Region and survive a Region failure with local latency. DAX is a read cache, backups are not live failover, and a single-Region table has no cross-Region resilience.',
    references: [REF.DYNAMODB]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company must protect critical security audit logs in S3 so that even an administrator with full S3 permissions cannot delete or overwrite them for a 7-year retention period. Which solution enforces this immutability?',
    options: opts4(
      'Enable S3 Object Lock in compliance mode with a 7-year retention period.',
      'Apply a bucket policy denying s3:DeleteObject to all users.',
      'Enable S3 Versioning and lifecycle expiration after 7 years.',
      'Move the logs to S3 Glacier Deep Archive.'
    ),
    correct: ['a'],
    explanation: 'Object Lock in compliance mode prevents any user, including the root account, from deleting or overwriting locked object versions until the retention period expires, satisfying WORM compliance. A bucket policy can be changed, versioning alone allows deletes of versions by privileged users, and storage class does not enforce immutability.',
    references: [REF.S3_OBJECT_LOCK],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect needs an automated, centralized backup solution that protects EBS volumes, RDS databases, and DynamoDB tables on a defined schedule, with cross-Region copy for disaster recovery and policy-based retention. Which service should be used?',
    options: opts4(
      'AWS Backup with backup plans and cross-Region copy rules.',
      'Manual EBS snapshots scheduled with cron on each instance.',
      'S3 Cross-Region Replication of all data stores.',
      'AWS DataSync scheduled tasks.'
    ),
    correct: ['a'],
    explanation: 'AWS Backup centrally orchestrates scheduled backups across EBS, RDS, DynamoDB, and more, with policy-based retention and cross-Region copy for disaster recovery. Manual snapshots are error-prone, replication and DataSync target object/file movement rather than coordinated multi-service backup.',
    references: [REF.BACKUP]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An online application must fail over to a static maintenance page hosted in S3 if the primary ALB endpoint becomes unhealthy, with automatic DNS-level switching. Which Route 53 configuration achieves this?',
    options: opts4(
      'A failover routing policy with a health check on the primary ALB and the S3 static site as the secondary record.',
      'A weighted routing policy splitting 50/50 between the ALB and S3.',
      'A simple routing policy with multiple values returned.',
      'A latency-based routing policy across two Regions.'
    ),
    correct: ['a'],
    explanation: 'Route 53 failover routing with a health check on the primary endpoint automatically returns the secondary record (the S3 static site) when the primary is unhealthy. Weighted, multivalue, and latency policies distribute traffic but do not provide active-passive failover keyed to a health check.',
    references: [REF.ROUTE53],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A shared content management system needs a file system that multiple EC2 instances across several Availability Zones can mount concurrently, with automatic scaling and high availability. Which storage service should be used?',
    options: opts4(
      'Amazon EFS mounted from instances in all Availability Zones.',
      'A single Amazon EBS volume attached to one instance and shared via NFS.',
      'Amazon S3 mounted as a block device.',
      'Instance store volumes synchronized with a cron job.'
    ),
    correct: ['a'],
    explanation: 'Amazon EFS is a fully managed, multi-AZ NFS file system that many EC2 instances can mount concurrently with elastic capacity and high availability. A single EBS volume cannot be shared across AZs in this scenario, S3 is object storage, and instance store is ephemeral.',
    references: [REF.EFS]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company’s disaster recovery plan requires an RTO of a few minutes and an RPO of seconds for a relational workload, while keeping standby costs lower than running a full duplicate fleet. Which AWS approach best fits?',
    options: opts4(
      'A warm standby in a second Region with Aurora global database and scaled-down compute that can scale up on failover.',
      'Backup and restore from snapshots only.',
      'A pilot light with the database powered off until a disaster.',
      'Multi-site active-active with full production capacity in both Regions at all times.'
    ),
    correct: ['a'],
    explanation: 'A warm standby with an Aurora global database keeps a continuously replicated, running-but-scaled-down environment that meets a few-minutes RTO and seconds RPO at lower cost than active-active. Backup/restore and pilot light have longer RTO, and active-active is the most expensive option.',
    references: [REF.AURORA]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A payment microservice publishes events that must reach several independent subscribers (fraud check, ledger, notifications) reliably, where each subscriber processes at its own pace and a slow subscriber must not block the others. Which architecture should the solutions architect use?',
    options: opts4(
      'Amazon SNS topic fanning out to a separate Amazon SQS queue per subscriber.',
      'A single SQS queue shared by all subscribers.',
      'Direct synchronous HTTP calls from the payment service to each subscriber.',
      'Writing events to a single DynamoDB item polled by all subscribers.'
    ),
    correct: ['a'],
    explanation: 'SNS-to-SQS fan-out delivers each event to a dedicated queue per subscriber so each consumer processes independently and durably, isolating slow or failed subscribers. A shared queue causes contention, synchronous calls couple the services, and a single item is a bottleneck.',
    references: [REF.SNS, REF.SQS],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An IAM access key used by an automated job was accidentally committed to a public code repository. To restore a secure, resilient operating state quickly while keeping the job running, which sequence is best?',
    options: opts4(
      'Deactivate and delete the exposed key, migrate the job to an IAM role, then review CloudTrail for misuse.',
      'Rotate the key to a new access key and continue using long-lived keys.',
      'Apply a deny policy only on weekends and keep the key active otherwise.',
      'Wait for GuardDuty to confirm misuse before taking action.'
    ),
    correct: ['a'],
    explanation: 'Immediately deactivating and deleting the exposed key stops further misuse, moving the job to an IAM role removes long-lived credentials for resilient operation, and CloudTrail review identifies any unauthorized activity. Merely rotating keeps static keys, delaying action increases risk, and a part-time deny is unsafe.',
    references: [REF.IAM_ROLES]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A Windows-based application requires a shared file system with SMB protocol support, Active Directory integration, and automatic multi-AZ failover for high availability. Which AWS service meets these requirements?',
    options: opts4(
      'Amazon FSx for Windows File Server in a Multi-AZ deployment.',
      'Amazon EFS with an SMB gateway.',
      'Amazon S3 with the File Gateway.',
      'Amazon FSx for Lustre.'
    ),
    correct: ['a'],
    explanation: 'FSx for Windows File Server provides native SMB, Active Directory integration, and a Multi-AZ option with automatic failover. EFS is NFS-based, S3 File Gateway is for hybrid object access, and FSx for Lustre targets high-performance compute, not Windows SMB shares.',
    references: [REF.FSX_WINDOWS]
  },
  {
    domain: RESILIENT,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'A workload runs on EC2 in two AZs behind an ALB. During scaling tests, sessions break whenever instances are replaced because session state is stored on local disk. The architect must make the tier resilient to instance loss without sticky sessions. What should be done?',
    options: opts4(
      'Externalize session state to Amazon ElastiCache (Redis) so any instance can serve any request.',
      'Enable ALB sticky sessions pinned to a single instance for the session lifetime.',
      'Increase the EBS volume size on each instance.',
      'Use a larger instance type to reduce the chance of failure.'
    ),
    correct: ['a'],
    explanation: 'Storing session state in a shared ElastiCache for Redis store makes the tier stateless so any instance can handle any request and instance replacement does not break sessions. Sticky sessions still lose state when the pinned instance fails, and larger disks or instances do not address the stateful design flaw.',
    references: [{ label: 'Amazon ElastiCache — User Guide', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html' }]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must protect against accidental deletion of objects in a critical S3 bucket while still allowing authorized lifecycle management. Which combination provides recoverability from accidental overwrites and deletes?',
    options: opts4(
      'Enable S3 Versioning so previous versions can be restored after overwrites or deletes.',
      'Disable bucket logging to reduce noise.',
      'Use a single storage class with no lifecycle rules.',
      'Replace the bucket with an EBS volume snapshot schedule.'
    ),
    correct: ['a'],
    explanation: 'S3 Versioning retains previous object versions and delete markers, so accidental overwrites or deletions can be reversed by restoring a prior version. Disabling logging, removing lifecycle rules, or switching to EBS does not provide object-level recovery for the bucket.',
    references: [{ label: 'Amazon S3 — Using versioning', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html' }],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An EC2-based batch system experiences total job loss when Spot Instances are reclaimed. The architect must keep using low-cost capacity while ensuring jobs are not lost on interruption. Which design change is most appropriate?',
    options: opts4(
      'Queue jobs in Amazon SQS and have Spot workers acknowledge messages only after a job completes, so reclaimed jobs return to the queue.',
      'Stop using Spot Instances entirely and run only On-Demand.',
      'Increase the Spot maximum price to avoid all interruptions.',
      'Store job progress only in instance memory for speed.'
    ),
    correct: ['a'],
    explanation: 'Decoupling with SQS and deleting messages only on successful completion means an interrupted Spot job’s message becomes visible again for another worker, preserving the job and the cost benefit of Spot. A higher max price does not guarantee no interruptions, and in-memory progress is lost on reclamation.',
    references: [REF.SQS]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A regulatory requirement states that database credentials used by an application must be retrievable during a Regional outage so the DR application can start. The primary credentials are in AWS Secrets Manager. What should the solutions architect configure?',
    options: opts4(
      'Enable Secrets Manager multi-Region (replica) secrets so the DR Region has a synchronized copy.',
      'Email the credentials to operators for manual entry during DR.',
      'Store the credentials in an EBS snapshot copied to the DR Region.',
      'Disable rotation so the credentials never change during an outage.'
    ),
    correct: ['a'],
    explanation: 'Secrets Manager replica secrets keep a synchronized copy of the secret in additional Regions, so the DR application can retrieve credentials even if the primary Region is unavailable. Manual handling is insecure and error-prone, snapshots are not the secret store, and disabling rotation weakens security.',
    references: [REF.SECRETS_MANAGER]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.MULTI,
    stem: 'A solutions architect must ensure that an Auto Scaling group continues to launch instances even if one Availability Zone runs out of capacity for the chosen instance type. Which two configurations improve resilience to AZ capacity constraints? (Choose two.)',
    options: opts5(
      'Configure the Auto Scaling group to span multiple Availability Zones.',
      'Use a mixed instances policy that allows multiple instance types.',
      'Pin the Auto Scaling group to a single AZ to simplify networking.',
      'Use a single instance type with a high desired capacity in one AZ.',
      'Disable health checks to avoid relaunching instances.'
    ),
    correct: ['a', 'b'],
    explanation: 'Spanning multiple AZs lets Auto Scaling fulfill capacity from other AZs when one is constrained, and a mixed instances policy allows substituting alternative instance types when the preferred type is unavailable. A single AZ or single instance type concentrates risk, and disabling health checks harms resilience.',
    references: [REF.AUTOSCALING]
  },

  // ───────────────────────── PERF (16) ─────────────────────────
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A read-heavy reporting workload on Amazon RDS for MySQL is saturating the primary instance with analytical SELECT queries, slowing down transactional traffic. Which solution improves read performance with minimal application change?',
    options: opts4(
      'Add RDS read replicas and direct reporting queries to the replica endpoint.',
      'Vertically scale the primary to the largest instance type indefinitely.',
      'Convert the database to a single-AZ deployment.',
      'Store all report results in instance memory only.'
    ),
    correct: ['a'],
    explanation: 'RDS read replicas offload read-heavy reporting queries from the primary, improving overall performance while transactional traffic continues on the primary. Endless vertical scaling is costly and limited, single-AZ reduces availability, and in-memory-only storage is not durable.',
    references: [REF.RDS_READ_REPLICA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A global static and dynamic website experiences high latency for users far from the origin in us-east-1, and the security team also wants TLS termination and WAF inspection at the edge. Which service addresses both latency and edge security?',
    options: opts4(
      'Amazon CloudFront with an attached AWS WAF web ACL.',
      'An Application Load Balancer in every Region.',
      'Amazon S3 Transfer Acceleration only.',
      'A larger EC2 instance type at the origin.'
    ),
    correct: ['a'],
    explanation: 'CloudFront caches and accelerates content from edge locations close to users and supports TLS termination plus AWS WAF integration for edge security inspection. Regional ALBs do not provide a global CDN, Transfer Acceleration only speeds S3 uploads/downloads, and a bigger origin instance does not solve global latency.',
    references: [REF.CLOUDFRONT, REF.WAF],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A DynamoDB-backed application serving a viral feature experiences microsecond-latency read requirements and repeated hot-key reads that exceed table read capacity. Which solution best improves read performance?',
    options: opts4(
      'Add a DynamoDB Accelerator (DAX) cluster in front of the table for in-memory caching.',
      'Increase the table’s number of global secondary indexes.',
      'Switch the table to provisioned capacity with no caching.',
      'Enable DynamoDB Streams to serve reads.'
    ),
    correct: ['a'],
    explanation: 'DAX is a fully managed, in-memory cache for DynamoDB that delivers microsecond read latency and absorbs repeated hot-key reads, reducing pressure on the table. Adding GSIs, changing capacity mode, or using Streams does not provide a read-through microsecond cache.',
    references: [REF.DYNAMODB]
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A media company must transfer 80 TB of data from an on-premises data center to Amazon S3 within a few days, but its internet link would take weeks to upload that volume. Which approach should the solutions architect recommend?',
    options: opts4(
      'Use AWS Snowball Edge to ship the data and import it into S3.',
      'Use AWS DataSync over the existing internet link.',
      'Use multipart upload directly over the internet.',
      'Use S3 Transfer Acceleration over the existing internet link.'
    ),
    correct: ['a'],
    explanation: 'When the available bandwidth makes online transfer impractical for tens of terabytes in a tight deadline, AWS Snowball Edge provides physical, secure offline transfer into S3. DataSync, multipart upload, and Transfer Acceleration still rely on the constrained internet link.',
    references: [REF.SNOWBALL],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A high-performance computing workload needs a shared file system that delivers hundreds of GB/s throughput and sub-millisecond latencies, integrated with S3 for input and output datasets. Which storage service is most appropriate?',
    options: opts4(
      'Amazon FSx for Lustre linked to an S3 bucket.',
      'Amazon EFS in General Purpose mode.',
      'Amazon S3 accessed directly by every node.',
      'Amazon EBS gp2 volumes attached to each node.'
    ),
    correct: ['a'],
    explanation: 'FSx for Lustre is built for HPC and machine learning, offering very high throughput and sub-millisecond latency, and it can transparently link to an S3 bucket for input/output data. EFS, direct S3, and per-node EBS do not match Lustre’s HPC performance profile.',
    references: [REF.FSX_LUSTRE]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect must run an ad hoc SQL analysis over hundreds of gigabytes of JSON logs stored in S3 without provisioning or managing any servers, paying only for data scanned. Which service should be used?',
    options: opts4(
      'Amazon Athena querying the data directly in S3.',
      'A large Amazon EMR cluster running continuously.',
      'An Amazon RDS instance after importing all logs.',
      'An EC2 instance running a custom log parser.'
    ),
    correct: ['a'],
    explanation: 'Amazon Athena is serverless and queries data directly in S3 using SQL, charging per amount of data scanned, which is ideal for ad hoc analysis with no infrastructure to manage. EMR, RDS import, and a custom EC2 parser all require provisioning and ongoing management.',
    references: [REF.ATHENA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A non-HTTP TCP application requires ultra-low latency load balancing, the ability to handle millions of requests per second, and preservation of the client source IP for backend security logging. Which load balancer should be used?',
    options: opts4(
      'A Network Load Balancer.',
      'An Application Load Balancer.',
      'A Gateway Load Balancer.',
      'A Classic Load Balancer with HTTP listeners.'
    ),
    correct: ['a'],
    explanation: 'The Network Load Balancer operates at Layer 4 with ultra-low latency, scales to millions of requests per second, and preserves the client source IP for backend logging and security controls. ALB is Layer 7 HTTP, Gateway Load Balancer fronts virtual appliances, and Classic is legacy.',
    references: [REF.NLB]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect must enforce centralized rate limiting and JWT-based authorization for a serverless REST API built on AWS Lambda, while improving performance for repeated GET requests. Which managed service provides these capabilities?',
    options: opts4(
      'Amazon API Gateway with usage plans/throttling, a JWT authorizer, and response caching.',
      'An Application Load Balancer invoking Lambda directly with no caching.',
      'Amazon CloudFront with a Lambda@Edge function as the API.',
      'A self-managed NGINX proxy on EC2.'
    ),
    correct: ['a'],
    explanation: 'API Gateway natively provides request throttling and usage plans, JWT/Lambda authorizers for authorization, and built-in response caching to accelerate repeated GETs, all as a managed service in front of Lambda. The other options lack one or more of these integrated capabilities or add operational burden.',
    references: [REF.API_GATEWAY, REF.LAMBDA]
  },
  {
    domain: PERF,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'A global TCP-based gaming backend must give players the lowest possible latency by routing them over the AWS global network to the nearest healthy Regional endpoint, with fast failover and static anycast IP addresses. Which service should be used?',
    options: opts4(
      'AWS Global Accelerator with endpoint groups in multiple Regions.',
      'Amazon CloudFront distributions in each Region.',
      'Route 53 simple routing with multiple A records.',
      'A single Network Load Balancer in one Region.'
    ),
    correct: ['a'],
    explanation: 'Global Accelerator provides static anycast IPs and routes traffic over the AWS backbone to the closest healthy Regional endpoint with fast failover, which suits latency-sensitive TCP/UDP workloads like gaming. CloudFront is optimized for HTTP content delivery, simple Route 53 routing lacks health-based proximity steering, and one NLB is single-Region.',
    references: [REF.GLOBAL_ACCELERATOR]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A web tier behind an Application Load Balancer must automatically scale out before users experience slowness during predictable morning traffic surges and unpredictable spikes. Which two scaling configurations should the solutions architect combine? (Choose two.)',
    options: opts5(
      'Target tracking scaling on average request count or CPU to react to demand.',
      'Scheduled scaling to pre-warm capacity before the known morning surge.',
      'Manual capacity changes performed by an operator each morning.',
      'A fixed desired capacity sized for peak at all hours.',
      'Disabling health checks to keep instances in service longer.'
    ),
    correct: ['a', 'b'],
    explanation: 'Target tracking automatically adjusts capacity to keep a metric near a target during unpredictable spikes, while scheduled scaling pre-provisions capacity ahead of the known morning surge so users are not affected during scale-out. Manual changes are slow, fixed peak capacity wastes money, and disabling health checks harms reliability.',
    references: [REF.AUTOSCALING],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A high-volume clickstream pipeline must ingest millions of events per second in real time. Which two characteristics make Amazon Kinesis Data Streams the appropriate choice for this requirement? (Choose two.)',
    options: opts5(
      'It supports high-throughput real-time ingestion partitioned across shards.',
      'It retains records for a configurable period so consumers can replay data.',
      'It guarantees exactly-once delivery with no consumer-side deduplication ever needed.',
      'It automatically loads records into Amazon Redshift with no configuration.',
      'It permanently stores all records indefinitely at no additional cost.'
    ),
    correct: ['a', 'b'],
    explanation: 'Kinesis Data Streams scales throughput by adding shards for high-volume real-time ingestion and retains records for a configurable retention period so multiple consumers can independently read and replay the ordered stream. It does not guarantee exactly-once without consumer logic, does not natively load Redshift (that is Firehose), and retention is not unlimited or free.',
    references: [REF.KINESIS]
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A relational application has a database tier that is mostly idle but must handle unpredictable, infrequent bursts of traffic, and the team wants automatic capacity scaling without managing instance sizes. Which option best meets the performance and operational goals?',
    options: opts4(
      'Amazon Aurora Serverless v2, which automatically scales database capacity with demand.',
      'A fixed large Aurora provisioned instance running continuously.',
      'A DynamoDB table with provisioned capacity sized for peak.',
      'An EC2-hosted database with manual scaling scripts.'
    ),
    correct: ['a'],
    explanation: 'Aurora Serverless v2 automatically and rapidly scales database compute capacity up and down to match variable, unpredictable load without manual instance sizing, fitting an intermittently bursty relational workload. A fixed large instance overprovisions, DynamoDB is non-relational, and self-managed scaling adds operational burden.',
    references: [REF.AURORA]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect must reduce read latency for a global audience accessing relatively static product images stored in S3, while keeping the origin private so users cannot bypass the CDN. Which configuration meets both goals?',
    options: opts4(
      'Serve images through Amazon CloudFront using an origin access control that restricts the S3 bucket to CloudFront only.',
      'Make the S3 bucket public and share the website endpoint directly.',
      'Place an NLB in front of the S3 bucket.',
      'Enable S3 Transfer Acceleration and distribute the accelerated endpoint.'
    ),
    correct: ['a'],
    explanation: 'CloudFront caches images at edge locations for low global latency, and origin access control locks the S3 bucket so it is reachable only through CloudFront, preventing origin bypass. A public bucket exposes the origin, NLB does not front S3, and Transfer Acceleration does not provide CDN caching or origin protection.',
    references: [REF.CLOUDFRONT],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A latency-sensitive transactional database on EC2 needs consistent single-digit-millisecond block storage performance with the highest IOPS, independent of volume size. Which EBS volume type should be selected?',
    options: opts4(
      'Provisioned IOPS SSD (io2 Block Express).',
      'Throughput Optimized HDD (st1).',
      'Cold HDD (sc1).',
      'General Purpose SSD (gp2) at minimum size.'
    ),
    correct: ['a'],
    explanation: 'Provisioned IOPS SSD (io2 Block Express) delivers high, consistent IOPS and low latency that can be provisioned independently of volume size, making it ideal for latency-sensitive transactional databases. HDD types are throughput-oriented with low IOPS, and minimum-size gp2 limits baseline performance.',
    references: [REF.EBS]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect wants to offload TLS decryption and absorb large request volumes at the edge to reduce load on origin servers, while caching authorized API responses near users. Which service provides edge caching and TLS offload closest to end users?',
    options: opts4(
      'Amazon CloudFront.',
      'An internal Application Load Balancer.',
      'Amazon Route 53 health checks.',
      'AWS Direct Connect.'
    ),
    correct: ['a'],
    explanation: 'CloudFront terminates TLS at edge locations, caches responses close to users, and absorbs request volume before traffic reaches the origin, improving performance and reducing origin load. An internal ALB is Regional, Route 53 health checks affect DNS responses, and Direct Connect is private connectivity, not edge caching.',
    references: [REF.CLOUDFRONT]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect needs to deliver near-real-time streaming data into Amazon S3 and Amazon Redshift with automatic buffering, compression, and no stream-consumer code to maintain. Which service is the best fit?',
    options: opts4(
      'Amazon Data Firehose with delivery to S3 and Redshift.',
      'Amazon Kinesis Data Streams with a custom consumer application.',
      'Amazon SQS with a Lambda poller.',
      'AWS Glue scheduled batch jobs.'
    ),
    correct: ['a'],
    explanation: 'Amazon Data Firehose is a fully managed delivery service that buffers, optionally compresses/transforms, and loads streaming data into destinations like S3 and Redshift with no consumer code to operate. Kinesis Data Streams requires a custom consumer, SQS is not a streaming-delivery service, and Glue jobs are batch-oriented.',
    references: [REF.FIREHOSE]
  },

  // ───────────────────────── COST (12) ─────────────────────────
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company runs a steady-state production workload on EC2 24/7 for at least the next three years and wants the largest possible discount with the flexibility to change instance families and Regions. Which purchasing option is most cost-effective?',
    options: opts4(
      'Compute Savings Plans with a 3-year commitment.',
      'On-Demand Instances for all production capacity.',
      'Standard Reserved Instances locked to one instance type.',
      'Spot Instances for the production workload.'
    ),
    correct: ['a'],
    explanation: 'Compute Savings Plans provide deep discounts for a committed spend over 1 or 3 years while remaining flexible across instance families, sizes, Regions, and even Fargate/Lambda. On-Demand has no discount, standard RIs are less flexible, and Spot is unsuitable for steady production due to interruptions.',
    references: [REF.SAVINGS_PLANS],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'Logs in S3 are accessed frequently for 30 days, rarely for the next 60 days, and almost never afterward but must be retained for 7 years for compliance. The team wants to minimize storage cost without managing transitions manually. Which solution is best?',
    options: opts4(
      'An S3 Lifecycle policy transitioning objects from Standard to Standard-IA, then to Glacier Deep Archive, with expiration at 7 years.',
      'Keep all objects in S3 Standard for the full 7 years.',
      'Manually move objects between storage classes with a quarterly script.',
      'Store all logs in Amazon EBS snapshots.'
    ),
    correct: ['a'],
    explanation: 'An S3 Lifecycle policy automatically transitions objects to cheaper tiers as access frequency drops and expires them at the 7-year mark, minimizing cost with no manual effort. Keeping everything in Standard is expensive, manual scripts are error-prone, and EBS snapshots are not appropriate for log archival.',
    references: [REF.S3_LIFECYCLE, REF.S3_STORAGE_CLASSES],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An access pattern for objects in S3 is unpredictable and varies widely per object, and the team does not want to analyze or design lifecycle rules. Which storage option minimizes cost while preserving millisecond access for active objects?',
    options: opts4(
      'S3 Intelligent-Tiering.',
      'S3 Standard for every object regardless of access.',
      'S3 Glacier Flexible Retrieval for all objects.',
      'S3 One Zone-IA for all objects.'
    ),
    correct: ['a'],
    explanation: 'S3 Intelligent-Tiering automatically moves objects between access tiers based on changing usage with no operational overhead or lifecycle design, and frequently accessed objects retain millisecond access. Standard is costlier for cold data, Glacier adds retrieval latency, and One Zone-IA reduces durability and is not access-adaptive.',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A finance team wants to be alerted before monthly AWS spend exceeds a defined threshold and to forecast whether the account will exceed budget by month end. Which service should the solutions architect configure?',
    options: opts4(
      'AWS Budgets with cost and forecasted-spend alerts.',
      'AWS CloudTrail with a metric filter on spend.',
      'Amazon CloudWatch billing dashboards only.',
      'AWS Config rules for cost thresholds.'
    ),
    correct: ['a'],
    explanation: 'AWS Budgets lets you set cost or usage budgets and sends alerts when actual or forecasted spend crosses thresholds, directly satisfying proactive budget alerting. CloudTrail logs API calls, CloudWatch billing dashboards lack budget forecasting alerts, and Config evaluates resource configuration, not spend.',
    references: [REF.BUDGETS],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A fault-tolerant, checkpoint-capable batch image-processing job runs for several hours each night and can be interrupted and resumed. The team wants to minimize compute cost. Which EC2 purchasing option is most appropriate?',
    options: opts4(
      'Spot Instances, optionally with an Auto Scaling group and capacity rebalancing.',
      'On-Demand Instances running 24/7.',
      'Reserved Instances with a 3-year all-upfront term.',
      'Dedicated Hosts for license compliance.'
    ),
    correct: ['a'],
    explanation: 'Spot Instances offer the deepest discount and suit interruption-tolerant, checkpoint-capable batch jobs, especially with capacity rebalancing to handle reclamation. On-Demand 24/7 is costly for a nightly job, 3-year RIs overcommit for intermittent work, and Dedicated Hosts address licensing, not cost minimization here.',
    references: [REF.EC2_PURCHASE],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'EC2 instances in private subnets download patches from the internet through a single NAT gateway, and data processing charges have become a significant portion of the bill because they also pull large packages from Amazon S3. Which change reduces cost while keeping instances private?',
    options: opts4(
      'Create an S3 gateway VPC endpoint so S3 traffic bypasses the NAT gateway at no per-GB endpoint charge.',
      'Replace the NAT gateway with a larger instance type.',
      'Give the instances public IP addresses to avoid NAT.',
      'Route all traffic through an internet gateway directly from private subnets.'
    ),
    correct: ['a'],
    explanation: 'An S3 gateway VPC endpoint routes S3 traffic privately without traversing the NAT gateway and incurs no per-GB endpoint data charge, eliminating NAT processing costs for S3-bound traffic while instances remain private. The other options either increase exposure or do not reduce NAT data processing charges.',
    references: [REF.GATEWAY_ENDPOINT, REF.NAT_GATEWAY]
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A development environment of EC2 instances is only needed during business hours (about 10 hours on weekdays). The team wants to cut costs without deleting the environment. Which approach is most cost-effective and low-effort?',
    options: opts4(
      'Use a scheduled stop/start automation (for example, an EventBridge schedule with Lambda or Instance Scheduler) to run instances only during business hours.',
      'Purchase 3-year Reserved Instances for the dev fleet.',
      'Run the dev instances on Dedicated Hosts.',
      'Leave instances running 24/7 to avoid restart effort.'
    ),
    correct: ['a'],
    explanation: 'Scheduling instances to stop outside business hours stops EC2 compute charges for roughly two-thirds of the week with minimal operational effort and no environment deletion. Reserved Instances assume continuous use, Dedicated Hosts increase cost, and running 24/7 wastes money.',
    references: [REF.EC2_PURCHASE]
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect needs to identify the largest cost drivers across services and accounts, visualize trends, and find rightsizing opportunities for underutilized EC2 instances. Which tool should be used?',
    options: opts4(
      'AWS Cost Explorer with rightsizing recommendations.',
      'AWS CloudFormation drift detection.',
      'Amazon Inspector findings.',
      'AWS Trusted Advisor security checks only.'
    ),
    correct: ['a'],
    explanation: 'AWS Cost Explorer visualizes cost and usage trends across services and accounts and surfaces EC2 rightsizing recommendations for underutilized instances. CloudFormation drift, Inspector, and Trusted Advisor security checks do not provide cost trend analysis and rightsizing guidance.',
    references: [REF.COST_EXPLORER]
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An event-driven image-thumbnail function runs sporadically a few thousand times a day with short execution times. The team wants to pay only for actual execution and avoid paying for idle servers. Which compute model is most cost-effective?',
    options: opts4(
      'AWS Lambda invoked by S3 event notifications.',
      'A continuously running EC2 instance polling for new images.',
      'An always-on ECS service on EC2 with one task.',
      'A 3-year Reserved Instance dedicated to thumbnailing.'
    ),
    correct: ['a'],
    explanation: 'AWS Lambda charges only for compute time consumed per invocation, so a sporadic, short-running, event-driven thumbnail workload incurs no cost while idle. A continuously running EC2 instance, an always-on ECS task, or a Reserved Instance all pay for idle capacity.',
    references: [REF.LAMBDA],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants to consolidate billing across many AWS accounts to receive aggregated volume discounts and share Reserved Instance and Savings Plans benefits across the accounts. Which AWS capability provides this?',
    options: opts4(
      'AWS Organizations consolidated billing.',
      'A separate payment method configured on every account.',
      'AWS Cost Explorer report exports per account.',
      'Tag-based cost allocation alone.'
    ),
    correct: ['a'],
    explanation: 'AWS Organizations consolidated billing combines usage across member accounts for aggregated volume pricing and shares Reserved Instance and Savings Plans discounts across the organization. Per-account payment methods and report exports do not aggregate discounts, and cost allocation tags only categorize spend.',
    references: [REF.ORGANIZATIONS_SCP],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A relational database stores 5 TB of transactional data, but only the last 90 days is queried regularly while older rows are rarely accessed yet must remain queryable. The team wants to reduce database storage cost. Which approach is most cost-effective?',
    options: opts4(
      'Archive cold rows to Amazon S3 and query them with Amazon Athena while keeping recent data in the database.',
      'Continuously scale the database instance to a larger storage tier.',
      'Store all 5 TB on Provisioned IOPS volumes for performance.',
      'Replicate the full database to a second Region for cost savings.'
    ),
    correct: ['a'],
    explanation: 'Moving rarely accessed historical rows to inexpensive S3 storage and querying them on demand with Athena keeps the operational database small and cheap while preserving query access to cold data. Scaling storage, using Provisioned IOPS for all data, or cross-Region replication increases cost rather than reducing it.',
    references: [REF.ATHENA, REF.S3_STORAGE_CLASSES]
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A containerized microservice has spiky, unpredictable traffic and the team wants to avoid paying for and managing idle EC2 capacity for the cluster while still running containers. Which compute option minimizes cost and operational overhead?',
    options: opts4(
      'Run the containers on AWS Fargate so capacity is provisioned per task with no idle EC2 cluster to manage.',
      'Maintain a large EC2-backed ECS cluster sized for peak at all times.',
      'Run each container on its own dedicated EC2 instance 24/7.',
      'Use a 3-year Reserved Instance cluster sized for peak.'
    ),
    correct: ['a'],
    explanation: 'AWS Fargate runs containers without provisioning or paying for an underlying EC2 cluster, charging per task vCPU/memory used, which suits spiky, unpredictable container workloads and removes idle-capacity cost and management. The EC2-backed and Reserved options pay for idle peak-sized capacity.',
    references: [REF.FARGATE]
  }
];
