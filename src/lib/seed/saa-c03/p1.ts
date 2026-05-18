import { QType } from '@prisma/client';
import { Q, opts4, opts5, SECURE, RESILIENT, PERF, COST, REF } from './types';

export const P1: Q[] = [
  // ───────────────────────── SECURE (20) ─────────────────────────
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A media company stores customer-uploaded video files in an Amazon S3 bucket. Compliance requires that no object can be deleted or overwritten for seven years, even by an account administrator. Which solution meets this requirement?',
    options: opts4(
      'Enable S3 Versioning and apply a bucket policy that denies s3:DeleteObject',
      'Enable S3 Object Lock in compliance mode with a seven-year retention period on new objects',
      'Enable S3 Object Lock in governance mode with a seven-year retention period on new objects',
      'Enable MFA Delete on the bucket and store the root MFA device in a vault'
    ),
    correct: ['b'],
    explanation: 'S3 Object Lock in compliance mode prevents any user, including the root account, from deleting or overwriting a locked object version until the retention period expires, satisfying WORM compliance. Governance mode (option c) can be bypassed by users with the s3:BypassGovernanceRetention permission, and a bucket policy (option a) can be altered by an administrator, so neither is immutable.',
    references: [REF.S3_OBJECT_LOCK],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application running on Amazon EC2 needs to read objects from an S3 bucket. The security team prohibits storing long-term access keys on the instances. What should a solutions architect do?',
    options: opts4(
      'Create an IAM user, generate access keys, and store them in the EC2 user data',
      'Attach an IAM role with an S3 read policy to the EC2 instance via an instance profile',
      'Place the access keys in AWS Systems Manager Parameter Store and fetch them at boot',
      'Embed the access keys in the AMI used to launch the instances'
    ),
    correct: ['b'],
    explanation: 'An IAM role attached through an instance profile delivers temporary, automatically rotated credentials via the instance metadata service, so no long-term keys are stored. Storing keys in user data, an AMI, or even Parameter Store still involves persisting static long-term credentials, which the security team prohibits.',
    references: [REF.IAM_ROLES],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company uses AWS DataSync to transfer on-premises NFS data into Amazon S3. Auditors require that data at rest in S3 be encrypted with a customer-managed key and that key usage be logged. Which approach meets these requirements?',
    options: opts4(
      'Use SSE-S3 default bucket encryption and enable S3 server access logging',
      'Use SSE-KMS with a customer-managed AWS KMS key and review AWS CloudTrail events for key usage',
      'Encrypt the files on the DataSync agent with client-side encryption and disable bucket encryption',
      'Use SSE-KMS with an AWS managed key and enable S3 access analyzer'
    ),
    correct: ['b'],
    explanation: 'SSE-KMS with a customer-managed KMS key gives the company control over the key, and every Decrypt/GenerateDataKey call is recorded in AWS CloudTrail, satisfying the key-usage audit requirement. SSE-S3 and AWS managed keys do not provide a customer-controlled key, and CloudTrail (not S3 access logging or Access Analyzer) is what captures KMS key usage.',
    references: [REF.KMS, REF.S3_STORAGE_CLASSES],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must allow EC2 instances in a private subnet to download objects from Amazon S3 without traversing the public internet and without incurring NAT gateway data-processing charges. What should the architect implement?',
    options: opts4(
      'A NAT gateway in a public subnet with a route to the internet gateway',
      'An S3 gateway VPC endpoint with a route in the private subnet route table',
      'An interface VPC endpoint for S3 with a public IP address',
      'A VPC peering connection to an Amazon-managed S3 VPC'
    ),
    correct: ['b'],
    explanation: 'A gateway VPC endpoint for S3 adds a prefix-list route to the route table so traffic to S3 stays on the AWS network at no per-GB charge. A NAT gateway still routes through the internet and bills data processing, and S3 is not reachable via VPC peering.',
    references: [REF.GATEWAY_ENDPOINT, REF.VPC_ENDPOINTS],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A web application stores database credentials that must be rotated automatically every 30 days without code changes or downtime. Which AWS service should a solutions architect use?',
    options: opts4(
      'AWS Systems Manager Parameter Store standard parameters',
      'AWS Secrets Manager with automatic rotation enabled',
      'AWS KMS with an imported key and a scheduled rotation Lambda',
      'Amazon S3 with an encrypted object holding the credentials'
    ),
    correct: ['b'],
    explanation: 'AWS Secrets Manager natively rotates supported database credentials on a schedule using a Lambda rotation function and serves the current secret to the application without code changes. Parameter Store standard parameters have no built-in rotation, and S3 or KMS-only approaches require custom rotation logic.',
    references: [REF.SECRETS_MANAGER],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A company hosts a public REST API behind an Application Load Balancer. The security team wants to block SQL injection attempts and rate-limit requests from individual IP addresses. Which two actions should a solutions architect take? (Choose two.)',
    options: opts5(
      'Associate an AWS WAF web ACL with the Application Load Balancer',
      'Add an AWS WAF SQL injection match rule and a rate-based rule',
      'Enable Amazon GuardDuty and attach it to the load balancer',
      'Place an Amazon CloudFront distribution in front and enable field-level encryption',
      'Configure security group rules to deny SQL keywords in the request body'
    ),
    correct: ['a', 'b'],
    explanation: 'AWS WAF must be associated with the ALB, and a managed/custom SQL injection rule plus a rate-based rule provide injection filtering and per-IP throttling. GuardDuty is a threat-detection service that does not block traffic inline, and security groups cannot inspect HTTP request bodies.',
    references: [REF.WAF],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect needs to ensure that all S3 buckets created across an AWS Organizations member account can never be made public, regardless of individual bucket policies. What is the MOST effective control?',
    options: opts4(
      'Enable S3 Block Public Access at the account level and enforce it with a service control policy',
      'Add a deny-public bucket policy to every existing bucket',
      'Enable Amazon Macie to scan buckets and alert on public access',
      'Use AWS Config rules to detect and report public buckets'
    ),
    correct: ['a'],
    explanation: 'Account-level S3 Block Public Access overrides any bucket or object ACL/policy that would grant public access, and an SCP can prevent disabling it. Macie and AWS Config only detect or report; they do not prevent public access, and per-bucket policies do not cover future buckets.',
    references: [{ label: 'Amazon S3 — Blocking public access', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html' }, REF.ORGANIZATIONS_SCP],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application uses Amazon EFS to share files between EC2 instances. The compliance team requires that data in transit between the instances and EFS be encrypted. What should a solutions architect do?',
    options: opts4(
      'Enable EFS encryption at rest when creating the file system',
      'Mount the EFS file system using the EFS mount helper with TLS enabled',
      'Place the EC2 instances and EFS mount targets in the same security group',
      'Use an S3 gateway endpoint to proxy EFS traffic'
    ),
    correct: ['b'],
    explanation: 'Encryption in transit for EFS is achieved by mounting with the EFS mount helper using the TLS option, which establishes a stunnel TLS tunnel. Encryption at rest is a separate control and does not protect data in transit, and EFS traffic cannot be proxied through an S3 endpoint.',
    references: [{ label: 'Amazon EFS — Encrypting data in transit', url: 'https://docs.aws.amazon.com/efs/latest/ug/encryption-in-transit.html' }],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A financial services company must grant a third-party vendor read-only access to a specific S3 prefix in its account. The vendor has its own AWS account. The company wants to avoid sharing long-term credentials. What should a solutions architect recommend?',
    options: opts4(
      'Create an IAM user for the vendor and share the access keys securely',
      'Create an IAM role with a trust policy for the vendor account and a scoped S3 read policy',
      'Make the S3 prefix public and restrict access by the vendor source IP',
      'Generate a pre-signed URL valid for one year for each object'
    ),
    correct: ['b'],
    explanation: 'A cross-account IAM role with a trust policy naming the vendor account lets the vendor assume the role for temporary credentials scoped to the prefix, with no shared long-term keys. IAM users with access keys are long-term credentials, public access is insecure, and year-long pre-signed URLs are impractical and risky.',
    references: [REF.IAM_ROLES],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company runs a fleet of EC2 instances that must send logs to an S3 bucket in the same account. The security team requires that the bucket reject any request that does not use TLS. What should a solutions architect configure?',
    options: opts4(
      'A bucket policy that denies requests where aws:SecureTransport is false',
      'A security group rule that allows only port 443 to S3',
      'S3 default encryption with SSE-KMS',
      'An S3 access point that restricts the VPC source'
    ),
    correct: ['a'],
    explanation: 'A bucket policy with a Deny on the condition aws:SecureTransport = false forces all requests to use HTTPS/TLS. Security groups cannot enforce TLS to the S3 service, and default encryption protects data at rest, not the transport channel.',
    references: [{ label: 'Amazon S3 — Enforcing encryption in transit', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html' }],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect is designing a VPC for a regulated workload. EC2 instances in private subnets must download OS patches from the internet but must not be reachable from the internet. Which design meets these requirements MOST securely?',
    options: opts4(
      'Assign Elastic IPs to the instances and use a restrictive security group',
      'Route private subnet egress through a NAT gateway in a public subnet',
      'Place the instances in a public subnet with a deny-all inbound NACL',
      'Use an internet gateway with a route only for outbound traffic'
    ),
    correct: ['b'],
    explanation: 'A NAT gateway lets instances in private subnets initiate outbound connections for patching while blocking any inbound connections initiated from the internet. Elastic IPs or public subnets expose the instances, and an internet gateway by itself does not provide one-way egress.',
    references: [REF.NAT_GATEWAY],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company stores sensitive backups in Amazon S3 Glacier Flexible Retrieval through AWS Backup. Auditors require that backup data cannot be deleted before a legal retention period ends, even by the backup administrator. Which feature should a solutions architect enable?',
    options: opts4(
      'AWS Backup Vault Lock in compliance mode',
      'An IAM policy that denies backup:DeleteRecoveryPoint',
      'AWS Backup cross-Region copy',
      'S3 Versioning on the underlying vault bucket'
    ),
    correct: ['a'],
    explanation: 'AWS Backup Vault Lock in compliance mode enforces a WORM retention policy that cannot be altered or deleted by any user, including the account root, until the retention period expires. An IAM deny can be modified by an administrator, cross-Region copy adds durability not immutability, and S3 Versioning does not govern Backup vaults.',
    references: [REF.BACKUP],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must give an application running in Account A permission to write objects to an S3 bucket owned by Account B, and ensure Account B retains full ownership and control of the written objects. What should be configured?',
    options: opts4(
      'A bucket policy in Account B allowing the Account A role to PutObject, plus the Bucket owner enforced object ownership setting',
      'A presigned URL generated by Account A for each upload',
      'Cross-account replication from Account A to Account B',
      'An IAM role in Account A that grants Account B access to its bucket'
    ),
    correct: ['a'],
    explanation: 'Granting the Account A principal s3:PutObject via a bucket policy in Account B, combined with the Bucket owner enforced setting (ACLs disabled), ensures all uploaded objects are owned and controlled by Account B. Presigned URLs and replication do not address ownership of cross-account writes the way object ownership does.',
    references: [{ label: 'Amazon S3 — Controlling object ownership', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html' }],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'A company uses AWS Transfer Family to let external partners upload files over SFTP into Amazon S3. Each partner must be restricted to its own home folder and must not see other partners’ data. What is the MOST scalable way to enforce this isolation?',
    options: opts4(
      'Create a separate S3 bucket per partner and a separate Transfer Family server',
      'Use session policies (scope-down policies) on the Transfer Family users with a logical home directory',
      'Apply an S3 bucket ACL granting each partner access to its folder',
      'Use a Lambda authorizer that filters listings after each request'
    ),
    correct: ['b'],
    explanation: 'AWS Transfer Family supports per-user scope-down (session) policies plus a logical home directory mapping, which confines each partner to its own prefix on one server and one bucket, scaling cleanly. A bucket/server per partner does not scale, ACLs are coarse and being deprecated, and post-request Lambda filtering is fragile.',
    references: [REF.TRANSFER_FAMILY],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect needs to ensure that EBS volumes attached to all newly launched EC2 instances are encrypted at rest by default across an entire AWS Region. What should the architect do?',
    options: opts4(
      'Enable EBS encryption by default in the EC2 account attributes for the Region',
      'Add a tag policy requiring an Encrypted=true tag on volumes',
      'Create encrypted volumes manually and attach them after launch',
      'Use an AWS Config rule to delete unencrypted volumes'
    ),
    correct: ['a'],
    explanation: 'Enabling EBS encryption by default at the account/Region level causes every new volume and snapshot to be encrypted automatically with no per-launch action. Tag policies do not encrypt data, manual attachment is error-prone, and a Config rule only reports or remediates after the fact.',
    references: [REF.EBS],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A company wants to protect a public-facing application from DDoS attacks and gain access to the AWS DDoS response team during incidents. Which two actions should a solutions architect take? (Choose two.)',
    options: opts5(
      'Subscribe to AWS Shield Advanced',
      'Deploy the application behind Amazon CloudFront and an Application Load Balancer',
      'Enable Amazon Inspector on the EC2 instances',
      'Place all resources in a single Availability Zone to simplify defense',
      'Disable Amazon Route 53 health checks to reduce attack surface'
    ),
    correct: ['a', 'b'],
    explanation: 'AWS Shield Advanced provides enhanced DDoS protection and 24x7 access to the Shield Response Team, and fronting the app with CloudFront and an ALB absorbs and disperses volumetric attacks at the edge. Inspector assesses vulnerabilities, a single AZ reduces resilience, and disabling health checks harms availability.',
    references: [REF.SHIELD, REF.CLOUDFRONT],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect must allow a Lambda function to read a secret and decrypt S3 objects encrypted with a customer-managed KMS key. The function currently fails with an AccessDenied error on kms:Decrypt. What is the MOST likely fix?',
    options: opts4(
      'Add the Lambda execution role as a principal in the KMS key policy or grant kms:Decrypt via its IAM policy and the key policy',
      'Make the KMS key a multi-Region key',
      'Increase the Lambda function timeout and memory',
      'Recreate the S3 objects with SSE-S3 encryption'
    ),
    correct: ['a'],
    explanation: 'KMS requires both an IAM policy permitting kms:Decrypt and the KMS key policy allowing the principal; the AccessDenied indicates the Lambda execution role lacks key access. Multi-Region keys, timeouts/memory, and re-encrypting with SSE-S3 do not address the missing KMS authorization (and SSE-S3 would change the security posture).',
    references: [REF.KMS, REF.IAM_POLICY_EVAL],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants centralized, immutable logging of all AWS API activity across every account in its AWS Organization, delivered to a dedicated logging account. What should a solutions architect implement?',
    options: opts4(
      'An organization trail in AWS CloudTrail delivering logs to an S3 bucket in the logging account with Object Lock enabled',
      'Per-account CloudWatch Logs with cross-account subscription filters',
      'VPC Flow Logs aggregated into Amazon Athena',
      'AWS Config aggregators in each member account'
    ),
    correct: ['a'],
    explanation: 'An organization-level CloudTrail trail captures management and data events from all accounts into a central S3 bucket; enabling S3 Object Lock makes the log objects immutable. CloudWatch Logs, VPC Flow Logs, and AWS Config do not provide a complete immutable record of all API activity.',
    references: [{ label: 'AWS CloudTrail — Organization trails', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/creating-trail-organization.html' }, REF.S3_OBJECT_LOCK],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect needs to provide developers temporary, federated access to the AWS Management Console using the company’s existing corporate identity provider, without creating IAM users. Which solution should be used?',
    options: opts4(
      'Create IAM users and rotate their passwords every 24 hours',
      'Configure IAM Identity Center (or SAML 2.0 federation) mapping corporate groups to IAM roles',
      'Share a single break-glass root credential among developers',
      'Issue long-term access keys distributed through Secrets Manager'
    ),
    correct: ['b'],
    explanation: 'IAM Identity Center or SAML 2.0 federation lets corporate users assume IAM roles for temporary console sessions tied to their existing identities, eliminating per-developer IAM users. The other options rely on long-term or shared credentials, which contradict the requirement and security best practices.',
    references: [{ label: 'AWS IAM Identity Center — User Guide', url: 'https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html' }],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must ensure that objects replicated to a backup S3 bucket in another Region using S3 Cross-Region Replication are encrypted with a KMS key managed in the destination account. What should be configured?',
    options: opts4(
      'Disable encryption on the source bucket so the destination can re-encrypt',
      'Configure the replication rule to use a destination KMS key and grant the replication role kms permissions',
      'Use SSE-S3 on the source and SSE-S3 on the destination only',
      'Replicate only unencrypted objects and encrypt them with a Lambda trigger'
    ),
    correct: ['b'],
    explanation: 'S3 replication rules can specify a destination KMS key so replicas are encrypted with the target account’s key, provided the replication IAM role has kms:Decrypt on the source key and kms:GenerateDataKey on the destination key. Disabling encryption or post-replication Lambda re-encryption introduces gaps and complexity.',
    references: [{ label: 'Amazon S3 — Replicating encrypted objects', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-config-for-kms-objects.html' }],
    isTeaser: true
  },

  // ──────────────────────── RESILIENT (17) ────────────────────────
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company runs a critical Amazon RDS for PostgreSQL database. The business requires automatic failover with minimal downtime if the primary database instance or its Availability Zone fails. What should a solutions architect configure?',
    options: opts4(
      'A single-AZ RDS instance with automated backups enabled',
      'A Multi-AZ RDS deployment with a synchronous standby in another AZ',
      'Five read replicas spread across Availability Zones',
      'A daily snapshot copied to another Region'
    ),
    correct: ['b'],
    explanation: 'RDS Multi-AZ maintains a synchronous standby in a second AZ and performs automatic failover, minimizing downtime for an instance or AZ failure. Read replicas are for read scaling and require manual promotion, while backups and snapshots only support recovery, not automatic failover.',
    references: [REF.RDS_MULTI_AZ],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect wants Amazon S3 data to survive the loss of an entire AWS Region and be available for reads in a second Region with minimal recovery effort. Which approach should be used?',
    options: opts4(
      'Enable S3 Cross-Region Replication to a bucket in a second Region',
      'Enable S3 Versioning in the primary bucket only',
      'Schedule a nightly aws s3 sync to a second-Region bucket via cron on EC2',
      'Use S3 One Zone-IA storage class for lower cost'
    ),
    correct: ['a'],
    explanation: 'S3 Cross-Region Replication asynchronously and automatically copies objects to a bucket in another Region, providing a Region-failure-resilient, readable copy with minimal operational effort. Versioning alone is single-Region, cron-based sync is brittle, and One Zone-IA actually reduces resilience.',
    references: [{ label: 'Amazon S3 — Replication', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html' }],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A stateless web tier runs on EC2 instances behind an Application Load Balancer. The application must automatically replace unhealthy instances and maintain capacity across at least two Availability Zones. What should a solutions architect implement?',
    options: opts4(
      'A single large EC2 instance with an Elastic IP',
      'An EC2 Auto Scaling group spanning multiple AZs with ELB health checks',
      'A spot fleet in one AZ with a CloudWatch alarm',
      'Manual launch of replacement instances via a runbook'
    ),
    correct: ['b'],
    explanation: 'An Auto Scaling group across multiple AZs using ELB health checks automatically terminates and replaces unhealthy instances and maintains desired capacity across zones. A single instance is a single point of failure, a one-AZ spot fleet lacks zone resilience, and manual replacement is not automatic.',
    references: [REF.AUTOSCALING, REF.ALB],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company needs a shared file system for a Linux-based content management cluster. The file system must remain available even if an entire Availability Zone becomes unavailable. Which storage option should a solutions architect choose?',
    options: opts4(
      'Amazon EBS Multi-Attach io2 volume',
      'Amazon EFS with the Standard (Regional) storage class',
      'Amazon EFS with the One Zone storage class',
      'An instance store volume replicated by the application'
    ),
    correct: ['b'],
    explanation: 'Amazon EFS Standard stores data redundantly across multiple Availability Zones, so it remains available if one AZ fails and is accessible from instances in any AZ. EFS One Zone and EBS volumes are tied to a single AZ, and instance store is ephemeral.',
    references: [REF.EFS],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must decouple a web front end from a back-end processing tier so that traffic spikes do not overwhelm the workers and no messages are lost if a worker fails. Which service should be placed between the tiers?',
    options: opts4(
      'Amazon SNS standard topic',
      'Amazon SQS queue with a dead-letter queue',
      'An Application Load Balancer',
      'Amazon Kinesis Data Firehose'
    ),
    correct: ['b'],
    explanation: 'An SQS queue buffers requests so the worker tier consumes at its own pace during spikes, and a dead-letter queue retains messages that repeatedly fail processing. SNS is fan-out pub/sub without durable per-consumer buffering, an ALB does not persist requests, and Firehose is for delivery to data stores.',
    references: [REF.SQS],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A company wants its DynamoDB-backed application to remain available for reads and writes even if an entire AWS Region becomes unavailable. Which two actions should a solutions architect take? (Choose two.)',
    options: opts5(
      'Create a DynamoDB global table replicated to a second Region',
      'Configure the application to fail over to the second Region’s endpoint',
      'Enable DynamoDB point-in-time recovery only',
      'Increase the provisioned write capacity in the primary Region',
      'Store a nightly export in S3 in the same Region'
    ),
    correct: ['a', 'b'],
    explanation: 'A DynamoDB global table provides an active, multi-Region replicated copy, and the application must be able to direct traffic to the second Region’s endpoint during a regional failure. Point-in-time recovery and same-Region exports do not survive a Region outage, and raising write capacity does not add regional resilience.',
    references: [REF.DYNAMODB],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect wants to back up EBS volumes, RDS databases, and EFS file systems on a single schedule with centralized retention and compliance reporting. Which service should be used?',
    options: opts4(
      'Custom Lambda functions triggered by Amazon EventBridge per resource type',
      'AWS Backup with a backup plan and backup vault',
      'Manual snapshots scheduled with cron on a management EC2 instance',
      'S3 Lifecycle policies on each resource'
    ),
    correct: ['b'],
    explanation: 'AWS Backup centrally orchestrates and retains backups for EBS, RDS, EFS, and more using backup plans and vaults, with built-in compliance reporting. Custom Lambda or cron-based snapshotting is operationally heavy, and S3 Lifecycle policies do not back up EBS/RDS/EFS.',
    references: [REF.BACKUP],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company runs a Windows-based application that requires a highly available shared file system supporting SMB and integration with Active Directory. The file system must withstand an Availability Zone failure. Which option should a solutions architect choose?',
    options: opts4(
      'Amazon FSx for Windows File Server in a Multi-AZ deployment',
      'Amazon FSx for Lustre in a single AZ',
      'Amazon EFS mounted from Windows instances',
      'An EBS volume shared via a self-managed Windows file server'
    ),
    correct: ['a'],
    explanation: 'Amazon FSx for Windows File Server provides native SMB and Active Directory integration, and a Multi-AZ deployment maintains a standby in a second AZ with automatic failover. FSx for Lustre single-AZ lacks AZ resilience, EFS uses NFS (not native SMB/AD), and a self-managed server is a single point of failure.',
    references: [REF.FSX_WINDOWS],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect must design a disaster recovery strategy for a workload with an RTO of a few minutes and an RPO of seconds, at the lowest cost that still meets these objectives. Which DR strategy is appropriate?',
    options: opts4(
      'Backup and restore from S3',
      'Pilot light with a minimal core running in the DR Region',
      'Warm standby with a scaled-down but always-running environment',
      'Multi-site active/active in two Regions'
    ),
    correct: ['c'],
    explanation: 'A warm standby keeps a scaled-down environment continuously running with replicated data, enabling recovery in minutes and an RPO of seconds, at lower cost than full active/active. Backup-and-restore and pilot light have longer RTOs, while multi-site active/active meets the objectives but at higher cost than needed.',
    references: [{ label: 'AWS — Disaster recovery options in the cloud', url: 'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html' }],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect needs to route users to a healthy Region automatically if the primary Region’s application endpoint fails a health check. Which AWS service provides this DNS-level failover?',
    options: opts4(
      'Amazon Route 53 with failover routing and health checks',
      'An Application Load Balancer with cross-zone load balancing',
      'Amazon CloudFront with multiple origins',
      'AWS Global Accelerator static IPs only'
    ),
    correct: ['a'],
    explanation: 'Route 53 failover routing uses health checks to direct DNS responses to a secondary Region’s endpoint when the primary becomes unhealthy. An ALB operates within one Region, CloudFront origin failover handles content delivery not DNS region failover, and Global Accelerator static IPs alone do not provide DNS failover policy.',
    references: [REF.ROUTE53],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company stores 200 TB of critical data on an on-premises NAS and wants a resilient cloud copy with point-in-time recovery, while keeping low-latency local access for current files. Which solution should a solutions architect recommend?',
    options: opts4(
      'AWS Storage Gateway File Gateway with the data backed by Amazon S3 and lifecycle versioning',
      'A one-time AWS Snowball import then disconnect on-premises access',
      'Amazon S3 Transfer Acceleration uploads twice per day',
      'EBS snapshots of the on-premises volumes'
    ),
    correct: ['a'],
    explanation: 'File Gateway presents an SMB/NFS share with a local cache for low-latency access while durably storing data as objects in S3, where versioning provides point-in-time recovery. A one-time Snowball import drops ongoing local access, periodic uploads are not continuous, and EBS snapshots cannot snapshot an on-premises NAS.',
    references: [REF.STORAGE_GATEWAY],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect wants to ensure that an Amazon Aurora MySQL cluster can recover quickly from the failure of the writer instance with minimal application impact. Which configuration provides this?',
    options: opts4(
      'A single Aurora instance with frequent snapshots',
      'An Aurora cluster with one or more Aurora Replicas as automatic failover targets',
      'An Aurora Serverless v1 cluster scaled to zero',
      'A read replica in a different database engine'
    ),
    correct: ['b'],
    explanation: 'Aurora promotes an existing Aurora Replica to writer automatically within the cluster, providing fast failover with minimal impact. A single instance has no failover target, scaling Serverless to zero increases cold-start latency, and a cross-engine replica is not an Aurora failover target.',
    references: [REF.AURORA],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A solutions architect must improve the resilience of a three-tier application currently running on EC2 in a single Availability Zone. Which two changes will most improve availability? (Choose two.)',
    options: opts5(
      'Deploy the web and application tiers across multiple Availability Zones behind an Application Load Balancer',
      'Convert the database to a Multi-AZ deployment',
      'Vertically scale the single EC2 instance to a larger type',
      'Move static assets to a single S3 One Zone-IA bucket',
      'Replace the ALB with a single Elastic IP'
    ),
    correct: ['a', 'b'],
    explanation: 'Spreading the compute tiers across AZs behind an ALB and making the database Multi-AZ removes single-AZ points of failure. Vertical scaling does not add AZ redundancy, One Zone-IA reduces durability across AZs, and a single Elastic IP reintroduces a single point of failure.',
    references: [REF.AUTOSCALING, REF.RDS_MULTI_AZ],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company must retain database backups for seven years for compliance and be able to restore to any Region after a disaster. The backups are produced by AWS Backup. Which approach meets the requirement MOST simply?',
    options: opts4(
      'Configure AWS Backup cross-Region copy with a seven-year lifecycle in the backup plan',
      'Manually download backups and store them on tape',
      'Use only continuous backups with a 35-day retention window',
      'Replicate the production database synchronously to every Region'
    ),
    correct: ['a'],
    explanation: 'AWS Backup supports automatic cross-Region copy and lifecycle-based long-term retention, letting backups be restored in another Region after a disaster with minimal operational effort. Manual tape handling is error-prone, 35-day retention fails the seven-year rule, and synchronous multi-Region replication is unnecessary and costly for backups.',
    references: [REF.BACKUP],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect wants an Amazon S3-hosted static website to remain available even if objects are accidentally deleted or overwritten by application bugs. Which feature should be enabled?',
    options: opts4(
      'S3 Transfer Acceleration',
      'S3 Versioning to preserve, retrieve, and restore previous object versions',
      'S3 Requester Pays',
      'S3 Intelligent-Tiering'
    ),
    correct: ['b'],
    explanation: 'S3 Versioning keeps prior versions of objects so accidental deletes or overwrites can be reverted by restoring an earlier version. Transfer Acceleration speeds uploads, Requester Pays shifts billing, and Intelligent-Tiering optimizes cost—none protect against accidental data loss.',
    references: [{ label: 'Amazon S3 — Using versioning', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html' }],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A high-performance computing cluster needs a shared file system that is durably backed by S3 and can be recreated quickly in another Availability Zone after a failure. Which option should a solutions architect choose?',
    options: opts4(
      'Amazon FSx for Lustre linked to an S3 bucket as its data repository',
      'Amazon EBS gp3 volume attached to one instance',
      'Instance store volumes striped with RAID 0',
      'Amazon S3 mounted directly as a block device'
    ),
    correct: ['a'],
    explanation: 'FSx for Lustre can be linked to an S3 data repository, so the file system is backed by durable S3 data and can be quickly recreated in another AZ by relinking to the same bucket. EBS and instance store are AZ-bound and not S3-backed, and S3 is object storage, not a POSIX block device.',
    references: [REF.FSX_LUSTRE],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect needs application processing to continue even if individual messages fail repeatedly, without blocking the queue or losing the problematic messages for later analysis. What should be configured on the Amazon SQS queue?',
    options: opts4(
      'Increase the visibility timeout to 12 hours',
      'Configure a redrive policy that sends failed messages to a dead-letter queue after a maximum receive count',
      'Enable long polling on the queue',
      'Switch the queue from standard to FIFO'
    ),
    correct: ['b'],
    explanation: 'A redrive policy moves messages that exceed the maximum receive count to a dead-letter queue, so poison messages are isolated for later analysis while normal processing continues. Longer visibility timeout, long polling, and FIFO change delivery behavior but do not isolate repeatedly failing messages.',
    references: [REF.SQS],
    isTeaser: false
  },

  // ───────────────────────── PERF (16) ─────────────────────────
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A machine learning training job on EC2 needs the highest possible throughput reading a 50 TB dataset that currently resides in Amazon S3, and the file system can be discarded after each job. Which storage option provides the BEST performance?',
    options: opts4(
      'Copy the data to an EBS gp2 volume before each job',
      'Use Amazon FSx for Lustre in scratch deployment linked to the S3 bucket',
      'Mount the S3 bucket using an S3 gateway endpoint and read objects directly',
      'Use Amazon EFS in Bursting Throughput mode'
    ),
    correct: ['b'],
    explanation: 'FSx for Lustre scratch file systems deliver very high, sub-millisecond throughput for HPC/ML workloads and can lazily load data from a linked S3 bucket, making it ideal for transient high-throughput jobs. gp2 EBS and EFS bursting cannot match Lustre throughput, and reading objects one by one from S3 is slower for parallel training.',
    references: [REF.FSX_LUSTRE],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A global user base experiences slow load times for images served from an S3 bucket in us-east-1. A solutions architect must reduce latency for users worldwide with minimal changes. What should be done?',
    options: opts4(
      'Enable S3 Transfer Acceleration on the bucket',
      'Serve the images through an Amazon CloudFront distribution with the S3 bucket as origin',
      'Replicate the bucket to every AWS Region',
      'Increase the S3 bucket request rate limit'
    ),
    correct: ['b'],
    explanation: 'CloudFront caches content at global edge locations, dramatically reducing latency for distant users with minimal architectural change. Transfer Acceleration optimizes uploads, replicating to every Region is operationally heavy and costly, and S3 has no fixed request-rate limit to raise.',
    references: [REF.CLOUDFRONT],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A database-backed application is read-heavy, and the RDS for MySQL primary instance is CPU-bound serving repetitive read queries. A solutions architect must improve read performance without changing the application’s connection logic significantly. What should be implemented?',
    options: opts4(
      'Add RDS read replicas and route read traffic to them',
      'Increase the primary instance storage IOPS only',
      'Enable Multi-AZ to add read capacity',
      'Convert the database to a single larger instance every quarter'
    ),
    correct: ['a'],
    explanation: 'RDS read replicas offload read queries from the primary, scaling read throughput for read-heavy workloads. More storage IOPS does not address CPU-bound reads, Multi-AZ standby does not serve reads, and periodic vertical scaling does not provide elastic read scaling.',
    references: [REF.RDS_READ_REPLICA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application stores user session data and frequently reads a small set of hot keys, causing high latency against a relational database. Which solution will improve read performance MOST effectively?',
    options: opts4(
      'Add an Amazon ElastiCache (Redis) cache in front of the database for session data',
      'Increase the database instance size repeatedly',
      'Move the session table to Amazon S3',
      'Enable database query logging'
    ),
    correct: ['a'],
    explanation: 'An in-memory ElastiCache for Redis layer serves hot session reads with microsecond latency and offloads the database. Vertical scaling is costly and limited, S3 is not suited for low-latency session lookups, and query logging adds overhead without improving performance.',
    references: [{ label: 'Amazon ElastiCache — User Guide', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html' }],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect needs a high-performance block storage volume for a latency-sensitive transactional database that requires consistent sub-millisecond latency and up to 64,000 IOPS. Which EBS volume type should be selected?',
    options: opts4(
      'Throughput Optimized HDD (st1)',
      'Provisioned IOPS SSD (io2 Block Express)',
      'Cold HDD (sc1)',
      'General Purpose SSD (gp2)'
    ),
    correct: ['b'],
    explanation: 'io2 Block Express delivers consistent sub-millisecond latency and high provisioned IOPS suited to demanding transactional databases. HDD types (st1, sc1) are throughput-oriented with high latency, and gp2 cannot guarantee the same consistent high IOPS for the most demanding workloads.',
    references: [REF.EBS],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A solutions architect must improve the performance of large object uploads to Amazon S3 from clients distributed worldwide. Which two techniques should be used? (Choose two.)',
    options: opts5(
      'Enable S3 Transfer Acceleration on the bucket',
      'Use multipart upload for large objects',
      'Disable S3 Versioning to speed writes',
      'Store objects in S3 Glacier Deep Archive',
      'Reduce the object key randomness to a single common prefix'
    ),
    correct: ['a', 'b'],
    explanation: 'Transfer Acceleration routes uploads over the optimized AWS edge network for distant clients, and multipart upload parallelizes large transfers and improves resiliency. Disabling versioning has negligible upload impact, Glacier Deep Archive is archival not faster ingest, and a single common prefix is no longer needed and does not improve upload speed.',
    references: [{ label: 'Amazon S3 — Transfer Acceleration', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html' }, { label: 'Amazon S3 — Multipart upload', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html' }],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must run analytics SQL queries directly against terabytes of log files stored in Amazon S3 without provisioning or managing any servers. Which service should be used?',
    options: opts4(
      'Amazon Athena',
      'Amazon Redshift on a single-node cluster',
      'An EC2 instance running a SQL engine',
      'Amazon RDS for PostgreSQL'
    ),
    correct: ['a'],
    explanation: 'Amazon Athena is a serverless, pay-per-query engine that runs standard SQL directly on data in S3 with no infrastructure to manage. Redshift, EC2-hosted engines, and RDS all require provisioning and loading data, adding operational overhead.',
    references: [REF.ATHENA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A gaming company needs the lowest possible latency and consistent routing for a UDP-based multiplayer service to players around the world, using static anycast IP addresses. Which AWS service should a solutions architect use?',
    options: opts4(
      'Amazon CloudFront',
      'AWS Global Accelerator',
      'Amazon Route 53 latency-based routing',
      'An internet-facing Application Load Balancer'
    ),
    correct: ['b'],
    explanation: 'AWS Global Accelerator provides static anycast IPs and routes traffic over the AWS global network for low, consistent latency, and it supports TCP and UDP. CloudFront is optimized for HTTP caching, Route 53 only influences DNS responses, and an ALB is HTTP/HTTPS and Region-bound (not for UDP).',
    references: [REF.GLOBAL_ACCELERATOR],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect wants to automatically move infrequently accessed S3 objects to a cheaper class without performance impact on frequently accessed objects, and without manually analyzing access patterns. Which S3 storage class should be used?',
    options: opts4(
      'S3 Standard for everything',
      'S3 Intelligent-Tiering',
      'S3 Glacier Deep Archive',
      'S3 One Zone-IA'
    ),
    correct: ['b'],
    explanation: 'S3 Intelligent-Tiering automatically moves objects between frequent and infrequent access tiers based on observed usage with no performance impact for hot objects and no manual analysis. Standard does not optimize cost, Deep Archive imposes long retrieval times, and One Zone-IA reduces availability and requires known access patterns.',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect must ingest and process a continuous stream of clickstream events at hundreds of thousands of records per second, with multiple independent consumers replaying data. Which service is the BEST fit?',
    options: opts4(
      'Amazon SQS standard queue',
      'Amazon Kinesis Data Streams',
      'Amazon SNS topic',
      'AWS Step Functions'
    ),
    correct: ['b'],
    explanation: 'Kinesis Data Streams handles high-throughput real-time streaming and retains records so multiple consumers can independently read and replay the stream. SQS does not support replay by multiple independent consumers, SNS is push pub/sub without replay, and Step Functions orchestrates workflows rather than ingesting streams.',
    references: [REF.KINESIS],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect needs a managed shared file system for a Linux analytics workload that requires very high throughput and the ability to scale automatically with no capacity planning. Which option should be chosen?',
    options: opts4(
      'Amazon EFS with Elastic Throughput mode',
      'Amazon EBS io2 attached to one instance',
      'An EC2-hosted NFS server on instance store',
      'Amazon S3 accessed via the AWS CLI'
    ),
    correct: ['a'],
    explanation: 'Amazon EFS scales storage and throughput automatically, and Elastic Throughput mode delivers high performance without provisioning or capacity planning. A single-instance EBS volume is not a shared file system, a self-managed NFS server adds operational burden, and S3 via CLI is not a POSIX file system.',
    references: [REF.EFS],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A read-heavy DynamoDB table experiences microsecond-latency requirements for repeated reads of the same items. Which solution will improve read performance with minimal application changes?',
    options: opts4(
      'Enable DynamoDB Accelerator (DAX) in front of the table',
      'Switch the table to provisioned capacity with high RCUs',
      'Add a global secondary index for every attribute',
      'Export the table to S3 and query with Athena'
    ),
    correct: ['a'],
    explanation: 'DynamoDB Accelerator (DAX) is a managed in-memory cache that delivers microsecond read latency for eventually consistent reads with minimal code change. Raising RCUs reduces throttling but not latency to microseconds, extra GSIs add cost without caching, and S3/Athena is for analytics not low-latency item reads.',
    references: [REF.DYNAMODB],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must distribute incoming TCP traffic for a high-throughput, latency-sensitive non-HTTP application across targets, handling millions of requests per second with ultra-low latency. Which load balancer should be used?',
    options: opts4(
      'Application Load Balancer',
      'Network Load Balancer',
      'Gateway Load Balancer',
      'Classic Load Balancer'
    ),
    correct: ['b'],
    explanation: 'A Network Load Balancer operates at Layer 4, supports millions of requests per second with ultra-low latency, and is ideal for high-throughput TCP/UDP traffic. ALB is Layer 7 for HTTP/HTTPS, Gateway Load Balancer is for inline virtual appliances, and Classic Load Balancer is legacy with lower performance.',
    references: [REF.NLB],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A solutions architect must reduce latency and database load for a read-heavy web application serving global users. Which two solutions together address both goals? (Choose two.)',
    options: opts5(
      'Add Amazon CloudFront in front of the application for edge caching of static and cacheable content',
      'Add Amazon ElastiCache to cache frequent database query results',
      'Move the database to a single larger On-Demand instance',
      'Disable connection pooling on the application servers',
      'Store all dynamic responses in S3 Glacier'
    ),
    correct: ['a', 'b'],
    explanation: 'CloudFront caches content at edge locations to cut latency for global users, while ElastiCache offloads repetitive read queries from the database. Vertical scaling does not reduce edge latency, disabling connection pooling worsens performance, and Glacier is archival storage unsuitable for dynamic responses.',
    references: [REF.CLOUDFRONT],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company must transfer 80 TB of data from an on-premises data center to Amazon S3 over a 30-day project window. The site has a 100 Mbps internet connection that is also used for production traffic. What is the FASTEST way to move the data?',
    options: opts4(
      'Use AWS DataSync over the existing internet connection',
      'Order an AWS Snowball Edge device, copy the data locally, and ship it back to AWS',
      'Use multipart upload with the AWS CLI over the internet',
      'Set up a 1 Gbps AWS Direct Connect link for the transfer'
    ),
    correct: ['b'],
    explanation: 'Transferring 80 TB over a shared 100 Mbps link would take far longer than the window, so a Snowball Edge device physically ships the data and completes within days. DataSync and multipart upload still depend on the slow saturated link, and provisioning Direct Connect typically exceeds the project window.',
    references: [REF.SNOWBALL],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect wants to speed up repeated, ongoing transfers of changed files from an on-premises NFS share to Amazon S3 with built-in scheduling, data validation, and bandwidth throttling. Which service should be used?',
    options: opts4(
      'AWS DataSync',
      'The aws s3 cp command in a cron job',
      'AWS Snowcone shipped weekly',
      'AWS Transfer Family over FTP'
    ),
    correct: ['a'],
    explanation: 'AWS DataSync is purpose-built for fast, incremental, scheduled transfers with automatic data integrity validation and bandwidth throttling. Cron-based aws s3 cp lacks these features, weekly Snowcone shipments are impractical for ongoing sync, and Transfer Family is for inbound/outbound file transfer protocols, not optimized bulk sync.',
    references: [REF.DATASYNC],
    isTeaser: true
  },

  // ───────────────────────── COST (12) ─────────────────────────
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company stores 500 TB of log files in S3 Standard. The logs are rarely accessed after 30 days but must be retrievable within minutes for one year, then archived for six more years where retrieval can take hours. Which lifecycle policy is MOST cost-effective?',
    options: opts4(
      'Keep all logs in S3 Standard for seven years',
      'Transition to S3 Standard-IA after 30 days, to S3 Glacier Flexible Retrieval after one year, then expire after seven years',
      'Transition directly to S3 Glacier Deep Archive after 30 days',
      'Transition to S3 One Zone-IA after 30 days and never expire'
    ),
    correct: ['b'],
    explanation: 'Standard-IA serves the within-minutes retrieval need cheaply for the first year, then Glacier Flexible Retrieval covers the hours-acceptable archival period before expiration, minimizing cost while meeting both retrieval SLAs. Keeping all in Standard is expensive, Deep Archive after 30 days breaks the minutes-retrieval requirement, and never expiring wastes storage cost.',
    references: [REF.S3_LIFECYCLE, REF.S3_STORAGE_CLASSES],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company runs steady-state production EC2 workloads 24x7 for at least the next three years. The team wants to minimize compute cost while retaining flexibility across instance families and Regions. Which purchasing option is MOST cost-effective?',
    options: opts4(
      'On-Demand Instances',
      'A three-year Compute Savings Plan',
      'Spot Instances for the production workload',
      'Standard Reserved Instances for a single instance type, no flexibility'
    ),
    correct: ['b'],
    explanation: 'A three-year Compute Savings Plan offers deep discounts for steady usage while applying automatically across instance families, sizes, and Regions, retaining flexibility. On-Demand is the most expensive, Spot is unsuitable for steady production due to interruptions, and a rigid single-type Reserved Instance lacks the requested flexibility.',
    references: [REF.SAVINGS_PLANS],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A batch image-processing job is fault-tolerant, can be interrupted and resumed, and runs at flexible times. A solutions architect must minimize compute cost. Which EC2 purchasing option should be used?',
    options: opts4(
      'On-Demand Instances',
      'Spot Instances',
      'Dedicated Hosts',
      'A one-year Standard Reserved Instance'
    ),
    correct: ['b'],
    explanation: 'Spot Instances provide the deepest discount and are appropriate for fault-tolerant, interruptible, time-flexible batch work. On-Demand and Reserved are far more expensive for this pattern, and Dedicated Hosts are for licensing/compliance isolation, not cost minimization.',
    references: [REF.EC2_PURCHASE],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect notices a NAT gateway is incurring high data-processing charges because EC2 instances in private subnets pull large amounts of data from Amazon S3 and Amazon DynamoDB. What is the MOST cost-effective change?',
    options: opts4(
      'Add gateway VPC endpoints for S3 and DynamoDB so traffic bypasses the NAT gateway',
      'Move the instances to public subnets with public IPs',
      'Increase the NAT gateway bandwidth allocation',
      'Replace the NAT gateway with a NAT instance on a large EC2 type'
    ),
    correct: ['a'],
    explanation: 'Gateway VPC endpoints for S3 and DynamoDB route that traffic directly over the AWS network, eliminating NAT gateway data-processing charges at no per-GB endpoint cost. Public subnets reduce security, NAT gateways have no manual bandwidth setting, and a large NAT instance still processes the data and adds management overhead.',
    references: [REF.GATEWAY_ENDPOINT, REF.NAT_GATEWAY],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect wants to be alerted automatically and take action when monthly AWS spending is forecast to exceed a defined threshold. Which service should be used?',
    options: opts4(
      'AWS Cost Explorer recommendations only',
      'AWS Budgets with a budget and budget actions',
      'Amazon CloudWatch billing dashboards only',
      'AWS Trusted Advisor cost checks reviewed quarterly'
    ),
    correct: ['b'],
    explanation: 'AWS Budgets lets you set cost/usage thresholds with forecasted alerts and can trigger budget actions automatically when limits are projected to be exceeded. Cost Explorer analyzes spend without proactive thresholds, CloudWatch dashboards are passive, and quarterly Trusted Advisor reviews are not timely alerts.',
    references: [REF.BUDGETS],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company keeps 1 PB of regulatory archives in S3 that are accessed at most once or twice a year, where a retrieval time of up to 12 hours is acceptable. Which storage class minimizes cost?',
    options: opts4(
      'S3 Standard-IA',
      'S3 Glacier Deep Archive',
      'S3 Glacier Instant Retrieval',
      'S3 Intelligent-Tiering frequent access tier'
    ),
    correct: ['b'],
    explanation: 'S3 Glacier Deep Archive offers the lowest storage cost for rarely accessed, long-term archives where retrieval times of hours are acceptable. Standard-IA and Glacier Instant Retrieval cost more for storage, and Intelligent-Tiering’s frequent-access tier is far more expensive for data accessed once or twice a year.',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A solutions architect must reduce the storage cost of an Amazon EBS-backed workload that retains many old snapshots and oversized gp2 volumes. Which two actions reduce cost without harming performance? (Choose two.)',
    options: opts5(
      'Migrate gp2 volumes to gp3 and right-size provisioned IOPS/throughput',
      'Implement a lifecycle policy with Amazon Data Lifecycle Manager to delete obsolete snapshots',
      'Convert all volumes to Provisioned IOPS io2',
      'Copy every snapshot to S3 Standard manually each day',
      'Increase the size of all volumes to reduce snapshot count'
    ),
    correct: ['a', 'b'],
    explanation: 'gp3 is cheaper than gp2 and lets you provision only the IOPS/throughput needed, and Data Lifecycle Manager automatically deletes obsolete snapshots to stop unbounded storage growth. Converting everything to io2 raises cost, manual daily copies add cost and effort, and enlarging volumes increases spend.',
    references: [REF.EBS],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A development environment of EC2 instances is only needed during business hours, Monday to Friday. A solutions architect must reduce cost with the LEAST operational overhead. What should be done?',
    options: opts4(
      'Buy Reserved Instances for all development instances',
      'Use an EventBridge schedule to stop instances after hours and start them in the morning',
      'Delete and recreate the instances daily by hand',
      'Resize the instances to the smallest type permanently'
    ),
    correct: ['b'],
    explanation: 'Scheduling automated stop/start with EventBridge stops billing for compute when the dev environment is idle, with minimal ongoing effort. Reserved Instances assume continuous use, manual recreation is high-effort and error-prone, and permanently downsizing may impair the environment without eliminating idle cost.',
    references: [REF.EC2_PURCHASE],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company performs a one-time migration of 60 TB of cold archival data from an on-premises tape library to AWS for long-term retention at the lowest cost, with no need for ongoing local access. Which approach is MOST cost-effective?',
    options: opts4(
      'Use AWS Storage Gateway Tape Gateway permanently for all future and existing tapes',
      'Ship the data on an AWS Snowball Edge device and store it in S3 Glacier Deep Archive',
      'Upload the data over the internet to S3 Standard',
      'Keep the tape library on-premises and back it up to EBS'
    ),
    correct: ['b'],
    explanation: 'A one-time Snowball Edge transfer followed by S3 Glacier Deep Archive minimizes both transfer effort and long-term storage cost for cold archival data. A permanent Tape Gateway adds ongoing cost for a one-time migration, S3 Standard is expensive for cold data, and EBS is not a low-cost archive target.',
    references: [REF.SNOWBALL, REF.S3_STORAGE_CLASSES],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must store backup data that is accessed only during occasional audits, where a retrieval time of several hours is acceptable, at the lowest possible cost while still being more available than a single AZ. Which S3 storage class should be selected?',
    options: opts4(
      'S3 One Zone-IA',
      'S3 Glacier Flexible Retrieval',
      'S3 Standard',
      'S3 Standard-IA'
    ),
    correct: ['b'],
    explanation: 'S3 Glacier Flexible Retrieval offers very low storage cost with multi-AZ durability and supports retrievals in minutes to hours, fitting infrequent audit access. One Zone-IA is single-AZ (less available), while Standard and Standard-IA cost significantly more for rarely accessed backups.',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect wants to reduce data-transfer costs for a video platform that serves large files repeatedly to the same regional audiences directly from Amazon S3. Which change reduces cost the MOST?',
    options: opts4(
      'Serve the videos through Amazon CloudFront so repeat requests are served from cached edge locations',
      'Move the S3 bucket to S3 One Zone-IA',
      'Enable S3 Requester Pays for all viewers',
      'Increase the S3 object size by combining videos'
    ),
    correct: ['a'],
    explanation: 'CloudFront caches popular objects at the edge so repeated requests are served from cache, reducing S3 GET requests and origin data-transfer-out costs while improving performance. One Zone-IA lowers storage but not egress, Requester Pays is inappropriate for public viewers, and combining videos does not cut transfer cost.',
    references: [REF.CLOUDFRONT],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company runs an Amazon RDS database for a non-production reporting environment that is idle most of the time with unpredictable, intermittent usage. A solutions architect must minimize database cost. Which option is MOST cost-effective?',
    options: opts4(
      'A large Multi-AZ RDS instance running continuously',
      'Amazon Aurora Serverless v2, which scales capacity with demand and down during idle periods',
      'A fleet of read replicas to spread the load',
      'A three-year Reserved Instance for the database'
    ),
    correct: ['b'],
    explanation: 'Aurora Serverless v2 automatically scales database capacity to match intermittent demand and scales down when idle, so you pay for actual usage rather than a constantly running instance. A continuously running Multi-AZ instance, read replica fleet, or a three-year RI all incur cost during the long idle periods.',
    references: [REF.AURORA],
    isTeaser: false
  }
];
