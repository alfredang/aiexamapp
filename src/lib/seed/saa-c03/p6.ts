import { QType } from '@prisma/client';
import { Q, opts4, opts5, SECURE, RESILIENT, PERF, COST, REF } from './types';

export const P6: Q[] = [
  // ---------------------------------------------------------------------------
  // SECURE — Design Secure Architectures (20)
  // ---------------------------------------------------------------------------
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A compliance team requires that backups stored by AWS Backup cannot be deleted by anyone, including the account root user or AWS Support, for a 7-year retention period. Which configuration meets this requirement?',
    options: opts4(
      'Enable AWS Backup Vault Lock in compliance mode with a minimum and maximum retention period',
      'Apply an IAM policy that denies the backup:DeleteRecoveryPoint action to all users',
      'Enable AWS Backup Vault Lock in governance mode and grant deletion only to administrators',
      'Store the backups in an S3 bucket with versioning and MFA delete enabled'
    ),
    correct: ['a'],
    explanation: 'AWS Backup Vault Lock in compliance mode makes the lock immutable once the cooling-off period passes — no one, not even the root user or AWS, can delete recovery points or change the policy before retention expires. Governance mode can be bypassed by privileged principals. IAM policies can be modified, and S3 settings do not protect AWS Backup recovery points.',
    references: [REF.BACKUP],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application running on EC2 instances must read objects from a private S3 bucket without embedding long-term credentials. Which approach is the AWS-recommended best practice?',
    options: opts4(
      'Attach an IAM role to the EC2 instances granting s3:GetObject on the bucket',
      'Store an IAM user access key in the application configuration file',
      'Use the EC2 instance key pair to sign S3 requests',
      'Place AWS credentials in an environment variable on each instance'
    ),
    correct: ['a'],
    explanation: 'An IAM role attached to an instance profile delivers automatically rotated temporary credentials through the instance metadata service, eliminating static keys. Storing access keys in files or environment variables and using key pairs for API auth are insecure and not recommended.',
    references: [REF.IAM_ROLES],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company encrypts RDS snapshots with a customer managed AWS KMS key and copies them to a DR Region for recovery. The cross-Region copy fails. What is the most likely cause?',
    options: opts4(
      'A KMS key must exist in the destination Region and be specified for the copy because KMS keys are Region-scoped',
      'RDS snapshots cannot be copied across Regions when encrypted',
      'The destination Region must use the same AWS account',
      'Cross-Region snapshot copies require AWS Backup, not native RDS copy'
    ),
    correct: ['a'],
    explanation: 'KMS keys are Region-specific. When copying an encrypted snapshot to another Region you must specify a KMS key that exists in the destination Region; the snapshot is re-encrypted with that key. Encrypted snapshots can be copied cross-Region and across accounts when permissions allow.',
    references: [REF.KMS, REF.RDS_MULTI_AZ],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must allow EC2 instances in private subnets to retrieve database credentials securely with automatic rotation. Which service should be used?',
    options: opts4(
      'AWS Secrets Manager with rotation enabled and access through a VPC interface endpoint',
      'AWS Systems Manager Parameter Store standard parameters without encryption',
      'An encrypted S3 object containing the credentials',
      'A hardcoded credential in the launch template user data'
    ),
    correct: ['a'],
    explanation: 'Secrets Manager natively supports scheduled automatic rotation for database credentials, and an interface VPC endpoint lets private instances retrieve secrets without internet access. Unencrypted Parameter Store, S3 objects, and user-data hardcoding are insecure and lack managed rotation.',
    references: [REF.SECRETS_MANAGER],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A security team wants to centrally restrict all member accounts in an AWS Organization so they cannot disable AWS CloudTrail or leave the organization, regardless of their IAM permissions. Which two actions accomplish this? (Choose two.)',
    options: opts5(
      'Attach a service control policy (SCP) that denies cloudtrail:StopLogging and cloudtrail:DeleteTrail',
      'Attach an SCP that denies organizations:LeaveOrganization',
      'Apply an IAM permissions boundary in the management account',
      'Enable MFA on every IAM user in member accounts',
      'Create a deny rule in a network ACL for the CloudTrail endpoint'
    ),
    correct: ['a', 'b'],
    explanation: 'SCPs set the maximum permissions for member accounts and apply even to account administrators, so denying CloudTrail stop/delete actions and the LeaveOrganization action enforces the guardrails centrally. Permissions boundaries apply per-identity, MFA does not restrict actions, and network ACLs do not control API authorization.',
    references: [REF.ORGANIZATIONS_SCP],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A web application behind an Application Load Balancer is being targeted by SQL injection and cross-site scripting attempts. Which service should be deployed to filter these malicious requests?',
    options: opts4(
      'AWS WAF with managed rule groups associated to the ALB',
      'AWS Shield Standard only',
      'A security group rule denying the attacker IP range',
      'Amazon GuardDuty threat detection'
    ),
    correct: ['a'],
    explanation: 'AWS WAF inspects HTTP(S) requests at layer 7 and its AWS Managed Rules include protections for SQL injection and XSS, attachable to an ALB. Shield Standard addresses DDoS, security groups only filter by IP/port, and GuardDuty detects but does not block requests.',
    references: [REF.WAF],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An organization needs S3 objects to be encrypted with a key that they fully control, including the ability to audit every decrypt call and disable the key in an incident. Which encryption option meets this?',
    options: opts4(
      'Server-side encryption with a customer managed AWS KMS key (SSE-KMS)',
      'Server-side encryption with Amazon S3 managed keys (SSE-S3)',
      'Client-side encryption with no key management',
      'Default encryption disabled, relying on bucket policy only'
    ),
    correct: ['a'],
    explanation: 'A customer managed KMS key gives the organization control over key policy, rotation, and the ability to disable the key, and every cryptographic operation is logged in CloudTrail. SSE-S3 keys are AWS-managed with no per-call audit or disable control.',
    references: [REF.KMS, REF.S3_STORAGE_CLASSES],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants EC2 instances in a private subnet to access Amazon DynamoDB without traversing the public internet or a NAT gateway. Which solution should be implemented?',
    options: opts4(
      'A gateway VPC endpoint for DynamoDB added to the subnet route table',
      'An internet gateway attached to the private subnet',
      'A NAT gateway in the private subnet',
      'A Direct Connect connection to DynamoDB'
    ),
    correct: ['a'],
    explanation: 'DynamoDB and S3 support gateway VPC endpoints, which add a route so traffic to the service stays on the AWS network with no NAT or internet gateway and no additional charge. NAT and internet gateways send traffic over the internet path; Direct Connect is for on-premises connectivity.',
    references: [REF.GATEWAY_ENDPOINT],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A backup vault in the DR Region must only accept copied recovery points and prevent accidental early deletion while still allowing the security team an emergency override during the first 3 days after a policy change. Which AWS Backup configuration fits?',
    options: opts4(
      'AWS Backup Vault Lock in governance mode with a retention policy',
      'AWS Backup Vault Lock in compliance mode immediately enforced',
      'No vault lock; rely on IAM deny policies only',
      'S3 Object Lock applied to the backup vault'
    ),
    correct: ['a'],
    explanation: 'Governance mode prevents deletions for users without special permissions but allows accounts with the backup vault-lock override permission to manage the lock, suitable when an emergency override is needed. Compliance mode is immutable with no override; IAM-only is bypassable; S3 Object Lock does not apply to backup vaults.',
    references: [REF.BACKUP],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must ensure that an S3 bucket used for sensitive backups is never accidentally made public, account-wide. Which feature enforces this?',
    options: opts4(
      'Enable S3 Block Public Access at the account level',
      'Add a bucket policy allowing only the bucket owner',
      'Enable S3 Versioning on the bucket',
      'Use S3 Object Lock in compliance mode'
    ),
    correct: ['a'],
    explanation: 'S3 Block Public Access at the account level overrides any bucket-level ACL or policy that would grant public access, providing a definitive guardrail. Bucket policies can be edited, versioning protects against overwrite/delete, and Object Lock controls retention, not public exposure.',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A cross-account access requirement states that a partner account must read objects in a specific S3 bucket. Which two elements together implement least-privilege access? (Choose two.)',
    options: opts5(
      'A bucket policy granting s3:GetObject to the partner account principal on the specific bucket',
      'An IAM role in the partner account that the partner assumes to access the bucket',
      'Making the bucket public so the partner can read it',
      'Sharing the bucket owner root access keys with the partner',
      'A NAT gateway in the partner VPC'
    ),
    correct: ['a', 'b'],
    explanation: 'Cross-account S3 access is granted by a resource-based bucket policy that trusts the partner account, combined with an IAM role/identity in the partner account that has permission to call S3. Making the bucket public or sharing root keys violates least privilege; a NAT gateway is unrelated to authorization.',
    references: [REF.IAM_POLICY_EVAL],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company needs to grant temporary, audited access to production EC2 instances for troubleshooting without managing SSH keys or opening port 22. Which solution is best?',
    options: opts4(
      'AWS Systems Manager Session Manager with IAM-based access and CloudTrail logging',
      'A bastion host with shared SSH keys',
      'Opening port 22 to the corporate CIDR in the security group',
      'A site-to-site VPN with static credentials'
    ),
    correct: ['a'],
    explanation: 'Session Manager provides shell access through the SSM agent with no inbound ports or SSH keys, IAM-controlled authorization, and full session logging to CloudTrail/S3/CloudWatch. Bastion hosts and open port 22 increase attack surface and key-management burden.',
    references: [REF.IAM_ROLES],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A regulated workload requires that data in transit between application tier and Aurora is encrypted and that the database enforces SSL/TLS for all connections. Which approach achieves this?',
    options: opts4(
      'Require SSL via the DB cluster parameter group and connect using the Amazon RDS certificate bundle',
      'Place the database in a private subnet only',
      'Enable encryption at rest with KMS on the cluster',
      'Use a security group that restricts the database port'
    ),
    correct: ['a'],
    explanation: 'Setting rds.force_ssl (or equivalent) in the Aurora/RDS parameter group forces all client connections to use TLS, and clients validate the connection with the AWS RDS CA certificate. Private subnets, KMS at-rest encryption, and security groups do not enforce in-transit encryption.',
    references: [REF.AURORA, REF.RDS_MULTI_AZ],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An architect wants to centrally detect anomalous API activity and potential account compromise across multiple AWS accounts with minimal operational overhead. Which service should be enabled?',
    options: opts4(
      'Amazon GuardDuty with the organization delegated administrator',
      'AWS Config rules only',
      'AWS CloudTrail data events only',
      'Amazon Inspector network reachability'
    ),
    correct: ['a'],
    explanation: 'GuardDuty continuously analyzes CloudTrail, VPC Flow Logs, and DNS logs using threat intelligence and machine learning, and can be managed organization-wide via a delegated administrator. Config tracks configuration compliance, CloudTrail records API calls without analysis, and Inspector assesses workload vulnerabilities.',
    references: [REF.WELL_ARCHITECTED],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company replicates production S3 backup objects to a separate AWS account in another Region for ransomware resilience. The destination account must own the replicated objects and the source account must not be able to delete them. Which combination is correct?',
    options: opts4(
      'S3 Replication with the owner override to destination bucket owner, plus S3 Object Lock and a restrictive bucket policy in the destination account',
      'S3 Cross-Region Replication with no ownership change',
      'AWS DataSync scheduled hourly with delete enabled',
      'Manual aws s3 sync from a cron job on an EC2 instance'
    ),
    correct: ['a'],
    explanation: 'Replication with the change-object-ownership (owner override) option transfers ownership to the destination account, and Object Lock plus a tight bucket policy in that separate account makes the copies immutable and out of the source account control — a strong air-gap pattern against ransomware. The other options keep source ownership or allow deletes.',
    references: [REF.S3_OBJECT_LOCK, REF.S3_STORAGE_CLASSES],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must ensure Lambda functions can access an RDS database in a private subnet while still allowing the function to call AWS Secrets Manager. Which configuration is required?',
    options: opts4(
      'Configure the Lambda function in the VPC and add an interface VPC endpoint for Secrets Manager',
      'Run the Lambda function outside the VPC and open the database to 0.0.0.0/0',
      'Attach an internet gateway to the private subnet',
      'Disable the function execution role'
    ),
    correct: ['a'],
    explanation: 'A VPC-attached Lambda function can reach the private RDS instance, but VPC-bound functions lose default internet access, so an interface VPC endpoint for Secrets Manager keeps the secret retrieval private. Exposing the database publicly or attaching an internet gateway to a private subnet are insecure.',
    references: [REF.LAMBDA, REF.SECRETS_MANAGER],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An enterprise wants to prevent member accounts from creating resources in Regions outside the approved set, as a guardrail that cannot be overridden by account admins. Which control should be used?',
    options: opts4(
      'A service control policy with a Deny on all actions when aws:RequestedRegion is not in the allowed list',
      'An IAM managed policy attached to all users',
      'An AWS Config rule that flags non-compliant Regions',
      'A CloudWatch alarm on resource creation'
    ),
    correct: ['a'],
    explanation: 'SCPs using the aws:RequestedRegion condition deny actions outside approved Regions for every principal in the account, including administrators. IAM policies are editable by admins, and Config/CloudWatch only detect after the fact rather than prevent.',
    references: [REF.ORGANIZATIONS_SCP],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company must protect a static website served from CloudFront so that the S3 origin bucket can only be accessed through CloudFront and not directly. Which feature should be configured?',
    options: opts4(
      'CloudFront Origin Access Control (OAC) with a bucket policy restricting access to the distribution',
      'A public S3 bucket with index document enabled',
      'An EC2 reverse proxy in front of S3',
      'S3 Transfer Acceleration on the bucket'
    ),
    correct: ['a'],
    explanation: 'Origin Access Control lets CloudFront sign requests to the S3 origin, and the bucket policy then denies all access except from that distribution, keeping the bucket private. A public bucket defeats the requirement; a reverse proxy adds cost/complexity; Transfer Acceleration is unrelated to access control.',
    references: [REF.CLOUDFRONT, REF.S3_STORAGE_CLASSES],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A financial firm must guarantee that audit-log objects written to S3 cannot be overwritten or deleted by anyone for exactly 5 years to satisfy regulatory WORM requirements. Which configuration is appropriate?',
    options: opts4(
      'S3 Object Lock in compliance mode with a 5-year default retention period on a versioned bucket',
      'S3 Object Lock in governance mode with a legal hold',
      'S3 Versioning with MFA delete enabled',
      'S3 lifecycle policy that transitions objects to Glacier after 5 years'
    ),
    correct: ['a'],
    explanation: 'Object Lock compliance mode enforces write-once-read-many: no user, including the root account, can shorten retention or delete the object version before the period elapses, satisfying strict WORM rules. Governance mode is overridable, versioning/MFA delete is not WORM, and lifecycle policies do not provide immutability.',
    references: [REF.S3_OBJECT_LOCK],
    isTeaser: false
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect needs to ensure that all traffic between an on-premises data center and a VPC is private and encrypted, with a consistent dedicated bandwidth for a DR replication link. Which combination is most appropriate?',
    options: opts4(
      'AWS Direct Connect with an IPsec VPN running over it (Direct Connect + VPN)',
      'A public internet connection with no encryption',
      'A NAT gateway with Elastic IPs',
      'VPC peering between the data center and VPC'
    ),
    correct: ['a'],
    explanation: 'Direct Connect provides dedicated, consistent bandwidth, and layering an IPsec VPN over the Direct Connect link adds encryption in transit for the private connection — a common pattern for sensitive DR replication. NAT gateways and VPC peering do not connect on-premises networks; plain internet lacks consistency and privacy.',
    references: [REF.DIRECT_CONNECT],
    isTeaser: false
  },

  // ---------------------------------------------------------------------------
  // RESILIENT — Design Resilient Architectures (17)
  // ---------------------------------------------------------------------------
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company runs a critical web application in one Region and needs a DR strategy with an RTO of a few minutes and an RPO of seconds, while keeping standby costs lower than a full active-active deployment. Which DR strategy fits best?',
    options: opts4(
      'Warm standby — a scaled-down but always-running copy in a second Region that is scaled up on failover',
      'Backup and restore from cross-Region snapshots',
      'Pilot light with only the database replicating and no running compute',
      'Single-Region Multi-AZ only'
    ),
    correct: ['a'],
    explanation: 'Warm standby keeps a minimal but functional environment continuously running in the DR Region with data replicating, so failover requires only scaling up — meeting low RTO/RPO at lower cost than active-active. Backup and restore and pilot light have longer RTOs; Multi-AZ alone does not survive a Regional failure.',
    references: [REF.WELL_ARCHITECTED],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An RDS for PostgreSQL database must automatically fail over to a standby with no data loss if the primary Availability Zone fails. Which configuration provides this?',
    options: opts4(
      'Enable a Multi-AZ deployment for the RDS instance',
      'Create a cross-Region read replica',
      'Schedule automated snapshots every hour',
      'Enable storage auto scaling'
    ),
    correct: ['a'],
    explanation: 'RDS Multi-AZ synchronously replicates to a standby in another AZ and performs automatic failover with no data loss when the primary AZ fails. Read replicas are asynchronous and for scaling reads, snapshots are point-in-time, and storage auto scaling addresses capacity, not availability.',
    references: [REF.RDS_MULTI_AZ],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A global application needs a managed relational database with a primary Region for writes and the ability to fail over to another Region in under a minute with typical cross-Region replication lag under one second. Which solution best meets this?',
    options: opts4(
      'Amazon Aurora Global Database',
      'Amazon RDS Multi-AZ in a single Region',
      'Amazon DynamoDB with on-demand capacity',
      'Amazon RDS with a manual cross-Region snapshot copy'
    ),
    correct: ['a'],
    explanation: 'Aurora Global Database replicates to secondary Regions with typically sub-second lag and supports managed planned failover/unplanned promotion in roughly a minute, designed for low RPO/RTO global resilience. RDS Multi-AZ is single-Region, snapshot copies have high RPO, and DynamoDB is non-relational.',
    references: [REF.AURORA],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants Route 53 to send all users to a primary Region and automatically redirect them to a standby Region only when the primary becomes unhealthy. Which Route 53 configuration achieves this?',
    options: opts4(
      'Failover routing policy with health checks on the primary endpoint',
      'Weighted routing split 50/50 between Regions',
      'Latency-based routing between the two Regions',
      'Simple routing with multiple IP values'
    ),
    correct: ['a'],
    explanation: 'A failover routing policy serves the primary record while its health check passes and switches to the secondary record when the primary is unhealthy — the classic active-passive DNS pattern. Weighted and latency routing distribute traffic continuously rather than failing over; simple routing has no health awareness.',
    references: [REF.ROUTE53],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A stateless web tier on EC2 must remain available if an entire Availability Zone fails and must automatically replace failed instances. Which two design elements are required? (Choose two.)',
    options: opts5(
      'An Auto Scaling group spanning at least two Availability Zones',
      'An Application Load Balancer distributing traffic across the AZs',
      'A single large EC2 instance with an Elastic IP',
      'An RDS Single-AZ database in one AZ',
      'A NAT instance in a single subnet'
    ),
    correct: ['a', 'b'],
    explanation: 'An Auto Scaling group across multiple AZs replaces unhealthy instances and maintains capacity if an AZ fails, while an ALB health-checks targets and routes only to healthy AZs. A single instance, Single-AZ database, or single NAT instance are all single points of failure.',
    references: [REF.AUTOSCALING, REF.ALB],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company wants the lowest-cost DR strategy for a non-critical internal application that can tolerate an RTO of several hours and an RPO of 24 hours. Which approach is most appropriate?',
    options: opts4(
      'Backup and restore using AWS Backup with cross-Region copy',
      'Active-active multi-Region deployment',
      'Warm standby with a continuously running scaled-down stack',
      'Pilot light with always-on replicating databases'
    ),
    correct: ['a'],
    explanation: 'For relaxed RTO/RPO targets, backup and restore — taking regular backups and copying them to another Region for restoration when needed — is the least expensive strategy because no standby infrastructure runs continuously. Active-active, warm standby, and pilot light all incur ongoing standby costs unnecessary here.',
    references: [REF.BACKUP, REF.WELL_ARCHITECTED],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An on-premises VMware-based application must be migrated to AWS with a DR-style cutover that minimizes downtime by continuously replicating servers and allowing fast launch of recovery instances. Which AWS service is purpose-built for this?',
    options: opts4(
      'AWS Elastic Disaster Recovery (AWS DRS)',
      'AWS Backup',
      'Amazon S3 cross-Region replication',
      'AWS Database Migration Service'
    ),
    correct: ['a'],
    explanation: 'AWS Elastic Disaster Recovery continuously block-level replicates source servers into AWS staging and can launch recovery instances quickly, supporting low-RTO failover and cutover. AWS Backup is point-in-time backup, S3 replication only handles objects, and DMS migrates databases, not whole servers.',
    references: [{ label: 'AWS Elastic Disaster Recovery — User Guide', url: 'https://docs.aws.amazon.com/drs/latest/userguide/what-is-drs.html' }],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect needs decoupled, durable processing so that if the consumer fleet goes down, incoming work is not lost and is processed when it recovers. Which service provides this buffering?',
    options: opts4(
      'Amazon SQS standard queue between producers and consumers',
      'A direct synchronous API call from producers to consumers',
      'Amazon SNS fan-out without a queue',
      'An EC2 cron job polling a shared file'
    ),
    correct: ['a'],
    explanation: 'An SQS queue durably stores messages until a consumer processes and deletes them, so a consumer outage simply delays processing rather than losing work, decoupling the tiers. Synchronous calls fail when the consumer is down, SNS alone does not persist undelivered messages, and a shared file is not durable or scalable.',
    references: [REF.SQS],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A pilot light DR setup keeps a replicated RDS database running in the DR Region but no application servers. To meet the target RTO, the application tier must launch quickly during a disaster. Which preparation best supports this?',
    options: opts4(
      'Pre-create AMIs, launch templates, and infrastructure-as-code so compute can be provisioned rapidly on failover',
      'Keep the full production fleet running at scale in the DR Region',
      'Rely on manual installation of the application after the disaster',
      'Disable replication to reduce costs until a disaster occurs'
    ),
    correct: ['a'],
    explanation: 'Pilot light keeps core data replicating while compute is dormant; pre-baked AMIs, launch templates, and IaC let the application tier be spun up rapidly to meet RTO. Running the full fleet is warm/active (more cost), manual installation is slow, and disabling replication breaks the RPO.',
    references: [REF.WELL_ARCHITECTED],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company stores user-uploaded files that must remain available even if one Availability Zone is lost and must be accessible by EC2 instances in multiple AZs simultaneously. Which storage service should be used?',
    options: opts4(
      'Amazon EFS mounted across instances in multiple AZs',
      'A single Amazon EBS volume attached to one instance',
      'An instance store volume on each instance',
      'Amazon FSx for Lustre scratch file system'
    ),
    correct: ['a'],
    explanation: 'Amazon EFS is a regional, multi-AZ shared file system that many EC2 instances across AZs can mount concurrently, surviving an AZ failure. A single EBS volume is AZ-bound and single-attach (general case), instance store is ephemeral, and Lustre scratch file systems are not designed for durable shared storage.',
    references: [REF.EFS],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A company wants near-zero RPO for a DynamoDB-backed application with read/write availability in two Regions simultaneously. Which two features should be used? (Choose two.)',
    options: opts5(
      'DynamoDB global tables for multi-Region, multi-active replication',
      'Point-in-time recovery enabled on the tables',
      'A single-Region table with on-demand capacity only',
      'Manual export to S3 once per day',
      'A DynamoDB Accelerator (DAX) cluster for replication'
    ),
    correct: ['a', 'b'],
    explanation: 'Global tables provide multi-Region, active-active replication with low replication lag for resilience, and point-in-time recovery protects against accidental writes/corruption with continuous backups. A single-Region table is not multi-Region resilient, daily exports have high RPO, and DAX is a cache, not a replication mechanism.',
    references: [REF.DYNAMODB],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must protect against accidental deletion of objects in an S3 backup bucket while allowing recovery of previous versions. Which feature should be enabled?',
    options: opts4(
      'S3 Versioning so deleted/overwritten objects can be restored from prior versions',
      'S3 Transfer Acceleration',
      'S3 Requester Pays',
      'S3 Intelligent-Tiering'
    ),
    correct: ['a'],
    explanation: 'With versioning, a delete creates a delete marker and overwrites preserve prior versions, allowing recovery from accidental changes. Transfer Acceleration speeds uploads, Requester Pays shifts billing, and Intelligent-Tiering optimizes cost — none provide deletion protection/recovery.',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company runs an active-passive multi-Region architecture. During a DR test the secondary Region is healthy but Route 53 does not fail traffic over. Which is the most likely root cause?',
    options: opts4(
      'The Route 53 health check on the primary endpoint is still reporting healthy, so failover never triggers',
      'The secondary Region has no internet gateway',
      'DynamoDB global tables are disabled',
      'The secondary ALB uses a different instance type'
    ),
    correct: ['a'],
    explanation: 'Failover routing only redirects to the secondary record when the primary record health check fails; if the primary still reports healthy (e.g., health-check target or path is wrong), Route 53 keeps serving the primary. The other options would not by themselves prevent DNS failover behavior.',
    references: [REF.ROUTE53],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application processes order events that must never be lost and must be processed exactly once in the order received. Which AWS messaging option best meets this?',
    options: opts4(
      'Amazon SQS FIFO queue with content-based deduplication',
      'Amazon SQS standard queue',
      'Amazon SNS standard topic',
      'A direct HTTP POST to the consumer'
    ),
    correct: ['a'],
    explanation: 'SQS FIFO queues guarantee ordering and exactly-once processing within a message group, and deduplication prevents duplicates — ideal for ordered, no-loss order events. Standard SQS/SNS are at-least-once and best-effort ordering; a direct POST has no durability.',
    references: [REF.SQS],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company wants to centrally orchestrate, schedule, and monitor backups for EC2, EBS, RDS, DynamoDB, and EFS across multiple accounts, with cross-Region copies for DR. Which service should be used?',
    options: opts4(
      'AWS Backup with backup plans, backup vaults, and cross-Region copy actions',
      'Manual snapshots scheduled via separate Lambda functions per service',
      'S3 lifecycle policies on each service',
      'AWS Elastic Disaster Recovery for all resource types'
    ),
    correct: ['a'],
    explanation: 'AWS Backup centralizes policy-based backup scheduling and retention for many AWS services, supports cross-account/cross-Region copy for DR, and reduces operational overhead versus per-service scripting. S3 lifecycle does not back up these services, and DRS is for server replication, not unified backup.',
    references: [REF.BACKUP],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A web tier must continue serving traffic even if some EC2 instances become unhealthy, automatically routing requests away from failed instances. Which feature provides this?',
    options: opts4(
      'Elastic Load Balancer health checks that stop routing to unhealthy targets',
      'An Elastic IP attached to one instance',
      'A CloudFront cache behavior',
      'An S3 static website fallback'
    ),
    correct: ['a'],
    explanation: 'Load balancer health checks continuously probe registered targets and route traffic only to healthy ones, providing automatic fault isolation within the fleet. An Elastic IP pins to one instance, CloudFront caches content, and an S3 fallback is not an automatic instance-level failover mechanism.',
    references: [REF.ALB],
    isTeaser: false
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company needs an RTO of near zero and an RPO of near zero for a mission-critical application and accepts the highest cost. Which DR strategy should be implemented?',
    options: opts4(
      'Active-active (multi-site) deployment serving production traffic from multiple Regions',
      'Pilot light with dormant compute',
      'Backup and restore',
      'Warm standby scaled down'
    ),
    correct: ['a'],
    explanation: 'An active-active multi-site architecture runs production workloads in multiple Regions simultaneously with data continuously replicated, so a Regional failure causes minimal to no disruption — the lowest RTO/RPO at the highest cost. The other strategies trade cost for higher recovery times.',
    references: [REF.WELL_ARCHITECTED],
    isTeaser: false
  },

  // ---------------------------------------------------------------------------
  // PERF — Design High-Performing Architectures (16)
  // ---------------------------------------------------------------------------
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A read-heavy reporting workload on Amazon RDS is overwhelming the primary instance with analytical SELECT queries. Which solution offloads reads with the least application change?',
    options: opts4(
      'Add RDS read replicas and direct reporting queries to the replica endpoint',
      'Increase the RDS instance to the largest size only',
      'Enable Multi-AZ for the database',
      'Migrate the database to a single larger EBS volume'
    ),
    correct: ['a'],
    explanation: 'Read replicas asynchronously copy the primary and serve read traffic, offloading analytical queries while requiring only that reporting connects to the replica endpoint. Scaling up alone has limits and cost, Multi-AZ is for availability (standby is not readable in classic RDS), and bigger storage does not offload reads.',
    references: [REF.RDS_READ_REPLICA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A global user base experiences high latency loading dynamic and static content from a single-Region web application. Which solution most effectively reduces latency worldwide?',
    options: opts4(
      'Serve content through Amazon CloudFront with caching and edge-optimized delivery',
      'Move all instances to a larger EC2 type',
      'Use an internal Application Load Balancer',
      'Increase the EBS volume IOPS'
    ),
    correct: ['a'],
    explanation: 'CloudFront caches and accelerates content from edge locations close to users and uses the AWS backbone for cache misses, dramatically lowering global latency for both static and dynamic content. Larger instances, internal ALBs, and higher IOPS do not address geographic distance.',
    references: [REF.CLOUDFRONT],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A high-performance computing workload requires sub-millisecond access to a shared file system at hundreds of GB/s throughput, sourced from an S3 data set. Which storage service is the best fit?',
    options: opts4(
      'Amazon FSx for Lustre linked to the S3 bucket',
      'Amazon EFS Standard',
      'Amazon S3 with Transfer Acceleration',
      'Amazon EBS gp3 volumes'
    ),
    correct: ['a'],
    explanation: 'FSx for Lustre is purpose-built for HPC and machine learning with sub-millisecond latency and very high throughput, and it can be linked to an S3 bucket to lazily load and write back data. EFS, S3, and EBS do not match Lustre HPC throughput/latency characteristics.',
    references: [REF.FSX_LUSTRE],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A database-backed web app suffers from repeated identical queries causing high read latency at peak. Which in-memory caching service reduces database load with microsecond latency?',
    options: opts4(
      'Amazon ElastiCache (Redis or Memcached) in front of the database',
      'Amazon Athena',
      'Amazon Redshift',
      'Amazon EBS Provisioned IOPS'
    ),
    correct: ['a'],
    explanation: 'ElastiCache provides an in-memory cache that serves frequently requested data in microseconds, offloading repetitive reads from the database. Athena queries S3, Redshift is a data warehouse, and Provisioned IOPS improves disk throughput, not query caching.',
    references: [{ label: 'Amazon ElastiCache — User Guide', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/WhatIs.html' }],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A spiky, unpredictable workload must scale compute automatically based on demand while keeping performance steady. Which two approaches achieve elastic, demand-driven scaling? (Choose two.)',
    options: opts5(
      'EC2 Auto Scaling with target tracking on CPU/request metrics',
      'AWS Lambda for event-driven processing that scales with concurrency',
      'A fixed fleet of the largest instance type',
      'A single EC2 instance with a larger EBS volume',
      'Manual instance launches during anticipated peaks'
    ),
    correct: ['a', 'b'],
    explanation: 'EC2 Auto Scaling with target-tracking policies adds/removes capacity to hold a metric target, and Lambda automatically scales execution with incoming events — both deliver demand-driven elasticity. A fixed large fleet, a single instance, and manual launches do not scale automatically with unpredictable demand.',
    references: [REF.AUTOSCALING, REF.LAMBDA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A gaming company needs to route players to the nearest healthy Regional endpoint with static anycast IPs and fast failover for low-latency TCP/UDP traffic. Which service should be used?',
    options: opts4(
      'AWS Global Accelerator',
      'Amazon CloudFront',
      'An internal Network Load Balancer',
      'Amazon Route 53 weighted routing'
    ),
    correct: ['a'],
    explanation: 'Global Accelerator provides static anycast IPs and routes traffic over the AWS global network to the optimal healthy endpoint with fast failover, ideal for latency-sensitive TCP/UDP applications like games. CloudFront targets HTTP content caching, and Route 53 failover is DNS-based with slower propagation.',
    references: [REF.GLOBAL_ACCELERATOR],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application needs a fully managed, single-digit-millisecond NoSQL database that scales seamlessly to millions of requests per second with no capacity planning. Which service should be selected?',
    options: opts4(
      'Amazon DynamoDB with on-demand capacity mode',
      'Amazon RDS for MySQL',
      'Amazon Redshift',
      'Self-managed Cassandra on EC2'
    ),
    correct: ['a'],
    explanation: 'DynamoDB is a fully managed key-value/document database delivering single-digit-millisecond latency at virtually any scale, and on-demand mode removes capacity planning. RDS is relational, Redshift is analytical, and self-managed Cassandra adds operational burden.',
    references: [REF.DYNAMODB],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A streaming analytics pipeline must ingest hundreds of thousands of events per second with ordered, replayable consumption by multiple independent applications. Which service is the best fit?',
    options: opts4(
      'Amazon Kinesis Data Streams',
      'Amazon SQS standard queue',
      'Amazon SNS topic',
      'AWS Batch'
    ),
    correct: ['a'],
    explanation: 'Kinesis Data Streams handles high-throughput, ordered records within shards and retains data so multiple consumers can independently read and replay the stream. SQS does not provide ordered multi-consumer replay, SNS is pub/sub push, and AWS Batch runs batch jobs, not streaming ingestion.',
    references: [REF.KINESIS],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An EBS-backed transactional database needs consistent low-latency I/O with provisioned throughput independent of volume size. Which EBS volume type should be chosen?',
    options: opts4(
      'EBS gp3 with provisioned IOPS and throughput',
      'EBS sc1 cold HDD',
      'EBS st1 throughput-optimized HDD',
      'Instance store volumes'
    ),
    correct: ['a'],
    explanation: 'gp3 lets you provision IOPS and throughput independently of capacity, giving consistent low-latency performance for transactional databases at a good price/performance point (io2 Block Express is also valid for very high IOPS). HDD types (sc1/st1) are for throughput/archival, and instance store is ephemeral.',
    references: [REF.EBS],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A latency-sensitive microservice fleet behind a load balancer must distribute millions of TCP connections per second with ultra-low latency and preserve client source IPs. Which load balancer is most appropriate?',
    options: opts4(
      'Network Load Balancer (NLB)',
      'Application Load Balancer (ALB)',
      'Classic Load Balancer',
      'Gateway Load Balancer'
    ),
    correct: ['a'],
    explanation: 'NLB operates at layer 4, handles millions of requests per second with ultra-low latency, and can preserve the client source IP, ideal for high-performance TCP workloads. ALB is layer 7 (HTTP), Classic is legacy, and Gateway Load Balancer is for inline virtual appliances.',
    references: [REF.NLB],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A relational database is read-bound and globally accessed. Which two strategies improve read performance and reduce primary load? (Choose two.)',
    options: opts5(
      'Add Aurora Replicas (or RDS read replicas) to serve read traffic',
      'Place an ElastiCache caching layer in front of the database for hot reads',
      'Increase the database password complexity',
      'Switch the primary to a smaller instance class',
      'Disable automated backups'
    ),
    correct: ['a', 'b'],
    explanation: 'Read replicas distribute read queries away from the primary, and an ElastiCache layer serves frequently accessed data from memory, both cutting primary read load and latency. Password complexity, downsizing the primary, and disabling backups do not improve read performance.',
    references: [REF.RDS_READ_REPLICA],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants to run containerized microservices without managing EC2 servers or capacity, scaling with demand. Which compute option fits best?',
    options: opts4(
      'Amazon ECS or EKS on AWS Fargate',
      'A fixed fleet of self-managed EC2 instances',
      'AWS Elastic Beanstalk single-instance environment',
      'Amazon Lightsail virtual servers'
    ),
    correct: ['a'],
    explanation: 'Fargate runs containers serverlessly: no EC2 instances to patch or scale, and capacity scales per task with demand. A fixed EC2 fleet and Beanstalk single-instance require server management, and Lightsail is a simplified VPS not designed for elastic microservice orchestration.',
    references: [REF.FARGATE],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An analytics team queries large volumes of structured data stored in S3 ad hoc without managing infrastructure and wants to pay only per query scanned. Which service should be used?',
    options: opts4(
      'Amazon Athena with data partitioning and columnar formats',
      'Amazon RDS for PostgreSQL',
      'A self-managed Presto cluster on EC2',
      'Amazon DynamoDB scans'
    ),
    correct: ['a'],
    explanation: 'Athena is serverless and queries S3 data with standard SQL, charging per data scanned; partitioning and columnar formats like Parquet reduce scanned bytes and improve performance/cost. RDS requires loading data, a self-managed Presto cluster adds ops burden, and DynamoDB scans are inefficient for analytics.',
    references: [REF.ATHENA],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A large media file upload feature suffers slow uploads from users far from the bucket Region. Which S3 capability accelerates these long-distance uploads?',
    options: opts4(
      'Amazon S3 Transfer Acceleration over the CloudFront edge network',
      'S3 Requester Pays',
      'S3 Object Lock',
      'S3 Lifecycle policies'
    ),
    correct: ['a'],
    explanation: 'S3 Transfer Acceleration routes uploads through the nearest CloudFront edge location and over the AWS backbone, speeding long-distance transfers. Requester Pays is a billing feature, Object Lock is for immutability, and lifecycle policies manage storage tiering.',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A DynamoDB-backed application experiences hot read traffic on a small set of items causing throttling. Which solution improves read performance with microsecond latency and minimal code change?',
    options: opts4(
      'Add Amazon DynamoDB Accelerator (DAX) in front of the table',
      'Switch the table to provisioned mode with low capacity',
      'Add a global secondary index on the same key',
      'Migrate the table to Amazon RDS'
    ),
    correct: ['a'],
    explanation: 'DAX is a managed in-memory cache for DynamoDB that returns cached reads in microseconds and absorbs hot-key read traffic with an API-compatible client. Lowering provisioned capacity worsens throttling, a GSI on the same key does not relieve hot reads, and migrating to RDS is disproportionate.',
    references: [REF.DYNAMODB],
    isTeaser: false
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A serverless REST API must handle highly variable traffic with automatic scaling and pay-per-request pricing. Which combination is most appropriate?',
    options: opts4(
      'Amazon API Gateway integrated with AWS Lambda',
      'An Application Load Balancer in front of a fixed EC2 fleet',
      'A single EC2 instance running the API server',
      'Amazon EC2 Auto Scaling without a load balancer'
    ),
    correct: ['a'],
    explanation: 'API Gateway plus Lambda is a serverless pattern that scales automatically with request volume and bills per request/invocation, ideal for spiky API workloads. Fixed EC2 fleets and single instances require capacity management and do not scale to zero.',
    references: [REF.API_GATEWAY, REF.LAMBDA],
    isTeaser: false
  },

  // ---------------------------------------------------------------------------
  // COST — Design Cost-Optimized Architectures (12)
  // ---------------------------------------------------------------------------
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company runs a steady, predictable baseline of EC2 compute 24/7 across multiple instance families and Regions and wants the greatest discount with flexibility to change instance types. Which purchasing option is best?',
    options: opts4(
      'Compute Savings Plans for a 1- or 3-year commitment',
      'Standard Reserved Instances for a specific instance type and AZ',
      'On-Demand Instances for all workloads',
      'Spot Instances for the entire baseline'
    ),
    correct: ['a'],
    explanation: 'Compute Savings Plans give Reserved-Instance-level discounts in exchange for an hourly commitment while remaining flexible across instance family, size, Region, OS, and even Fargate/Lambda. Standard RIs lock you to a type/AZ, On-Demand has no discount, and Spot is unsuitable for an always-on baseline.',
    references: [REF.SAVINGS_PLANS, REF.EC2_PURCHASE],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A fault-tolerant batch processing job can be interrupted and resumed and runs at flexible times. Which EC2 purchasing option minimizes cost?',
    options: opts4(
      'Spot Instances',
      'On-Demand Instances',
      'Standard Reserved Instances',
      'Dedicated Hosts'
    ),
    correct: ['a'],
    explanation: 'Spot Instances offer up to ~90% savings versus On-Demand for interruption-tolerant, flexible workloads like batch processing. On-Demand and Reserved cost more, and Dedicated Hosts are for licensing/compliance, not cost minimization here.',
    references: [REF.EC2_PURCHASE],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company stores backups in S3 that are rarely accessed but must be retrievable within minutes when needed for compliance audits, and wants the lowest storage cost for that access pattern. Which storage class is most cost-effective?',
    options: opts4(
      'S3 Glacier Flexible Retrieval (or S3 Standard-IA for frequent enough access)',
      'S3 Standard',
      'S3 One Zone-IA only',
      'S3 Glacier Deep Archive with 12-hour retrieval'
    ),
    correct: ['a'],
    explanation: 'For rarely accessed backups needing minutes-level retrieval, S3 Glacier Flexible Retrieval (expedited retrievals in minutes) offers very low storage cost; Standard-IA fits if access is somewhat more frequent. S3 Standard is costliest, One Zone-IA lacks multi-AZ durability for backups, and Deep Archive retrieval is too slow (hours).',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company has unpredictable S3 access patterns and wants to automatically optimize storage cost without performance impact or retrieval fees. Which storage class should be used?',
    options: opts4(
      'S3 Intelligent-Tiering',
      'S3 Standard-IA',
      'S3 One Zone-IA',
      'S3 Glacier Deep Archive'
    ),
    correct: ['a'],
    explanation: 'S3 Intelligent-Tiering automatically moves objects between access tiers based on usage with no retrieval fees and no operational overhead, ideal for unknown or changing access patterns. The IA and Glacier classes have retrieval fees/latency and assume known patterns.',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A finance team wants proactive alerts when monthly spend is forecast to exceed budget and automated detection of unusual cost spikes. Which two AWS tools should be used? (Choose two.)',
    options: opts5(
      'AWS Budgets with forecasted and actual cost alerts',
      'AWS Cost Anomaly Detection',
      'Amazon CloudWatch billing dashboards only',
      'AWS Trusted Advisor support plan upgrade',
      'AWS Config configuration history'
    ),
    correct: ['a', 'b'],
    explanation: 'AWS Budgets sends alerts on actual or forecasted spend versus a defined budget, and Cost Anomaly Detection uses machine learning to flag unusual spend automatically. CloudWatch billing alarms are coarser, Trusted Advisor is advisory, and Config tracks configuration, not cost anomalies.',
    references: [REF.BUDGETS, REF.COST_EXPLORER],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants to analyze historical cost and usage trends and identify the highest-spending services to plan Savings Plans purchases. Which tool should be used?',
    options: opts4(
      'AWS Cost Explorer',
      'Amazon CloudWatch Logs Insights',
      'AWS CloudTrail event history',
      'AWS X-Ray service map'
    ),
    correct: ['a'],
    explanation: 'Cost Explorer visualizes historical spend and usage by service, tag, and time, and provides Savings Plans/RI recommendations to plan commitments. CloudWatch Logs Insights, CloudTrail, and X-Ray are for operational/audit/tracing data, not cost analysis.',
    references: [REF.COST_EXPLORER],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company runs many over-provisioned EC2 instances and wants automated, data-driven right-sizing recommendations to reduce cost while maintaining performance. Which service provides this?',
    options: opts4(
      'AWS Compute Optimizer',
      'AWS Budgets',
      'Amazon Inspector',
      'AWS Config'
    ),
    correct: ['a'],
    explanation: 'Compute Optimizer analyzes utilization metrics and recommends right-sized instance types (and other resources) to cut cost without sacrificing performance. Budgets tracks spend, Inspector assesses security vulnerabilities, and Config tracks configuration compliance.',
    references: [{ label: 'AWS Compute Optimizer — User Guide', url: 'https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html' }],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A development environment of EC2 instances is only used during business hours, Monday to Friday. Which approach reduces cost the most with minimal effort?',
    options: opts4(
      'Schedule automatic stop/start of the instances outside business hours',
      'Purchase 3-year Standard Reserved Instances for them',
      'Move them to Dedicated Hosts',
      'Increase instance sizes to finish work faster'
    ),
    correct: ['a'],
    explanation: 'Stopping non-production instances outside working hours (e.g., via Instance Scheduler or EventBridge) avoids paying for idle compute roughly 75% of the week. Reserved Instances assume continuous use, Dedicated Hosts increase cost, and larger instances raise hourly cost.',
    references: [REF.EC2_PURCHASE],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company must store 5 PB of compliance archives that are almost never accessed and can tolerate retrieval times of up to 12 hours, at the absolute lowest storage cost. Which S3 storage class is appropriate?',
    options: opts4(
      'S3 Glacier Deep Archive',
      'S3 Glacier Flexible Retrieval',
      'S3 Standard-IA',
      'S3 Intelligent-Tiering'
    ),
    correct: ['a'],
    explanation: 'S3 Glacier Deep Archive is the lowest-cost S3 storage, designed for long-term retention rarely accessed with retrieval times of hours — ideal for compliance archives tolerant of ~12-hour retrieval. The other classes cost more for this access pattern.',
    references: [REF.S3_STORAGE_CLASSES],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company guarantees compute capacity for a critical end-of-quarter batch run in a specific Availability Zone for a few days, but does not want a long-term commitment. Which option meets the requirement most cost-effectively?',
    options: opts4(
      'On-Demand Capacity Reservations for the required period in that AZ',
      'A 3-year Standard Reserved Instance',
      'Spot Instances with no capacity guarantee',
      'A Compute Savings Plan'
    ),
    correct: ['a'],
    explanation: 'On-Demand Capacity Reservations reserve capacity in a specific AZ for as long as needed with no long-term commitment, ensuring the batch run can launch, and can be combined with Savings Plans for discount. RIs/Savings Plans are commitments without inherent capacity guarantees, and Spot offers no capacity assurance.',
    references: [REF.EC2_PURCHASE],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants detailed, line-item billing data delivered to S3 for analysis in Athena and QuickSight to allocate costs by tag. Which AWS feature provides this dataset?',
    options: opts4(
      'AWS Cost and Usage Report (CUR) delivered to S3',
      'AWS Budgets reports emailed monthly',
      'The AWS Billing console summary page',
      'Amazon CloudWatch metrics'
    ),
    correct: ['a'],
    explanation: 'The AWS Cost and Usage Report provides the most granular cost and usage line items, delivered to S3 and queryable with Athena and visualized in QuickSight, supporting tag-based cost allocation. Budgets and the billing summary are aggregate, and CloudWatch metrics are not billing line items.',
    references: [REF.COST_EXPLORER],
    isTeaser: false
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company applies an S3 lifecycle policy to backup objects: transition to Standard-IA after 30 days, to Glacier Flexible Retrieval after 90 days, and expire after 7 years. What is the primary benefit of this configuration?',
    options: opts4(
      'It automatically optimizes storage cost over the data lifecycle while enforcing retention expiry',
      'It encrypts the objects at rest',
      'It replicates objects to another Region',
      'It accelerates uploads from distant users'
    ),
    correct: ['a'],
    explanation: 'Lifecycle rules automatically move objects to progressively cheaper storage classes as they age and delete them at end of retention, minimizing cost without manual intervention. Lifecycle policies do not handle encryption, cross-Region replication, or upload acceleration.',
    references: [REF.S3_LIFECYCLE, REF.S3_STORAGE_CLASSES],
    isTeaser: false
  }
];
