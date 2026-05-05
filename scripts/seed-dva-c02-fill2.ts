/**
 * Seed: 35 hand-authored AWS DVA-C02 questions — second batch.
 * Together with the 25-question starter this brings the exam to 60.
 *
 *   npx tsx scripts/seed-dva-c02-fill2.ts
 *
 * Adds:
 *   Development with AWS Services       +12   (total ~20)
 *   Security                              +9   (total ~16)
 *   Deployment                            +8   (total ~14)
 *   Troubleshooting and Optimization      +6   (total ~10)
 *
 * Idempotent via generatedBy='manual:dva-c02-fill2'.
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

const db = new PrismaClient();
const EXAM_SLUG = 'aws-dva-c02';
const TAG = 'manual:dva-c02-fill2';

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
  guide:    { label: 'AWS DVA-C02 exam guide', url: 'https://docs.aws.amazon.com/aws-certification/latest/developer-associate-02/developer-associate-02.html' },
  lambda:   { label: 'AWS Lambda', url: 'https://docs.aws.amazon.com/lambda/' },
  llayers:  { label: 'AWS Lambda layers', url: 'https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html' },
  lconcur:  { label: 'Lambda concurrency (provisioned + reserved)', url: 'https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html' },
  ddb:      { label: 'Amazon DynamoDB', url: 'https://docs.aws.amazon.com/dynamodb/' },
  ddbq:     { label: 'DynamoDB Query vs Scan, GSI/LSI', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/QueryAndScan.html' },
  ddbtx:    { label: 'DynamoDB transactions and conditional writes', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html' },
  ddbstr:   { label: 'DynamoDB Streams', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html' },
  apigw:    { label: 'Amazon API Gateway', url: 'https://docs.aws.amazon.com/apigateway/' },
  step:     { label: 'AWS Step Functions (Standard vs Express)', url: 'https://docs.aws.amazon.com/step-functions/' },
  sqs:      { label: 'Amazon SQS', url: 'https://docs.aws.amazon.com/sqs/' },
  sns:      { label: 'Amazon SNS', url: 'https://docs.aws.amazon.com/sns/' },
  eb:       { label: 'Amazon EventBridge', url: 'https://docs.aws.amazon.com/eventbridge/' },
  cognito:  { label: 'Amazon Cognito (User Pools / Identity Pools)', url: 'https://docs.aws.amazon.com/cognito/' },
  iam:      { label: 'AWS IAM (roles + policies)', url: 'https://docs.aws.amazon.com/iam/' },
  kms:      { label: 'AWS KMS', url: 'https://docs.aws.amazon.com/kms/' },
  s3:       { label: 'Amazon S3', url: 'https://docs.aws.amazon.com/AmazonS3/' },
  s3mpu:    { label: 'S3 multipart upload + presigned URLs', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html' },
  secrets:  { label: 'AWS Secrets Manager', url: 'https://docs.aws.amazon.com/secretsmanager/' },
  ssm:      { label: 'AWS Systems Manager Parameter Store', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html' },
  sam:      { label: 'AWS SAM (Serverless Application Model)', url: 'https://docs.aws.amazon.com/serverless-application-model/' },
  cfn:      { label: 'AWS CloudFormation', url: 'https://docs.aws.amazon.com/cloudformation/' },
  cb:       { label: 'AWS CodeBuild', url: 'https://docs.aws.amazon.com/codebuild/' },
  cd:       { label: 'AWS CodeDeploy', url: 'https://docs.aws.amazon.com/codedeploy/' },
  cp:       { label: 'AWS CodePipeline', url: 'https://docs.aws.amazon.com/codepipeline/' },
  cc:       { label: 'AWS CodeCommit / CodeArtifact', url: 'https://docs.aws.amazon.com/codecommit/' },
  beanstalk:{ label: 'AWS Elastic Beanstalk deployment policies', url: 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.deploy-existing-version.html' },
  cw:       { label: 'Amazon CloudWatch (Metrics + Logs)', url: 'https://docs.aws.amazon.com/cloudwatch/' },
  cwli:     { label: 'CloudWatch Logs Insights', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html' },
  xray:     { label: 'AWS X-Ray', url: 'https://docs.aws.amazon.com/xray/' }
};

const QUESTIONS: Q[] = [

  // ───── Development with AWS Services (12) ─────
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'A team has 5 Lambda functions that all depend on the same NumPy/Pandas binary stack (~150MB). They want to share that dependency without duplicating it inside every deployment package. Which fits?',
    options: [
      { id: 'A', text: 'Package the dependencies into a Lambda layer and attach the layer to each function.' },
      { id: 'B', text: 'Bundle them into every Lambda zip individually.' },
      { id: 'C', text: 'Store them in S3 and download at cold start.' },
      { id: 'D', text: 'Run all 5 functions inside a single Lambda.' }
    ],
    correct: ['A'],
    explanation: 'Lambda layers exist exactly to share runtime dependencies across functions. Packaging in each zip duplicates storage and slows cold starts; S3 download adds latency.',
    ref: REFS.llayers
  },
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'A user-facing Lambda has occasional cold-start latency spikes that hurt UX. Latency budget is < 200ms 99th percentile. Which fits BEST?',
    options: [
      { id: 'A', text: 'Configure provisioned concurrency on the function (or alias) at the expected baseline.' },
      { id: 'B', text: 'Increase the Lambda memory to 10GB and hope.' },
      { id: 'C', text: 'Add SnapStart for Python (Java/Snap only — not applicable here).' },
      { id: 'D', text: 'Disable the function during off-hours.' }
    ],
    correct: ['A'],
    explanation: 'Provisioned concurrency keeps a configured number of execution environments warm. Memory tweaks help CPU but not init time. SnapStart applies to Java/.NET/Python (with limits — but the question implies Lambda generally; the canonical answer for cold starts is provisioned concurrency).',
    ref: REFS.lconcur
  },
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'A REST API needs request transformation and per-stage URL `/v1/...` `/v2/...` with request/response mapping templates. Which API Gateway type fits?',
    options: [
      { id: 'A', text: 'REST API (with method/integration request/response mappings + stages).' },
      { id: 'B', text: 'HTTP API only — has no transformations.' },
      { id: 'C', text: 'WebSocket API.' },
      { id: 'D', text: 'A direct ALB.' }
    ],
    correct: ['A'],
    explanation: 'REST APIs support full mapping templates and stages. HTTP APIs are leaner/cheaper but don\'t support mapping-template transformations. WebSocket is for bidirectional. ALB doesn\'t have API-stage transformations.',
    ref: REFS.apigw
  },
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'A workflow has < 5-minute, very high-throughput execution and per-execution cost matters more than fully audited history. Which Step Functions workflow type fits?',
    options: [
      { id: 'A', text: 'Express workflow.' },
      { id: 'B', text: 'Standard workflow.' },
      { id: 'C', text: 'A single Lambda doing everything.' },
      { id: 'D', text: 'A cron-based EC2.' }
    ],
    correct: ['A'],
    explanation: 'Express is optimized for high-throughput, short-duration workflows and bills per execution + ms. Standard supports up to 1 year, full history, exactly-once. Lambda alone misses orchestration semantics.',
    ref: REFS.step
  },
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'A DynamoDB table needs an additional access pattern: queries by `customerId + createdAt` while the base table keys on `orderId`. Which fits?',
    options: [
      { id: 'A', text: 'Create a Global Secondary Index (GSI) with `customerId` as PK and `createdAt` as SK.' },
      { id: 'B', text: 'Run a Scan with filter for every customer.' },
      { id: 'C', text: 'Add a Local Secondary Index — but LSI only works when the partition key is the SAME as the base table\'s.' },
      { id: 'D', text: 'Migrate to RDS.' }
    ],
    correct: ['A'],
    explanation: 'GSIs enable arbitrary alternate access patterns — different PK from base. LSIs require the same PK as the base table. Scans are expensive and slow. Migration is unnecessary.',
    ref: REFS.ddbq
  },
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'Two writers must update an item only if the current `version` attribute matches what they read (optimistic concurrency). Which DynamoDB feature fits?',
    options: [
      { id: 'A', text: 'A conditional write using a `ConditionExpression` on the `version` attribute.' },
      { id: 'B', text: 'A Scan + delete pattern.' },
      { id: 'C', text: 'A separate "lock" item using putItem with overwrite.' },
      { id: 'D', text: 'Stop one of the writers.' }
    ],
    correct: ['A'],
    explanation: 'Conditional writes are DynamoDB\'s native optimistic-concurrency primitive. The other options are wrong shape or anti-patterns.',
    ref: REFS.ddbtx
  },
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'Whenever an item is modified in a DynamoDB table, a downstream service must reliably react with at-least-once semantics. Which feature fits?',
    options: [
      { id: 'A', text: 'Enable DynamoDB Streams and consume via Lambda (or Kinesis adapter).' },
      { id: 'B', text: 'Poll the table every second with Scan.' },
      { id: 'C', text: 'Trigger CloudFront invalidation.' },
      { id: 'D', text: 'Use SES.' }
    ],
    correct: ['A'],
    explanation: 'DynamoDB Streams emit ordered change records consumable by Lambda (event-source mapping). Polling with Scan is expensive and unreliable.',
    ref: REFS.ddbstr
  },
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'A producer publishes one message per order. Consumers Email, Inventory, and Analytics each must receive every order. Which fits?',
    options: [
      { id: 'A', text: 'SNS topic with three SQS subscriptions (one queue per consumer) — fan-out pattern.' },
      { id: 'B', text: 'A single SQS queue shared by all three (each message would be delivered to only one consumer).' },
      { id: 'C', text: 'CloudWatch alarms.' },
      { id: 'D', text: 'A Lambda calling each consumer synchronously.' }
    ],
    correct: ['A'],
    explanation: 'SNS → multiple SQS subscriptions is the canonical fan-out pattern with isolation per consumer. A shared SQS only delivers each message once. Synchronous chains tightly couple producer to all consumers.',
    ref: REFS.sns
  },
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'You need exactly-once message processing with strict ordering by `customerId` for an order pipeline. Which fits?',
    options: [
      { id: 'A', text: 'SQS FIFO queue with `MessageGroupId = customerId` and content-based deduplication.' },
      { id: 'B', text: 'SQS Standard queue.' },
      { id: 'C', text: 'SNS Standard topic.' },
      { id: 'D', text: 'Kinesis Data Firehose with no shard key.' }
    ],
    correct: ['A'],
    explanation: 'SQS FIFO with MessageGroupId provides exactly-once + per-group FIFO ordering. Standard queues are at-least-once with best-effort ordering.',
    ref: REFS.sqs
  },
  {
    domain: 'Development with AWS Services',
    type: QType.SINGLE,
    stem: 'A Lambda must run on a cron schedule every weekday at 09:00 UTC. Which is the cleanest trigger?',
    options: [
      { id: 'A', text: 'An EventBridge schedule (or rule) with cron expression invoking the Lambda.' },
      { id: 'B', text: 'A 24/7 EC2 instance running a cron daemon that invokes the Lambda.' },
      { id: 'C', text: 'A spinning Lambda that sleeps until 09:00.' },
      { id: 'D', text: 'A user clicking a button.' }
    ],
    correct: ['A'],
    explanation: 'EventBridge Scheduler / scheduled rules with cron expressions are the canonical AWS scheduled trigger. The other options are wasteful, fragile, or absurd.',
    ref: REFS.eb
  },
  {
    domain: 'Development with AWS Services',
    type: QType.MULTI,
    stem: 'Which TWO are valid ways to integrate API Gateway with backend logic?',
    options: [
      { id: 'A', text: 'Lambda proxy integration (request/response passed transparently to/from Lambda).' },
      { id: 'B', text: 'AWS service integration (API Gateway calls another AWS service such as DynamoDB or SQS directly).' },
      { id: 'C', text: 'Hard-coded responses inside CloudFront only.' },
      { id: 'D', text: 'Embedded SQL in the API Gateway URL itself.' },
      { id: 'E', text: 'A 3rd-party UDP socket.' }
    ],
    correct: ['A', 'B'],
    explanation: 'Lambda proxy and AWS service integrations are documented API Gateway integration types. The other options are not valid integration patterns.',
    ref: REFS.apigw
  },
  {
    domain: 'Development with AWS Services',
    type: QType.MULTI,
    stem: 'Which TWO statements about uploading large files to S3 are TRUE?',
    options: [
      { id: 'A', text: 'Multipart upload allows resumable parallel uploads of objects larger than 5GB (and is recommended for objects >100MB).' },
      { id: 'B', text: 'Presigned URLs let a client upload directly to S3 without proxying through your backend.' },
      { id: 'C', text: 'S3 has a hard maximum object size of 5MB.' },
      { id: 'D', text: 'Single PUT supports objects up to 5TB.' },
      { id: 'E', text: 'Presigned URLs require the client to know your IAM access keys.' }
    ],
    correct: ['A', 'B'],
    explanation: 'Multipart and presigned URLs are correct. S3 single PUT is capped at 5GB (not 5TB and not 5MB). Presigned URLs do NOT expose keys to the client.',
    ref: REFS.s3mpu
  },

  // ───── Security (9) ─────
  {
    domain: 'Security',
    type: QType.SINGLE,
    stem: 'A web/mobile app needs end-user sign-up and sign-in (email + password, social IdPs) with managed user directory and tokens. Which Cognito feature fits?',
    options: [
      { id: 'A', text: 'Cognito User Pools.' },
      { id: 'B', text: 'Cognito Identity Pools (federated identities) only — those exchange tokens for AWS creds, not user directory.' },
      { id: 'C', text: 'IAM users — one per app user.' },
      { id: 'D', text: 'AWS Directory Service.' }
    ],
    correct: ['A'],
    explanation: 'User Pools = end-user directory + sign-in/up + tokens. Identity Pools complement them by exchanging tokens for temporary AWS credentials. IAM users for app end-users is an anti-pattern.',
    ref: REFS.cognito
  },
  {
    domain: 'Security',
    type: QType.SINGLE,
    stem: 'A signed-in app user must call AWS APIs (e.g., upload to S3) directly from the browser with TEMPORARY credentials scoped to their identity. Which fits?',
    options: [
      { id: 'A', text: 'Cognito Identity Pool — exchange the user pool ID token for temp AWS credentials via STS.' },
      { id: 'B', text: 'Embed your IAM user access keys in JavaScript.' },
      { id: 'C', text: 'Use root credentials.' },
      { id: 'D', text: 'A long-lived Lambda function URL.' }
    ],
    correct: ['A'],
    explanation: 'Identity Pools (federated identities) issue short-lived AWS credentials via STS in exchange for a JWT. The other options are critical anti-patterns.',
    ref: REFS.cognito
  },
  {
    domain: 'Security',
    type: QType.SINGLE,
    stem: 'A Lambda needs to read a database password at cold start. The team wants automatic rotation and IAM-controlled access. Which fits?',
    options: [
      { id: 'A', text: 'Store the password in AWS Secrets Manager and grant the Lambda execution role `secretsmanager:GetSecretValue`.' },
      { id: 'B', text: 'Hard-code in the deployment package.' },
      { id: 'C', text: 'Plaintext environment variable named `PASSWORD`.' },
      { id: 'D', text: 'A public S3 file.' }
    ],
    correct: ['A'],
    explanation: 'Secrets Manager supports rotation natively for RDS and IAM-scoped fetching. The other options leak credentials.',
    ref: REFS.secrets
  },
  {
    domain: 'Security',
    type: QType.SINGLE,
    stem: 'A team needs to store NON-secret application config (feature flags, endpoint URLs, sizes) accessible by Lambda — at the lowest cost.',
    options: [
      { id: 'A', text: 'AWS Systems Manager Parameter Store (Standard tier, free up to 10,000 params).' },
      { id: 'B', text: 'AWS Secrets Manager (paid per secret per month).' },
      { id: 'C', text: 'Hard-coded constants requiring redeploy on change.' },
      { id: 'D', text: 'A public S3 file.' }
    ],
    correct: ['A'],
    explanation: 'Parameter Store standard tier is free for non-secret config and integrates with IAM. Secrets Manager is paid and overkill for non-secrets. Constants force redeploys.',
    ref: REFS.ssm
  },
  {
    domain: 'Security',
    type: QType.SINGLE,
    stem: 'A Lambda must encrypt sensitive payloads using a customer-managed KMS key BEFORE storing them in DynamoDB. Which API call should the function use?',
    options: [
      { id: 'A', text: '`kms:GenerateDataKey` to get a per-payload data key, then envelope-encrypt the payload locally and store the ciphertext + encrypted-data-key.' },
      { id: 'B', text: 'Send the plaintext to KMS for encryption every time (works but expensive and capped at 4KB).' },
      { id: 'C', text: 'Just store plaintext.' },
      { id: 'D', text: 'Use an SSH tunnel.' }
    ],
    correct: ['A'],
    explanation: 'Envelope encryption with GenerateDataKey is the documented pattern for client-side / app-level encryption with KMS. Direct kms:Encrypt has a 4KB plaintext limit and high cost for large payloads.',
    ref: REFS.kms
  },
  {
    domain: 'Security',
    type: QType.SINGLE,
    stem: 'A Lambda must call DynamoDB. What\'s the LEAST-privilege way to grant access?',
    options: [
      { id: 'A', text: 'Attach an IAM policy to the function\'s execution role granting only the specific DynamoDB actions on the specific table ARN.' },
      { id: 'B', text: 'Attach `AdministratorAccess` to the role for "simplicity".' },
      { id: 'C', text: 'Use root credentials inside the Lambda.' },
      { id: 'D', text: 'Make the table public.' }
    ],
    correct: ['A'],
    explanation: 'Least privilege via narrowly scoped role policy on the specific table ARN is the canonical pattern. The other options violate security baselines.',
    ref: REFS.iam
  },
  {
    domain: 'Security',
    type: QType.SINGLE,
    stem: 'A REST API in API Gateway must be invokable only by IAM-authenticated users in the same account. Which authorizer fits?',
    options: [
      { id: 'A', text: 'IAM (AWS_IAM) authorization — sign requests with SigV4.' },
      { id: 'B', text: 'No authorization — public endpoint.' },
      { id: 'C', text: 'A custom Lambda authorizer that returns "Allow" unconditionally.' },
      { id: 'D', text: 'Basic Auth in a query string.' }
    ],
    correct: ['A'],
    explanation: 'AWS_IAM authorization requires SigV4-signed requests and integrates natively with IAM identity policies. The other options are insecure.',
    ref: REFS.apigw
  },
  {
    domain: 'Security',
    type: QType.MULTI,
    stem: 'Which TWO are recommended ways to share secrets with an EC2 application?',
    options: [
      { id: 'A', text: 'Store the secret in AWS Secrets Manager; the app reads it via the instance role.' },
      { id: 'B', text: 'Store as SecureString in SSM Parameter Store; the app reads it via the instance role.' },
      { id: 'C', text: 'Bake the secret into the AMI.' },
      { id: 'D', text: 'Email the secret to every developer.' },
      { id: 'E', text: 'Hard-code in user-data.' }
    ],
    correct: ['A', 'B'],
    explanation: 'Secrets Manager and SSM Parameter Store SecureString are the documented secret-distribution patterns. Baking secrets into AMIs / user-data / email is a leak risk.',
    ref: REFS.secrets
  },
  {
    domain: 'Security',
    type: QType.MULTI,
    stem: 'Which TWO statements about API Gateway authorization are TRUE?',
    options: [
      { id: 'A', text: 'Cognito User Pool authorizers validate JWTs issued by the user pool.' },
      { id: 'B', text: 'Lambda authorizers (custom) let you implement arbitrary auth logic and return an IAM policy.' },
      { id: 'C', text: 'API keys alone provide strong authentication (they don\'t — they\'re for usage plans/throttling, not auth).' },
      { id: 'D', text: 'WebSocket APIs cannot use any authorizer.' },
      { id: 'E', text: 'IAM authorization is impossible for HTTP APIs.' }
    ],
    correct: ['A', 'B'],
    explanation: 'Cognito and Lambda authorizers are documented API Gateway auth options. API keys are NOT authentication. WebSocket APIs DO support authorizers. HTTP APIs DO support IAM auth.',
    ref: REFS.apigw
  },

  // ───── Deployment (8) ─────
  {
    domain: 'Deployment',
    type: QType.SINGLE,
    stem: 'A team wants minimum-effort blue/green deployments for a Lambda function with automatic CloudWatch-alarm-based rollback. Which fits?',
    options: [
      { id: 'A', text: 'AWS CodeDeploy with a `Linear10PercentEvery1Minute` (or canary) deployment configuration on the Lambda alias.' },
      { id: 'B', text: 'Manual `aws lambda update-function-code` and pray.' },
      { id: 'C', text: 'Re-create the function with a new name on each release.' },
      { id: 'D', text: 'Disable monitoring during deploys.' }
    ],
    correct: ['A'],
    explanation: 'CodeDeploy for Lambda shifts traffic via aliases with linear/canary configs and auto-rolls-back on alarm. The other options are manual / unsafe.',
    ref: REFS.cd
  },
  {
    domain: 'Deployment',
    type: QType.SINGLE,
    stem: 'You want to define a serverless app (Lambda + API Gateway + DynamoDB) declaratively with shorter syntax than raw CloudFormation. Which fits?',
    options: [
      { id: 'A', text: 'AWS SAM (Serverless Application Model) — transforms to CloudFormation under the hood.' },
      { id: 'B', text: 'Click everything in the console and screenshot for documentation.' },
      { id: 'C', text: 'A bash script of `aws cli` calls.' },
      { id: 'D', text: 'Manual API calls from Postman.' }
    ],
    correct: ['A'],
    explanation: 'SAM is the AWS-native shorter syntax for serverless on top of CloudFormation. The other options are non-IaC and brittle.',
    ref: REFS.sam
  },
  {
    domain: 'Deployment',
    type: QType.SINGLE,
    stem: 'An Elastic Beanstalk web app is deployed with the `Rolling` policy. The team wants an option that keeps capacity at 100% during deploy and rolls back faster on failure. Which fits?',
    options: [
      { id: 'A', text: 'Immutable deployments — launches a new ASG, only swaps in if healthy; failure has no impact on existing fleet.' },
      { id: 'B', text: 'AllAtOnce — fastest but full-outage on failure.' },
      { id: 'C', text: 'Rolling with additional batch — temporarily increases capacity; partial impact on failure.' },
      { id: 'D', text: 'Rolling — same as the current policy.' }
    ],
    correct: ['A'],
    explanation: 'Immutable deploys keep full capacity, run on a fresh ASG, and discard on failure with no impact on running fleet. Rolling/AllAtOnce/Rolling-with-additional-batch trade off differently.',
    ref: REFS.beanstalk
  },
  {
    domain: 'Deployment',
    type: QType.SINGLE,
    stem: 'A CI/CD pipeline using CodePipeline runs unit tests, builds a container, and deploys to ECS. Which service should run the build and test stages?',
    options: [
      { id: 'A', text: 'AWS CodeBuild — fully managed build service, integrates with CodePipeline.' },
      { id: 'B', text: 'A 24/7 EC2 with Jenkins.' },
      { id: 'C', text: 'A Lambda doing the build itself.' },
      { id: 'D', text: 'CloudFormation StackSets.' }
    ],
    correct: ['A'],
    explanation: 'CodeBuild is the AWS-managed build service designed for this. The other options are off-pattern.',
    ref: REFS.cb
  },
  {
    domain: 'Deployment',
    type: QType.SINGLE,
    stem: 'A team uses CloudFormation. They want to ensure the template is the source of truth and detect when someone manually edits a resource in the console. Which feature fits?',
    options: [
      { id: 'A', text: 'CloudFormation drift detection.' },
      { id: 'B', text: 'CloudWatch alarms.' },
      { id: 'C', text: 'AWS Trusted Advisor.' },
      { id: 'D', text: 'IAM Access Analyzer.' }
    ],
    correct: ['A'],
    explanation: 'CloudFormation drift detection compares the deployed stack with the template and surfaces diffs. The other tools address different concerns.',
    ref: REFS.cfn
  },
  {
    domain: 'Deployment',
    type: QType.SINGLE,
    stem: 'A buildspec.yml in CodeBuild has a `secrets-manager` mapping. What does that do?',
    options: [
      { id: 'A', text: 'Fetches secret values from AWS Secrets Manager and injects them as environment variables for the build.' },
      { id: 'B', text: 'Encrypts the build artifacts at rest.' },
      { id: 'C', text: 'Hides build logs from CloudWatch.' },
      { id: 'D', text: 'Disables the build cache.' }
    ],
    correct: ['A'],
    explanation: 'CodeBuild has native Secrets Manager (and SSM) integration via env-var mappings — keeps secrets out of source. The other options are unrelated.',
    ref: REFS.cb
  },
  {
    domain: 'Deployment',
    type: QType.SINGLE,
    stem: 'A SAM template specifies `AutoPublishAlias: live` on a Lambda function. What does this do?',
    options: [
      { id: 'A', text: 'Publishes a new function version on every deploy and updates an alias `live` to point to it (commonly paired with CodeDeploy traffic-shifting).' },
      { id: 'B', text: 'Always invokes the previous version.' },
      { id: 'C', text: 'Disables CloudWatch logging.' },
      { id: 'D', text: 'Encrypts the function code.' }
    ],
    correct: ['A'],
    explanation: 'AutoPublishAlias is the SAM convention for versioned + aliased deploys, prerequisite for CodeDeploy traffic-shifting. The other options are not what it does.',
    ref: REFS.sam
  },
  {
    domain: 'Deployment',
    type: QType.MULTI,
    stem: 'Which TWO are valid CodePipeline source providers?',
    options: [
      { id: 'A', text: 'AWS CodeCommit.' },
      { id: 'B', text: 'GitHub or GitHub Enterprise (via the CodeStar connection).' },
      { id: 'C', text: 'A USB stick on someone\'s desk.' },
      { id: 'D', text: 'Email attachments.' },
      { id: 'E', text: 'A public S3 bucket without versioning enabled (versioning is required).' }
    ],
    correct: ['A', 'B'],
    explanation: 'CodeCommit and GitHub are documented source providers; S3 is supported but requires versioning. The other options are not source providers.',
    ref: REFS.cp
  },

  // ───── Troubleshooting and Optimization (6) ─────
  {
    domain: 'Troubleshooting and Optimization',
    type: QType.SINGLE,
    stem: 'A microservice request flows through API Gateway → Lambda → DynamoDB → SNS. The team wants per-segment latency and error visualisation. Which service fits?',
    options: [
      { id: 'A', text: 'AWS X-Ray with the SDK instrumented in Lambda (and active tracing on API Gateway).' },
      { id: 'B', text: 'A single CloudWatch alarm.' },
      { id: 'C', text: 'AWS Trusted Advisor.' },
      { id: 'D', text: 'A custom log file on EC2.' }
    ],
    correct: ['A'],
    explanation: 'X-Ray traces requests across AWS services and renders a service map with latency/error breakdown. The other options don\'t provide cross-service tracing.',
    ref: REFS.xray
  },
  {
    domain: 'Troubleshooting and Optimization',
    type: QType.SINGLE,
    stem: 'A team needs ad-hoc SQL-like analysis of CloudWatch Logs (filter by status code, group by URL, calc P95 latency). Which fits?',
    options: [
      { id: 'A', text: 'CloudWatch Logs Insights — purpose-built query language over CloudWatch Logs.' },
      { id: 'B', text: 'Download all logs and grep them on a laptop.' },
      { id: 'C', text: 'Use SES.' },
      { id: 'D', text: 'CloudFront access logs only.' }
    ],
    correct: ['A'],
    explanation: 'CloudWatch Logs Insights is the documented AWS log-analysis tool — purpose-built for ad-hoc queries. The other options are off-pattern.',
    ref: REFS.cwli
  },
  {
    domain: 'Troubleshooting and Optimization',
    type: QType.SINGLE,
    stem: 'Lambda invocations from API Gateway return `429` errors at peak. Which is the most likely cause and fix?',
    options: [
      { id: 'A', text: 'Account- or function-level concurrency limit hit; raise the function\'s reserved concurrency or request a Service Quotas increase.' },
      { id: 'B', text: 'API Gateway disabled itself.' },
      { id: 'C', text: 'CloudFront throttled the requests.' },
      { id: 'D', text: 'IAM permission missing.' }
    ],
    correct: ['A'],
    explanation: 'Lambda 429/TooManyRequestsException is concurrency throttling. The other causes don\'t produce 429 from Lambda.',
    ref: REFS.lconcur
  },
  {
    domain: 'Troubleshooting and Optimization',
    type: QType.SINGLE,
    stem: 'An app emits per-request custom CloudWatch metrics from inside Lambda — but bills are spiking. Which optimisation fits BEST?',
    options: [
      { id: 'A', text: 'Use the Embedded Metric Format (EMF) so metrics are extracted from log lines (1 PutMetricData equivalent for many metrics, lower cost).' },
      { id: 'B', text: 'Just disable the metrics.' },
      { id: 'C', text: 'Move every metric to a Slack message.' },
      { id: 'D', text: 'Use CloudWatch Logs only — no metrics.' }
    ],
    correct: ['A'],
    explanation: 'EMF is the documented cost-efficient way to publish high-cardinality custom metrics from logs. The other options either hide problems or aren\'t equivalent.',
    ref: REFS.cw
  },
  {
    domain: 'Troubleshooting and Optimization',
    type: QType.SINGLE,
    stem: 'A DynamoDB application receives `ProvisionedThroughputExceededException` despite estimated traffic being below allocated capacity. Which is the likely root cause?',
    options: [
      { id: 'A', text: 'A "hot partition" — uneven access concentrated on one PK; redesign keys for even distribution or use adaptive capacity / on-demand mode.' },
      { id: 'B', text: 'IAM permission denied.' },
      { id: 'C', text: 'KMS rotation conflict.' },
      { id: 'D', text: 'CloudWatch is broken.' }
    ],
    correct: ['A'],
    explanation: 'Throughput exceeded with average usage low almost always means a hot partition. Adaptive capacity helps automatically; on-demand or key redesign solves it. The other causes wouldn\'t produce that exception.',
    ref: REFS.ddb
  },
  {
    domain: 'Troubleshooting and Optimization',
    type: QType.MULTI,
    stem: 'Which TWO improvements REDUCE Lambda cold-start latency?',
    options: [
      { id: 'A', text: 'Configure provisioned concurrency on a hot alias.' },
      { id: 'B', text: 'Reduce deployment package size and minimise top-level imports.' },
      { id: 'C', text: 'Add many unused dependencies "just in case".' },
      { id: 'D', text: 'Disable VPC config (where possible) — but only if VPC isn\'t needed; modern Lambda VPC has improved cold start, this is situational.' },
      { id: 'E', text: 'Run the Lambda in a region thousands of km away from users.' }
    ],
    correct: ['A', 'B'],
    explanation: 'Provisioned concurrency and lean packages directly reduce cold-start latency. Adding unused deps and routing through far regions worsens it.',
    ref: REFS.lconcur
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
