import { QType } from '@prisma/client';
import { Q, opts4, opts5, SECURE, RESILIENT, PERF, COST, REF } from './types';

/**
 * SAA-C03 practice variant p4.
 * Service emphasis: compute, containers, and application decoupling
 * (EC2 Auto Scaling, ALB/NLB, Lambda, ECS/Fargate/EKS, SQS, SNS,
 * EventBridge, Step Functions, API Gateway, Kinesis, Elastic Beanstalk).
 * 65 original scenario questions mapped to the four SAA-C03 domains.
 */
export const P4: Q[] = [
  // ───────────────────────── SECURE (20) ─────────────────────────
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company runs an order-processing service as AWS Lambda functions that read messages from an Amazon SQS queue and write results to an Amazon DynamoDB table. Security review found that the functions use long-lived IAM user access keys stored in environment variables. What is the MOST secure way to grant the functions the permissions they need?',
    options: opts4(
      'Encrypt the access keys with AWS KMS and continue storing them in environment variables',
      'Attach an IAM execution role to the Lambda functions that grants only the required SQS and DynamoDB actions',
      'Store the access keys in AWS Secrets Manager and have the function fetch them at startup',
      'Move the access keys to AWS Systems Manager Parameter Store as SecureString parameters'
    ),
    correct: ['b'],
    explanation: 'Lambda functions assume an IAM execution role and receive temporary, automatically rotated credentials, eliminating long-lived keys entirely. Encrypting or relocating static keys still leaves credentials that must be managed and can leak. Least-privilege role policies scoped to the specific SQS queue and DynamoDB table follow AWS best practice.',
    references: [REF.IAM_ROLES, REF.LAMBDA],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 1,
    type: QType.SINGLE,
    stem: 'An application running on Amazon ECS on AWS Fargate must call Amazon S3 and Amazon DynamoDB. The team wants each task to have only the permissions it needs without embedding credentials in the container image. Which approach should a solutions architect recommend?',
    options: opts4(
      'Use the ECS container instance IAM role shared by all tasks',
      'Define an ECS task IAM role and reference it in the task definition',
      'Bake an IAM access key and secret into the container image as build args',
      'Pass AWS credentials through Fargate task environment variables'
    ),
    correct: ['b'],
    explanation: 'An ECS task role provides temporary credentials to the containers in a task, scoped to exactly what that workload needs. Fargate has no customer-managed container instances, so a container instance role does not apply. Embedding keys in images or environment variables is insecure and not rotated.',
    references: [REF.ECS, REF.IAM_ROLES],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A public REST API built with Amazon API Gateway fronts AWS Lambda. The company must allow only authenticated users from its existing Amazon Cognito user pool and must not write custom authorization code. Which configuration meets the requirement with the LEAST effort?',
    options: opts4(
      'Add an API Gateway Lambda authorizer that validates JWTs against Cognito',
      'Configure an API Gateway Amazon Cognito user pool authorizer on the API methods',
      'Enable an IAM authorizer and map Cognito identities to IAM roles',
      'Place AWS WAF in front of the API with a rule that checks the Authorization header'
    ),
    correct: ['b'],
    explanation: 'API Gateway has a built-in Cognito user pool authorizer that validates the user pool token with no code to write. A Lambda authorizer would require custom code. IAM authorizers need SigV4 signing, and WAF cannot validate identity tokens.',
    references: [REF.API_GATEWAY],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A Lambda function inside a VPC must read a database password from AWS Secrets Manager. The VPC has no internet gateway or NAT gateway, and security policy forbids traffic from leaving the AWS network. How should the architect enable the function to retrieve the secret?',
    options: opts4(
      'Add a NAT gateway and route 0.0.0.0/0 from the Lambda subnets to it',
      'Create an interface VPC endpoint for Secrets Manager in the Lambda subnets',
      'Create a gateway VPC endpoint for Secrets Manager',
      'Attach an Elastic IP to the Lambda elastic network interface'
    ),
    correct: ['b'],
    explanation: 'Secrets Manager is accessible through an AWS PrivateLink interface VPC endpoint, keeping traffic on the AWS network with no internet path. A NAT gateway would route over the internet. Gateway endpoints exist only for S3 and DynamoDB, and Lambda ENIs cannot take Elastic IPs.',
    references: [REF.VPC_ENDPOINTS, REF.SECRETS_MANAGER],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An EC2 Auto Scaling group behind an Application Load Balancer serves a public web app. A security team requires that instances only accept HTTP traffic from the load balancer and never directly from the internet. What is the recommended way to enforce this?',
    options: opts4(
      'Place the instances in public subnets and add a deny rule for 0.0.0.0/0 in the NACL',
      "Set the instance security group inbound rule to allow port 80 only from the load balancer's security group",
      'Disable public IP assignment in the Auto Scaling group launch template only',
      'Use AWS WAF on the instances to drop non-load-balancer source IPs'
    ),
    correct: ['b'],
    explanation: 'Referencing the load balancer security group as the source in the instance security group ensures only the ALB can reach the instances on port 80, regardless of subnet placement. NACL deny-all would also block the ALB. Disabling public IPs alone does not restrict inbound paths, and WAF is not deployed on EC2 instances.',
    references: [REF.ALB, REF.AUTOSCALING],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company exposes an internal microservice through a private Amazon API Gateway REST API. Consumers run in separate VPCs across multiple AWS accounts in the same AWS Organization. The architecture must keep all calls off the public internet. Which design meets the requirement?',
    options: opts4(
      'Make the API public and restrict access with a resource policy listing each account ID',
      'Create a private REST API and an interface VPC endpoint for API Gateway in each consumer VPC, controlled by a resource policy',
      'Use a Network Load Balancer in front of the API and share it with AWS RAM',
      'Place API Gateway behind CloudFront with an origin access control'
    ),
    correct: ['b'],
    explanation: 'A private REST API is reachable only through execute-api interface VPC endpoints; each consumer VPC creates the endpoint and a resource policy authorizes the accounts and endpoints. A public API still traverses the internet. NLB sharing and CloudFront do not make API Gateway private.',
    references: [REF.API_GATEWAY, REF.VPC_ENDPOINTS],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A solutions architect must encrypt messages flowing through an Amazon SQS queue so that data is protected at rest and the encryption key usage is auditable in AWS CloudTrail. Which option meets the requirement?',
    options: opts4(
      'Enable SQS server-side encryption with an AWS managed key only',
      'Enable SQS server-side encryption with a customer managed AWS KMS key',
      'Have producers Base64-encode message bodies before sending',
      'Restrict the queue with an SQS access policy and rely on TLS in transit'
    ),
    correct: ['b'],
    explanation: 'SSE-SQS with a customer managed KMS key encrypts message bodies at rest and logs every key operation through CloudTrail, satisfying auditability. The AWS managed key offers less granular control and limited key-policy auditing. Base64 is encoding, not encryption, and TLS only protects data in transit.',
    references: [REF.SQS, REF.KMS],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An EventBridge rule routes order events to a Lambda function in a different AWS account. Security requires that only the specific event bus and rule can invoke the function and that no broad cross-account principals are granted. What should the architect configure?',
    options: opts4(
      'Add a Lambda resource-based policy allowing the events.amazonaws.com principal scoped to the source rule ARN',
      "Add the other account's root as a trusted principal in the Lambda execution role",
      'Make the Lambda function URL public and validate a shared secret header',
      'Grant lambda:InvokeFunction to all principals in the AWS Organization'
    ),
    correct: ['a'],
    explanation: 'A Lambda resource-based policy that allows the EventBridge service principal with a SourceArn condition limited to the specific rule ARN grants exactly the needed cross-account invocation and nothing more. Trusting an account root or the whole organization is overly broad, and a public function URL bypasses the event bus entirely.',
    references: [REF.LAMBDA, REF.IAM_POLICY_EVAL]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A regulated workload runs containers on Amazon EKS. Pods must obtain AWS permissions with fine-grained, per-service-account scoping rather than sharing the worker node instance role. Which feature should the architect use?',
    options: opts4(
      'IAM roles for service accounts (IRSA) using an OIDC provider',
      'The Amazon EC2 instance profile attached to the EKS managed node group',
      'A shared IAM user whose keys are mounted as a Kubernetes Secret',
      'kube2iam configured to assume the cluster control plane role'
    ),
    correct: ['a'],
    explanation: 'IRSA associates an IAM role with a Kubernetes service account through an IAM OIDC provider, so each pod gets only its scoped permissions and temporary credentials. The node instance profile grants the same permissions to all pods on the node. Static user keys are insecure, and assuming the control plane role is not least privilege.',
    references: [REF.EKS, REF.IAM_ROLES],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A public HTTP API built with Amazon API Gateway is being abused by automated clients performing SQL injection attempts and high-volume scraping. The company wants managed protection without rewriting the backend Lambda code. Which solution is BEST?',
    options: opts4(
      'Enable API Gateway throttling only and lower the burst limit',
      'Attach AWS WAF with managed rule groups and a rate-based rule to the API stage',
      'Move the API behind a Network Load Balancer with TLS termination',
      'Add an API key requirement to every method'
    ),
    correct: ['b'],
    explanation: 'AWS WAF integrates with API Gateway and provides managed rule groups (including SQL injection protection) plus rate-based rules to curb scraping, all without backend changes. Throttling alone does not block injection payloads, an NLB cannot inspect HTTP, and API keys are for usage metering rather than attack mitigation.',
    references: [REF.WAF, REF.API_GATEWAY]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'Producers send PII records to an Amazon Kinesis Data Streams stream that is consumed by a Lambda function. Compliance requires the records to be encrypted at rest within the stream. What is the simplest way to achieve this?',
    options: opts4(
      'Enable server-side encryption on the Kinesis stream using an AWS KMS key',
      'Have each producer encrypt the payload with a hardcoded AES key',
      'Switch the stream to Kinesis Data Firehose with S3 delivery',
      'Enable enhanced fan-out on the stream consumers'
    ),
    correct: ['a'],
    explanation: 'Kinesis Data Streams supports server-side encryption with KMS, transparently encrypting data at rest with no producer or consumer code changes. Hardcoded client keys are insecure and unmanaged. Firehose changes the architecture, and enhanced fan-out only affects consumer throughput, not encryption.',
    references: [REF.KINESIS, REF.KMS],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'An organization wants to guarantee that no member account can disable Amazon GuardDuty or delete CloudTrail trails, even if a developer has administrator IAM permissions in that account. Which control enforces this centrally?',
    options: opts4(
      'A permissions boundary applied to every IAM role in each account',
      'A service control policy attached to the organizational unit denying the relevant API actions',
      'An IAM identity-based deny policy attached to each developer user',
      'A resource-based policy on the CloudTrail S3 bucket'
    ),
    correct: ['b'],
    explanation: 'An SCP sets the maximum permissions for member accounts; a deny on guardduty:Delete* and cloudtrail:Delete*/StopLogging cannot be overridden by any IAM policy in the account, including admin. Permissions boundaries and identity policies live inside the account and can be modified by local admins.',
    references: [REF.ORGANIZATIONS_SCP, REF.IAM_POLICY_EVAL],
    isTeaser: true
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A Lambda-backed application stores a third-party API token. The token rotates every 30 days, and the company wants automated rotation and secure retrieval at runtime. Which AWS service should the architect use?',
    options: opts4(
      'AWS Systems Manager Parameter Store standard String parameter',
      'AWS Secrets Manager with a rotation Lambda',
      'A Lambda environment variable encrypted at rest',
      'An Amazon S3 object protected by a bucket policy'
    ),
    correct: ['b'],
    explanation: 'Secrets Manager natively supports scheduled automatic rotation via a rotation Lambda and provides secure, IAM-controlled runtime retrieval. Standard Parameter Store strings are not encrypted and lack built-in rotation. Environment variables and S3 objects offer no managed rotation.',
    references: [REF.SECRETS_MANAGER, REF.LAMBDA]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An Auto Scaling group of EC2 web servers in private subnets must download OS patches from the internet but must not be reachable from the internet. The company also wants to avoid managing patch-proxy servers. Which design is correct?',
    options: opts4(
      'Assign public IPs in the launch template and use a restrictive security group',
      'Route outbound traffic from the private subnets through a NAT gateway in a public subnet',
      'Attach an internet gateway directly to the private subnet route table',
      'Use an interface VPC endpoint for Amazon EC2 to reach the patch repositories'
    ),
    correct: ['b'],
    explanation: 'A NAT gateway lets instances in private subnets initiate outbound internet connections (for patches) while remaining unreachable from the internet, and it is fully managed. Public IPs would expose the instances. An internet gateway on a private subnet makes it public, and an EC2 interface endpoint does not provide general internet access to patch mirrors.',
    references: [REF.NAT_GATEWAY, REF.AUTOSCALING]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An SNS topic fans out events to several SQS queues owned by different teams. A new requirement states that messages must be encrypted at rest end to end across the topic and the queues. What must the architect configure?',
    options: opts4(
      'Enable SSE on the SNS topic only, since SQS inherits the topic encryption',
      'Enable SSE with KMS on the SNS topic and on each subscribed SQS queue, granting the topic permission to use the queue keys',
      'Enable HTTPS delivery on the subscriptions',
      'Convert the topic to a FIFO topic to enable encryption'
    ),
    correct: ['b'],
    explanation: 'Encryption at rest is configured independently on SNS and on each SQS queue; the queues must also allow the SNS service principal to use their KMS keys for the delivered messages to be readable. HTTPS only protects in transit, and FIFO is unrelated to encryption.',
    references: [REF.SNS, REF.SQS]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A company runs a containerized payment service on Amazon ECS. Auditors require that the container image cannot be modified after it is approved and that only signed, scanned images can be deployed. Which combination of services BEST supports this?',
    options: opts4(
      'Store images in Amazon ECR with immutable tags and image scanning, and require deployments to use approved digests',
      'Store images in an S3 bucket with versioning and a bucket policy',
      'Use Docker Hub private repositories with two-factor authentication',
      'Bake images onto an EBS snapshot and restrict snapshot sharing'
    ),
    correct: ['a'],
    explanation: 'Amazon ECR supports tag immutability and on-push vulnerability scanning, and deploying by image digest ensures the exact approved artifact runs. S3 and EBS snapshots are not container registries and lack image-level controls. Docker Hub is third-party and outside AWS auditing/integration.',
    references: [REF.ECS, { label: 'Amazon ECR — Image tag mutability', url: 'https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-tag-mutability.html' }]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A Lambda function must write to an Amazon S3 bucket that is encrypted with a customer managed AWS KMS key. The function has s3:PutObject permission but uploads fail with an access-denied error. What is the MOST likely fix?',
    options: opts4(
      'Add a NAT gateway so the function can reach S3',
      'Grant the function role kms:GenerateDataKey and kms:Decrypt on the bucket KMS key and allow it in the key policy',
      'Recreate the bucket without default encryption',
      'Increase the Lambda function memory and timeout'
    ),
    correct: ['b'],
    explanation: 'Writing to a bucket with SSE-KMS requires the principal to have KMS permissions (GenerateDataKey/Decrypt) on the key, granted in both the IAM policy and the key policy. The S3 permission alone is insufficient. NAT, encryption removal, and resource sizing do not address the KMS authorization failure.',
    references: [REF.KMS, REF.LAMBDA]
  },
  {
    domain: SECURE,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'A multi-account environment uses a centralized logging account. Application accounts run Lambda functions whose CloudWatch Logs must be aggregated centrally in near real time without exposing cross-account write credentials to developers. Which approach is appropriate?',
    options: opts4(
      'Have each function write logs directly to an S3 bucket in the logging account using static keys',
      'Use a CloudWatch Logs subscription filter to a Kinesis Data Stream, with a cross-account destination owned by the logging account',
      'Email log files nightly to the security team',
      'Replicate the CloudWatch log groups with AWS Backup'
    ),
    correct: ['b'],
    explanation: 'CloudWatch Logs cross-account subscriptions stream log events to a Kinesis destination owned by the central account in near real time, governed by a destination policy rather than shared keys. Static keys are insecure, email is not near real time, and AWS Backup does not replicate log groups.',
    references: [REF.KINESIS, { label: 'CloudWatch Logs — Cross-account subscriptions', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CrossAccountSubscriptions.html' }]
  },
  {
    domain: SECURE,
    difficulty: 2,
    type: QType.MULTI,
    stem: 'A solutions architect is hardening an internet-facing Application Load Balancer that distributes traffic to an EC2 Auto Scaling group. Which two actions improve the security posture of this tier? (Choose two.)',
    options: opts5(
      'Attach AWS WAF with managed rule groups to the ALB',
      'Open the instance security group to 0.0.0.0/0 on all ports for troubleshooting',
      'Enforce an HTTPS listener with an ACM certificate and redirect HTTP to HTTPS',
      'Disable ALB access logs to reduce noise',
      'Assign Elastic IPs to every backend instance'
    ),
    correct: ['a', 'c'],
    explanation: 'WAF on the ALB filters common web exploits, and an HTTPS listener with ACM plus an HTTP-to-HTTPS redirect protects data in transit. Opening all ports to the internet and assigning public Elastic IPs to backends widen the attack surface, and disabling access logs removes valuable security telemetry.',
    references: [REF.WAF, REF.ALB]
  },
  {
    domain: SECURE,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A company decouples a web tier and a worker tier with Amazon SQS. Security wants to ensure messages cannot be read by unauthorized principals and that the queue only accepts messages from the web tier role. Which two configurations achieve this? (Choose two.)',
    options: opts5(
      'Apply an SQS queue policy that allows SendMessage only from the web tier IAM role ARN',
      'Make the queue publicly accessible and rely on obscure queue URLs',
      'Enable server-side encryption with a customer managed KMS key on the queue',
      'Disable the visibility timeout to prevent message duplication',
      'Use a long polling wait time of 0 seconds to limit exposure'
    ),
    correct: ['a', 'c'],
    explanation: 'A queue policy scoped to the web tier role ARN restricts who can send, and SSE-KMS protects message contents at rest from unauthorized reads. Obscure URLs are not security, visibility timeout governs processing not access, and long polling settings do not affect authorization.',
    references: [REF.SQS, REF.KMS]
  },

  // ───────────────────────── RESILIENT (17) ─────────────────────────
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A monolithic application processes uploaded images synchronously, and traffic spikes cause request timeouts and lost work. The company wants to decouple ingestion from processing so spikes are absorbed and no uploads are lost. Which architecture should the solutions architect recommend?',
    options: opts4(
      'Have the web tier write each job to an Amazon SQS queue and process it with an Auto Scaling worker fleet',
      'Increase the web instance size and add a longer client timeout',
      'Run all processing on a single large EC2 instance with a cron job',
      'Replace the web tier with a larger Application Load Balancer'
    ),
    correct: ['a'],
    explanation: 'Queue-based load leveling with SQS buffers bursts so the web tier can accept uploads quickly while a scalable worker fleet drains the queue at its own pace, preventing lost work. Vertical scaling and bigger timeouts do not absorb sustained spikes, and a single instance is a single point of failure.',
    references: [REF.SQS, REF.AUTOSCALING],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 1,
    type: QType.SINGLE,
    stem: 'An EC2 Auto Scaling group spans two Availability Zones with a desired capacity of 6. One AZ becomes impaired and three instances are lost. What does EC2 Auto Scaling do by default to restore resilience?',
    options: opts4(
      'It waits for the impaired AZ to recover before launching any instances',
      'It launches replacement instances in the healthy AZ to return to the desired capacity',
      'It permanently reduces the desired capacity to 3',
      'It terminates the remaining instances and stops the group'
    ),
    correct: ['b'],
    explanation: 'Auto Scaling maintains desired capacity by launching replacement instances; with one AZ impaired it launches them in the remaining healthy AZ, then rebalances across AZs when the impaired AZ recovers. It does not wait indefinitely, lower desired capacity, or stop the group.',
    references: [REF.AUTOSCALING],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A workflow chains five steps: validate, charge payment, reserve inventory, ship, and notify. Each step is a Lambda function. The team needs reliable orchestration with automatic retries, error handling, and visibility into where executions fail. Which service is BEST suited?',
    options: opts4(
      'Chain the functions by having each one invoke the next directly',
      'Use AWS Step Functions to model the workflow as a state machine',
      'Trigger all functions in parallel from a single SNS topic',
      'Schedule the functions sequentially with five EventBridge rules'
    ),
    correct: ['b'],
    explanation: 'Step Functions orchestrates multi-step workflows with built-in retry, catch, and per-state execution history, making failures easy to locate and recover. Direct chaining loses central error handling and visibility, parallel SNS fan-out breaks the required ordering, and time-based rules cannot guarantee step dependencies.',
    references: [{ label: 'AWS Step Functions — Developer Guide', url: 'https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html' }],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A Lambda function consumes messages from a standard SQS queue. Occasionally a malformed message causes the function to fail repeatedly, blocking the queue and retrying indefinitely. What should the architect configure to isolate the bad messages while keeping the system processing?',
    options: opts4(
      'Increase the SQS visibility timeout to several hours',
      'Configure a dead-letter queue with a maxReceiveCount redrive policy',
      'Switch the queue to FIFO to guarantee ordering',
      'Reduce the Lambda reserved concurrency to 1'
    ),
    correct: ['b'],
    explanation: 'A DLQ with a redrive policy moves a message to the DLQ after maxReceiveCount failed processing attempts, isolating poison messages so valid ones keep flowing. A longer visibility timeout just delays redelivery, FIFO does not solve poison messages, and lowering concurrency reduces throughput without isolating the failure.',
    references: [REF.SQS, REF.LAMBDA],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company runs a stateless containerized API on Amazon ECS using the Fargate launch type behind an Application Load Balancer. The team wants the service to automatically recover unhealthy tasks and remain available during an AZ disruption. Which configuration achieves this?',
    options: opts4(
      'Run a single task in one subnet and rely on ALB retries',
      'Use an ECS service with a desired count across multiple subnets in different AZs and an ALB health check',
      'Schedule a standalone task with run-task and a CloudWatch alarm',
      'Place all tasks in one AZ and replicate the EBS volume'
    ),
    correct: ['b'],
    explanation: 'An ECS service maintains the desired task count, replaces tasks that fail ALB or container health checks, and spreading tasks across subnets in multiple AZs preserves availability during an AZ event. A single task or single-AZ placement is not resilient, and Fargate tasks do not use customer EBS volumes for state.',
    references: [REF.ECS, REF.FARGATE],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An order service publishes events that must be delivered exactly once and processed strictly in the order received per customer. Duplicate or out-of-order processing causes billing errors. Which messaging configuration meets the requirement?',
    options: opts4(
      'A standard SQS queue with high visibility timeout',
      'An SQS FIFO queue using the customer ID as the message group ID with content-based deduplication',
      'An SNS standard topic fanning out to multiple subscribers',
      'A Kinesis Data Firehose delivery stream to S3'
    ),
    correct: ['b'],
    explanation: 'SQS FIFO queues provide exactly-once processing and strict ordering within a message group; using customer ID as the group ID preserves per-customer order while allowing parallelism across customers. Standard queues are best-effort ordering with at-least-once delivery, SNS standard does not order, and Firehose is for delivery to stores, not ordered processing.',
    references: [REF.SQS]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A serverless REST API uses API Gateway and Lambda backed by an Amazon DynamoDB table. The company needs the data tier to survive an entire AWS Region outage with an RPO and RTO of minutes. Which option BEST meets the requirement?',
    options: opts4(
      'Enable DynamoDB point-in-time recovery in the primary Region',
      'Use a DynamoDB global table replicated to a second Region',
      'Take on-demand DynamoDB backups every hour to the same Region',
      'Increase the DynamoDB provisioned read capacity'
    ),
    correct: ['b'],
    explanation: 'A DynamoDB global table maintains an active replica in another Region with multi-Region, multi-active replication, giving very low RPO/RTO when failing over. PITR and same-Region backups do not survive a Region outage, and capacity changes do not affect regional resilience.',
    references: [REF.DYNAMODB, { label: 'Amazon DynamoDB — Global tables', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html' }],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'During a flash sale, a Lambda function that writes orders to a relational database exhausts the database connection limit because thousands of concurrent invocations open connections simultaneously. The company wants to protect the database while still capturing all orders. What is the BEST approach?',
    options: opts4(
      'Remove the Lambda reserved concurrency limit so it scales freely',
      'Place an SQS queue between the API and the order-writing Lambda and cap the Lambda concurrency',
      'Increase the database instance size during the sale',
      'Add an Application Load Balancer in front of the Lambda function'
    ),
    correct: ['b'],
    explanation: 'Buffering orders in SQS and capping the consuming Lambda concurrency smooths the write rate to a level the database can sustain while still capturing every order. Removing concurrency limits worsens connection exhaustion, vertical scaling has limits and cost, and an ALB does not throttle database writes.',
    references: [REF.SQS, REF.LAMBDA],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants new instances added by EC2 Auto Scaling to register with a configuration management system and warm caches before they receive production traffic. Which Auto Scaling feature supports running this initialization before the instance is marked InService?',
    options: opts4(
      'Scheduled scaling actions',
      'Lifecycle hooks on instance launch',
      'Predictive scaling',
      'Instance termination policies'
    ),
    correct: ['b'],
    explanation: 'A launch lifecycle hook pauses the instance in a wait state so bootstrap and cache-warming complete before the instance is placed InService and added to the load balancer. Scheduled and predictive scaling change capacity timing, and termination policies decide which instances to remove.',
    references: [REF.AUTOSCALING],
    isTeaser: true
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A reporting consumer reads from an Amazon Kinesis Data Streams stream but periodically falls behind during traffic bursts and loses the ability to catch up before the 24-hour retention expires. The team wants durability of late data without re-architecting producers. Which change helps MOST?',
    options: opts4(
      'Reduce the number of shards to simplify consumption',
      'Increase the stream data retention period and add shards to raise throughput',
      'Switch consumers to short polling',
      'Move the consumer to a t-family burstable instance'
    ),
    correct: ['b'],
    explanation: 'Extending the retention period gives the consumer a larger window to recover, and adding shards increases parallel read throughput so it can catch up. Reducing shards lowers throughput, polling mode is an SQS concept, and a burstable instance does not address stream retention or shard limits.',
    references: [REF.KINESIS]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An application uses Amazon SNS to notify several downstream HTTP endpoints. Occasionally an endpoint is briefly unavailable and notifications are dropped. The team wants delivery to be retried and undeliverable messages preserved for later analysis. What should the architect configure?',
    options: opts4(
      'Enable SNS message filtering on each subscription',
      'Configure an SNS delivery retry policy and a dead-letter queue (redrive policy) on the subscriptions',
      'Convert the topic to FIFO',
      'Increase the SNS topic display name length'
    ),
    correct: ['b'],
    explanation: 'SNS supports configurable delivery retry policies, and a redrive policy sends messages that exhaust retries to an SQS dead-letter queue for later inspection and reprocessing. Message filtering controls which messages are sent, FIFO addresses ordering, and the display name is cosmetic.',
    references: [REF.SNS, REF.SQS]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A microservice on Amazon EKS must continue serving requests even if one Availability Zone fails, and the cluster should automatically add capacity when pods cannot be scheduled. Which combination provides this resilience?',
    options: opts4(
      'A single managed node group in one AZ with the Horizontal Pod Autoscaler',
      'Managed node groups spread across multiple AZs with the Cluster Autoscaler (or Karpenter) for node scaling',
      'Self-managed nodes in one subnet with manual scaling',
      'Fargate profiles limited to a single AZ'
    ),
    correct: ['b'],
    explanation: 'Spreading managed node groups across multiple AZs survives an AZ failure, and Cluster Autoscaler or Karpenter adds nodes when pods are unschedulable. A single-AZ node group or single-subnet self-managed nodes are not AZ-resilient, and limiting Fargate to one AZ removes redundancy.',
    references: [REF.EKS, REF.AUTOSCALING]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company uses AWS Elastic Beanstalk for a web application and needs zero-downtime deployments where a new version is fully validated before traffic shifts and a fast rollback is possible. Which deployment policy should the architect choose?',
    options: opts4(
      'All at once',
      'Blue/green deployment by swapping environment CNAMEs',
      'Rolling without additional batch',
      'Single instance in-place update'
    ),
    correct: ['b'],
    explanation: 'A blue/green deployment launches a separate environment, validates the new version, then swaps CNAMEs to shift traffic, and rolling back is a quick CNAME swap back. All-at-once causes downtime, and rolling policies update in place with reduced capacity and slower rollback.',
    references: [{ label: 'AWS Elastic Beanstalk — Blue/green deployments', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.CNAMESwap.html' }]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A solutions architect must make a TCP-based, latency-sensitive service highly available across two Regions with fast regional failover and a static set of entry IP addresses for enterprise customers to allowlist. Which service should front the regional Network Load Balancers?',
    options: opts4(
      'Amazon CloudFront',
      'AWS Global Accelerator with endpoint groups in each Region',
      'Amazon Route 53 weighted records',
      'An internet-facing Application Load Balancer'
    ),
    correct: ['b'],
    explanation: 'Global Accelerator provides static anycast IPs and performs fast health-based failover across Regional endpoint groups for TCP/UDP workloads. CloudFront is HTTP-oriented and not for arbitrary TCP, Route 53 failover depends on DNS TTL and gives no static IPs, and an ALB is a single-Region HTTP balancer.',
    references: [REF.GLOBAL_ACCELERATOR, REF.NLB]
  },
  {
    domain: RESILIENT,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An EC2 Auto Scaling group occasionally launches instances that pass EC2 status checks but fail application-level health (the app process is crashed). These instances keep receiving traffic. How should the architect ensure unhealthy instances are replaced?',
    options: opts4(
      'Rely solely on EC2 instance status checks',
      'Attach the group to an ELB target group and enable ELB health checks for the Auto Scaling group',
      'Increase the cooldown period',
      'Enable detailed CloudWatch monitoring only'
    ),
    correct: ['b'],
    explanation: 'Enabling ELB health checks lets the Auto Scaling group consider application-layer target health and terminate then replace instances whose app is unhealthy even when EC2 checks pass. EC2 status checks see only the hypervisor/instance, cooldown delays scaling, and detailed monitoring alone does not trigger replacement.',
    references: [REF.AUTOSCALING, REF.ALB]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A team is decoupling a tightly coupled application using Amazon SQS and an Auto Scaling worker tier. Which two practices improve fault tolerance of the worker tier? (Choose two.)',
    options: opts5(
      'Scale the worker Auto Scaling group on the ApproximateNumberOfMessagesVisible metric',
      'Process and delete each message only after the work is completed successfully',
      'Set the visibility timeout to 0 so messages are immediately reprocessable',
      'Run a single worker instance to guarantee ordering',
      'Disable the dead-letter queue to avoid losing messages'
    ),
    correct: ['a', 'b'],
    explanation: 'Scaling on the visible-message backlog matches worker capacity to load, and deleting a message only after successful processing ensures failed work is retried. A zero visibility timeout causes duplicate concurrent processing, a single worker is a single point of failure, and disabling the DLQ removes poison-message isolation.',
    references: [REF.SQS, REF.AUTOSCALING]
  },
  {
    domain: RESILIENT,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A company wants its serverless event-driven pipeline (EventBridge to Lambda) to tolerate transient downstream failures without losing events. Which two configurations help achieve this? (Choose two.)',
    options: opts5(
      'Configure an EventBridge rule dead-letter queue for failed target deliveries',
      'Set the Lambda asynchronous invocation maximum retry attempts and an on-failure destination',
      'Disable retries to fail fast and alert operators',
      'Use a single EventBridge rule with no targets as a buffer',
      'Store all events only in CloudWatch Logs'
    ),
    correct: ['a', 'b'],
    explanation: 'An EventBridge target DLQ captures events that cannot be delivered, and configuring Lambda async retry attempts plus an on-failure destination preserves events that still fail after retries. Disabling retries loses transient-failure events, an empty rule does not buffer, and logs are not a durable replay mechanism.',
    references: [REF.LAMBDA, { label: 'Amazon EventBridge — Rule dead-letter queues', url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-dlq.html' }]
  },

  // ───────────────────────── PERF (16) ─────────────────────────
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A web fleet behind an Application Load Balancer has predictable, recurring traffic that ramps up every weekday at 08:00 and drops at 18:00. The team wants capacity ready before the morning surge rather than reacting after latency rises. Which EC2 Auto Scaling approach is BEST?',
    options: opts4(
      'Simple scaling on average CPU utilization',
      'Scheduled scaling actions aligned to the daily traffic pattern',
      'Manual capacity adjustments by an operator',
      'A fixed desired capacity sized for peak all day'
    ),
    correct: ['b'],
    explanation: 'Scheduled scaling changes desired capacity at known times, so capacity is provisioned before the predictable 08:00 surge and reduced after 18:00. Reactive CPU scaling lags the surge, manual changes are error-prone, and fixed peak capacity wastes money outside business hours.',
    references: [REF.AUTOSCALING],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A latency-sensitive Lambda function written in Java suffers slow cold starts that violate the p99 latency target during sporadic traffic. The company wants to minimize cold-start latency without rewriting the function. Which option is MOST effective?',
    options: opts4(
      'Increase the function timeout',
      'Enable Lambda SnapStart for the function (or configure provisioned concurrency)',
      'Reduce the function memory to start faster',
      'Move the function code into a Lambda layer'
    ),
    correct: ['b'],
    explanation: 'Lambda SnapStart restores from a pre-initialized snapshot to dramatically cut Java cold-start latency, and provisioned concurrency keeps initialized environments warm; either addresses the cold-start p99 without code rewrites. A longer timeout does not speed initialization, less memory slows execution, and layers do not eliminate cold starts.',
    references: [REF.LAMBDA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 1,
    type: QType.SINGLE,
    stem: 'An EC2 Auto Scaling group should keep average CPU utilization near 50% as traffic varies smoothly throughout the day. Which scaling policy provides the simplest way to maintain this target?',
    options: opts4(
      'Target tracking scaling policy on average CPU utilization at 50%',
      'Step scaling with many narrow CloudWatch alarm bands',
      'Scheduled scaling every 5 minutes',
      'Manual scaling based on dashboards'
    ),
    correct: ['a'],
    explanation: 'A target tracking policy automatically adjusts capacity to keep a chosen metric (CPU at 50%) at the target, like a thermostat, with minimal configuration. Step scaling requires hand-tuned alarm bands, frequent scheduled actions cannot follow variable load, and manual scaling is not automatic.',
    references: [REF.AUTOSCALING],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A high-throughput TCP game backend needs ultra-low latency, must preserve client source IP addresses, and must scale to millions of flows per second. Which load balancing layer should the solutions architect choose?',
    options: opts4(
      'Application Load Balancer with sticky sessions',
      'Network Load Balancer',
      'Classic Load Balancer in TCP mode',
      'Amazon API Gateway HTTP API'
    ),
    correct: ['b'],
    explanation: 'A Network Load Balancer operates at layer 4 with very low latency, handles millions of requests per second, and can preserve client source IP, which fits a TCP game backend. An ALB and API Gateway are HTTP-layer, and the Classic Load Balancer is legacy with lower performance.',
    references: [REF.NLB],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A read-heavy serverless application reads the same configuration data from DynamoDB on every Lambda invocation, and read latency dominates response time. The data changes only a few times per day. Which change improves performance MOST cost-effectively?',
    options: opts4(
      'Add a DynamoDB Accelerator (DAX) cluster or cache the config in the Lambda execution environment',
      'Increase DynamoDB provisioned write capacity',
      'Switch the table to a global table',
      'Enable DynamoDB streams on the table'
    ),
    correct: ['a'],
    explanation: 'For repeated reads of slowly changing data, caching with DAX or in-process caching in the warm Lambda environment removes most read latency and request cost. Write capacity does not affect reads, global tables address multi-Region not latency here, and streams capture changes rather than speed reads.',
    references: [REF.DYNAMODB, REF.LAMBDA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'An EC2 Auto Scaling group serving a popular site reacts to load increases only after CPU is already saturated, causing brief latency spikes during rapid ramp-ups. Traffic follows recurring daily and weekly patterns. Which scaling option proactively provisions capacity ahead of the load?',
    options: opts4(
      'Predictive scaling',
      'Simple scaling with a long cooldown',
      'A larger instance type only',
      'Termination policy tuning'
    ),
    correct: ['a'],
    explanation: 'Predictive scaling uses machine learning on historical patterns to forecast load and provision capacity before demand arrives, smoothing ramp-up latency. Simple scaling is reactive, a bigger instance type does not add proactive capacity, and termination policies only affect scale-in selection.',
    references: [REF.AUTOSCALING],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A global single-page application calls a regional Amazon API Gateway REST API. Users far from the Region complain about high request latency for both static assets and API calls. Which solution improves performance for the widest set of users?',
    options: opts4(
      'Increase the Lambda memory backing the API',
      'Serve static assets from Amazon CloudFront and use an edge-optimized API Gateway endpoint',
      'Add more API Gateway stages',
      'Switch the API to a private endpoint'
    ),
    correct: ['b'],
    explanation: 'CloudFront caches static content at edge locations near users, and an edge-optimized API endpoint routes API calls over the AWS global network from the nearest edge, reducing latency globally. More Lambda memory does not address network distance, extra stages do not help latency, and a private endpoint blocks public users.',
    references: [REF.CLOUDFRONT, REF.API_GATEWAY]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A real-time analytics pipeline ingests hundreds of thousands of clickstream records per second and must deliver them, with minimal operational overhead, to Amazon S3 in compressed batches for Athena queries. Which service is the BEST fit for the delivery layer?',
    options: opts4(
      'Amazon SQS standard queue with a Lambda consumer writing to S3',
      'Amazon Data Firehose with buffering, compression, and S3 as the destination',
      'Amazon SNS fan-out to multiple Lambda functions',
      'AWS Step Functions polling a database'
    ),
    correct: ['b'],
    explanation: 'Data Firehose is a fully managed delivery stream that buffers, optionally transforms and compresses, and writes to S3 with no servers to manage, ideal for high-volume clickstream to Athena. A custom SQS/Lambda pipeline is more operational overhead, SNS is pub/sub not batched delivery, and Step Functions is orchestration.',
    references: [REF.FIREHOSE, REF.ATHENA],
    isTeaser: true
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A containerized batch image-processing job on AWS Fargate is CPU-bound and currently runs slower than required. Profiling shows the task is throttled on CPU but uses little memory. Which adjustment improves performance with the least change?',
    options: opts4(
      'Increase the Fargate task CPU (vCPU) allocation in the task definition',
      'Add more memory to the task while keeping CPU the same',
      'Move the workload to a single large EC2 instance',
      'Increase the ALB idle timeout'
    ),
    correct: ['a'],
    explanation: 'Fargate task size is set in the task definition; raising the vCPU allocation directly relieves the CPU bottleneck for a CPU-bound job. Adding memory does not help a CPU-bound task, migrating to EC2 is unnecessary effort, and ALB timeout is unrelated to batch compute speed.',
    references: [REF.FARGATE, REF.ECS]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A Lambda-based stream processor reads from one Kinesis Data Streams stream. Throughput is limited because all consumers share the 2 MB/s per-shard read limit and processing latency grows under load. The team needs higher, dedicated read throughput per consumer without re-sharding constantly. Which feature should they use?',
    options: opts4(
      'Kinesis enhanced fan-out with the Lambda event source',
      'Increase the Lambda function timeout',
      'Switch consumers to short polling',
      'Use a single consumer to avoid contention'
    ),
    correct: ['a'],
    explanation: 'Enhanced fan-out gives each registered consumer a dedicated 2 MB/s per shard pipe with push delivery and lower latency, removing shared-throughput contention. Longer timeouts do not raise read throughput, short polling is an SQS concept, and a single consumer reduces parallelism.',
    references: [REF.KINESIS, REF.LAMBDA]
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'An Auto Scaling group must launch a mix of On-Demand and Spot Instances across several instance types and AZs to maximize available capacity and performance during rapid scale-out. Which Auto Scaling configuration enables this?',
    options: opts4(
      'A launch configuration referencing a single instance type',
      'A launch template with a mixed instances policy and multiple instance types',
      'Manual instance launches into the group',
      'A scheduled action that doubles capacity'
    ),
    correct: ['b'],
    explanation: 'A launch template combined with a mixed instances policy lets the group draw from multiple instance types and purchase options across AZs, improving the chance of fast, available scale-out. Launch configurations support only one instance type, manual launches break automation, and scheduled doubling does not diversify capacity pools.',
    references: [REF.AUTOSCALING, REF.EC2_PURCHASE]
  },
  {
    domain: PERF,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'A synchronous Lambda function behind API Gateway calls a downstream third-party API. Under burst traffic, latency rises and some requests fail with throttling because too many concurrent executions overwhelm the partner. The company wants stable performance and predictable downstream load. Which approach is BEST?',
    options: opts4(
      'Remove all concurrency controls so Lambda scales unbounded',
      'Decouple with SQS and set reserved concurrency on the consumer Lambda to cap the call rate',
      'Increase API Gateway timeout to 60 seconds',
      'Add more CloudWatch alarms'
    ),
    correct: ['b'],
    explanation: 'Buffering with SQS and capping consumer reserved concurrency limits the rate of downstream calls to what the partner can handle, stabilizing latency and avoiding throttling, while no requests are dropped. Unbounded scaling worsens the overload, a longer timeout hides not fixes the issue, and alarms only observe it.',
    references: [REF.LAMBDA, REF.SQS]
  },
  {
    domain: PERF,
    difficulty: 1,
    type: QType.SINGLE,
    stem: 'A company runs an HTTP microservice on Amazon ECS and needs path-based routing so /api goes to one target group and /images goes to another, with health checks and TLS termination. Which load balancer should the architect use?',
    options: opts4(
      'Network Load Balancer',
      'Application Load Balancer',
      'Gateway Load Balancer',
      'Classic Load Balancer'
    ),
    correct: ['b'],
    explanation: 'The Application Load Balancer operates at layer 7 and supports content-based (path) routing, per-target-group health checks, and TLS termination, matching the HTTP microservice requirement. NLB is layer 4 without path routing, Gateway Load Balancer is for inline appliances, and Classic Load Balancer lacks modern path-based rules.',
    references: [REF.ALB, REF.ECS]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A spiky API workload on AWS Lambda needs consistently low latency for the first requests after idle periods, but only during business hours, and the team wants to avoid paying for warm capacity overnight. Which configuration meets this efficiently?',
    options: opts4(
      'Provisioned concurrency with Application Auto Scaling scheduled to ramp up in business hours and down at night',
      'Maximum reserved concurrency set for the whole day',
      'No concurrency configuration; rely on default on-demand scaling',
      'A CloudWatch alarm that emails when latency is high'
    ),
    correct: ['a'],
    explanation: 'Provisioned concurrency keeps environments initialized to remove cold starts, and scheduling it via Application Auto Scaling provisions warm capacity only during business hours, avoiding overnight cost. Static reserved concurrency does not pre-warm, default scaling still has cold starts, and an alarm does not improve latency.',
    references: [REF.LAMBDA]
  },
  {
    domain: PERF,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'A team wants to improve the responsiveness of an EC2 Auto Scaling group during sudden, large traffic spikes that occur with little warning. Which two measures help the group add capacity faster? (Choose two.)',
    options: opts5(
      'Use a step scaling policy that adds more instances as the alarm breach grows larger',
      'Maintain a warm pool of pre-initialized stopped instances for rapid activation',
      'Increase the health check grace period to several hours',
      'Set a very long scaling cooldown period',
      'Replace the launch template with a launch configuration'
    ),
    correct: ['a', 'b'],
    explanation: 'Step scaling reacts proportionally, adding more instances for larger breaches, and a warm pool keeps pre-initialized instances ready so scale-out completes in seconds. A long grace period or long cooldown slows responsiveness, and launch configurations are the older, less capable mechanism.',
    references: [REF.AUTOSCALING]
  },
  {
    domain: PERF,
    difficulty: 2,
    type: QType.MULTI,
    stem: 'An application decouples a producer and a consumer with Amazon SQS. The consumer is an Auto Scaling group whose CPU stays low but the queue backlog grows during peaks, hurting end-to-end latency. Which two changes improve processing performance? (Choose two.)',
    options: opts5(
      'Scale the consumer group on the SQS ApproximateNumberOfMessagesVisible metric (or backlog per instance)',
      'Enable SQS long polling on the receive calls',
      'Lower the desired capacity of the consumer group',
      'Increase the message size to reduce the number of messages',
      'Disable the consumer health checks'
    ),
    correct: ['a', 'b'],
    explanation: 'Scaling on queue depth/backlog-per-instance adds consumers when work piles up despite low CPU, and long polling reduces empty receives and latency for retrieving available messages. Reducing capacity worsens the backlog, larger messages do not speed processing, and disabling health checks harms reliability.',
    references: [REF.SQS, REF.AUTOSCALING]
  },

  // ───────────────────────── COST (12) ─────────────────────────
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A queue-driven batch workload processes jobs from Amazon SQS on an EC2 Auto Scaling group. The work is fault tolerant, can be interrupted and retried, and runs at variable times. Which purchasing option minimizes compute cost?',
    options: opts4(
      'On-Demand Instances only',
      'Spot Instances in the Auto Scaling group, with SQS retrying interrupted jobs',
      'Dedicated Hosts',
      'A one-year Standard Reserved Instance sized for peak'
    ),
    correct: ['b'],
    explanation: 'Spot Instances cost far less than On-Demand and suit interruptible, retryable queue workers; if an instance is reclaimed, the unprocessed SQS message becomes visible again and is retried. On-Demand and Dedicated Hosts are most expensive, and peak-sized Reserved Instances waste money on variable batch load.',
    references: [REF.EC2_PURCHASE, REF.SQS],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 1,
    type: QType.SINGLE,
    stem: 'A company runs an event-driven workload that executes briefly a few thousand times per day with long idle gaps. It currently runs on an always-on m5.large EC2 instance. Which change reduces cost the MOST while keeping the functionality?',
    options: opts4(
      'Re-platform the workload to AWS Lambda and pay only per invocation and duration',
      'Move the instance to a Reserved Instance',
      'Use a larger instance to finish faster',
      'Add an Auto Scaling group with a minimum of one instance'
    ),
    correct: ['a'],
    explanation: 'For short, infrequent, bursty work with long idle periods, Lambda eliminates the cost of an always-on instance by charging only for actual execution. A Reserved Instance still pays for idle time, a larger instance increases cost, and an Auto Scaling minimum of one keeps a server always running.',
    references: [REF.LAMBDA, REF.EC2_PURCHASE],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 4,
    type: QType.SINGLE,
    stem: 'An organization has steady, predictable baseline compute usage across EC2, AWS Fargate, and AWS Lambda and wants the deepest discount with flexibility to change instance families and Regions. Which pricing model is the BEST fit?',
    options: opts4(
      'Standard Reserved Instances for EC2 only',
      'Compute Savings Plans',
      'On-Demand Capacity Reservations',
      'Spot Instances for all workloads'
    ),
    correct: ['b'],
    explanation: 'Compute Savings Plans apply across EC2, Fargate, and Lambda and remain valid as instance family, size, OS, tenancy, or Region change, giving large discounts for committed steady usage. Standard RIs cover only EC2 with less flexibility, capacity reservations do not discount, and Spot is unsuitable for steady guaranteed baseline.',
    references: [REF.SAVINGS_PLANS],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A development team runs non-production ECS on Fargate test environments only during weekday business hours but currently leaves them running 24/7. Which approach reduces cost with minimal effort?',
    options: opts4(
      'Buy Reserved capacity for the test environments',
      'Use an Amazon EventBridge schedule to scale the ECS service desired count to zero outside business hours and back up in the morning',
      'Move the test environments to larger Fargate tasks',
      'Switch the test environments to On-Demand EC2'
    ),
    correct: ['b'],
    explanation: 'Scheduling the ECS service desired count to zero on nights and weekends via EventBridge stops paying for Fargate tasks when no one is testing, with no architectural change. Reserved capacity still pays for idle time, larger tasks cost more, and moving to EC2 does not address the idle-hours waste.',
    references: [REF.ECS, REF.FARGATE],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A serverless API on Lambda has highly variable traffic. Finance wants to cap and monitor spend and be alerted before monthly costs exceed a threshold, without changing the application. Which AWS capability should the architect recommend?',
    options: opts4(
      'AWS Budgets with a cost budget and alert at a defined threshold',
      'AWS Trusted Advisor cost checks only',
      'Lambda reserved concurrency set to zero',
      'A CloudWatch dashboard of invocation counts'
    ),
    correct: ['a'],
    explanation: 'AWS Budgets lets you set a cost budget and receive alerts (and optional actions) before spend crosses the threshold, giving proactive cost control without app changes. Trusted Advisor advises but does not alert on a custom budget, zero reserved concurrency disables the API, and an invocation dashboard does not track cost thresholds.',
    references: [REF.BUDGETS],
    isTeaser: true
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company decouples microservices with Amazon SQS and processes messages on Lambda. They want to lower cost by reducing the number of empty, billed receive/poll operations and Lambda invocations when the queue is idle. Which setting helps?',
    options: opts4(
      'Enable SQS short polling with a 0-second wait time',
      'Enable SQS long polling by setting ReceiveMessageWaitTimeSeconds up to 20 seconds',
      'Increase the SQS message retention period',
      'Send larger batches of one message each'
    ),
    correct: ['b'],
    explanation: 'Long polling waits up to 20 seconds for messages, sharply cutting empty responses and the associated request charges and needless processing when the queue is idle. Short polling increases empty receives, retention period does not affect polling cost, and single-message batches do not reduce empty calls.',
    references: [REF.SQS]
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A predictable, long-running production service runs continuously on Amazon ECS with the EC2 launch type using a fixed fleet of m6i instances. The company wants the lowest cost for this steady usage while keeping the same instance family. Which option is BEST?',
    options: opts4(
      'Run the EC2 capacity on Spot Instances',
      'Purchase a Compute Savings Plan (or EC2 Instance Savings Plan) covering the steady fleet',
      'Switch the service to On-Demand only',
      'Use burstable T-family instances regardless of workload profile'
    ),
    correct: ['b'],
    explanation: 'A Savings Plan commits to a consistent amount of compute for a steady production fleet and yields a substantial discount over On-Demand while keeping the instance family. Spot risks interruption for a steady production service, On-Demand is the most expensive baseline, and forcing T-family ignores the workload profile.',
    references: [REF.SAVINGS_PLANS, REF.ECS]
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company wants to identify which decoupled microservices and teams are driving Lambda and SQS spend so it can charge back costs accurately. Which approach provides this visibility with the least custom tooling?',
    options: opts4(
      'Apply consistent cost allocation tags and analyze spend with AWS Cost Explorer',
      'Parse CloudTrail logs with a custom script monthly',
      'Estimate costs from CloudWatch metrics manually',
      'Create one AWS account per microservice and sum the invoices by hand'
    ),
    correct: ['a'],
    explanation: 'Cost allocation tags on resources, combined with AWS Cost Explorer grouping and filtering, give per-team and per-service spend breakdowns with built-in tooling. Custom CloudTrail parsing and manual metric estimation are error-prone, and an account-per-service split is heavyweight just for chargeback.',
    references: [REF.COST_EXPLORER]
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.SINGLE,
    stem: 'A nightly data-transformation job currently runs on a large EC2 instance kept on all day even though the job lasts 90 minutes. The job is fault tolerant and can rerun if interrupted. Which design minimizes cost while keeping the schedule reliable?',
    options: opts4(
      'Keep the instance running and add a Reserved Instance',
      'Use an EventBridge schedule to run the job as an ECS on Fargate task (or Spot) only at night and stop after completion',
      'Move the job to a larger always-on instance to finish faster',
      'Run the job continuously in a loop to avoid startup time'
    ),
    correct: ['b'],
    explanation: 'Running the job as a scheduled Fargate task that starts at night and stops on completion means you pay only for ~90 minutes of compute, and Spot can cut cost further given the job is rerunnable. An always-on or Reserved instance still pays for ~22 idle hours, and a continuous loop wastes the most.',
    references: [REF.FARGATE, REF.EC2_PURCHASE]
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.SINGLE,
    stem: 'A company over-provisioned its EC2 Auto Scaling group with a high minimum capacity "to be safe," and utilization analysis shows instances are mostly idle. The team wants to cut cost while still handling real demand automatically. Which change is appropriate?',
    options: opts4(
      'Lower the minimum capacity and use a target tracking policy so the group scales out only when demand requires it',
      'Delete the Auto Scaling group and run one fixed instance',
      'Switch every instance to a Dedicated Host',
      'Raise the maximum capacity higher'
    ),
    correct: ['a'],
    explanation: 'Reducing the minimum and relying on a target tracking policy right-sizes the baseline and adds capacity automatically only when metrics demand it, removing wasteful idle instances. A single fixed instance loses elasticity and resilience, Dedicated Hosts increase cost, and raising the maximum does not address over-provisioned minimum.',
    references: [REF.AUTOSCALING]
  },
  {
    domain: COST,
    difficulty: 3,
    type: QType.MULTI,
    stem: 'An architect is optimizing cost for a decoupled, event-driven platform built on Lambda, SQS, and Fargate with variable load. Which two actions reduce cost without harming the ability to handle demand? (Choose two.)',
    options: opts5(
      'Purchase a Compute Savings Plan covering the steady baseline of Lambda and Fargate usage',
      'Run interruptible SQS batch workers on Spot capacity',
      'Set Lambda memory to the maximum for every function regardless of need',
      'Keep test environments running 24/7 for convenience',
      'Provision the largest Fargate task size for all services as a precaution'
    ),
    correct: ['a', 'b'],
    explanation: 'A Compute Savings Plan discounts the predictable Lambda/Fargate baseline, and running interruptible queue workers on Spot greatly lowers compute cost for fault-tolerant batch processing. Over-allocating Lambda memory, leaving test environments on 24/7, and oversizing every Fargate task all increase cost unnecessarily.',
    references: [REF.SAVINGS_PLANS, REF.EC2_PURCHASE]
  },
  {
    domain: COST,
    difficulty: 2,
    type: QType.MULTI,
    stem: 'A startup wants to reduce the cost of its Auto Scaling web tier and serverless processing while keeping resilience. Which two practices are cost-effective and recommended? (Choose two.)',
    options: opts5(
      'Use a mixed instances policy combining On-Demand for baseline and Spot for burst capacity',
      'Right-size Lambda function memory using performance testing to the optimal setting',
      'Run a fixed oversized fleet sized for the theoretical maximum at all times',
      'Disable Auto Scaling and scale manually on weekends only',
      'Store all logs forever in the most expensive storage for safety'
    ),
    correct: ['a', 'b'],
    explanation: 'A mixed instances policy uses cheap Spot for burst while On-Demand covers the baseline, and right-sizing Lambda memory finds the cost/performance sweet spot (since cost scales with memory and duration). A fixed oversized fleet, manual-only scaling, and indefinite expensive log retention all waste money.',
    references: [REF.AUTOSCALING, REF.LAMBDA]
  }
];
