/**
 * One-shot seed: hand-authored sample questions for AZ-900 and Google ACE.
 *
 *   npx tsx scripts/seed-cloud-fundamentals.ts
 *
 * Idempotent — skips an exam if it already has questions. Domain names
 * match the existing exam blueprint set by prisma/seed.ts. Questions are
 * authored from public certification objectives, not real exam content.
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

const db = new PrismaClient();

type Q = {
  domain: string;
  stem: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
};

const AZ900: Q[] = [
  {
    domain: 'Cloud concepts',
    stem: 'Which of the following best describes the "elasticity" feature of cloud computing?',
    options: [
      { id: 'A', text: 'The ability to deploy resources to multiple geographic regions simultaneously.' },
      { id: 'B', text: 'The ability to automatically scale resources up and down based on demand.' },
      { id: 'C', text: 'The ability to pay only for resources you actually consume.' },
      { id: 'D', text: 'The ability to recover from service outages without data loss.' }
    ],
    correctId: 'B',
    explanation:
      'Elasticity specifically refers to the dynamic allocation and deallocation of resources to match demand. Option C describes the consumption-based pricing model. Option A describes geographic redundancy. Option D describes resilience and disaster recovery.'
  },
  {
    domain: 'Cloud concepts',
    stem:
      'A company wants to retain full control over the operating system, network configuration, and storage of their workload, while delegating only the physical hardware management to Microsoft. Which cloud service model meets this requirement?',
    options: [
      { id: 'A', text: 'Software as a Service (SaaS)' },
      { id: 'B', text: 'Platform as a Service (PaaS)' },
      { id: 'C', text: 'Infrastructure as a Service (IaaS)' },
      { id: 'D', text: 'Function as a Service (FaaS)' }
    ],
    correctId: 'C',
    explanation:
      'IaaS provides virtual machines where the customer manages the OS, networking, and storage; Microsoft manages only the physical hardware. PaaS abstracts the OS layer. SaaS delivers a complete application. FaaS abstracts both the OS and the application server.'
  },
  {
    domain: 'Cloud concepts',
    stem:
      'Which type of cloud deployment combines on-premises infrastructure with public cloud resources, allowing data and applications to move between them?',
    options: [
      { id: 'A', text: 'Public cloud' },
      { id: 'B', text: 'Private cloud' },
      { id: 'C', text: 'Hybrid cloud' },
      { id: 'D', text: 'Community cloud' }
    ],
    correctId: 'C',
    explanation:
      'Hybrid cloud explicitly combines on-premises (private) and public cloud resources with orchestrated workload mobility between them. Public cloud uses only third-party infrastructure. Private cloud is entirely on-premises or single-tenant. Community cloud is shared among related organizations.'
  },
  {
    domain: 'Azure architecture and services',
    stem:
      'A team needs to run small, event-driven code without provisioning or managing servers, paying only when the code executes. Which Azure service best fits?',
    options: [
      { id: 'A', text: 'Azure Virtual Machines' },
      { id: 'B', text: 'Azure App Service' },
      { id: 'C', text: 'Azure Functions' },
      { id: 'D', text: 'Azure Kubernetes Service' }
    ],
    correctId: 'C',
    explanation:
      'Azure Functions is a serverless compute service that runs code on triggers and bills per execution. VMs require server management. App Service hosts persistent web apps with always-on pricing. AKS requires cluster management.'
  },
  {
    domain: 'Azure architecture and services',
    stem:
      'Which Azure storage service is best suited for storing massive amounts of unstructured data such as images, documents, and backups?',
    options: [
      { id: 'A', text: 'Azure Files' },
      { id: 'B', text: 'Azure Blob Storage' },
      { id: 'C', text: 'Azure Disk Storage' },
      { id: 'D', text: 'Azure Table Storage' }
    ],
    correctId: 'B',
    explanation:
      'Blob Storage is designed for unstructured data at massive scale (text, binary, media). Azure Files provides SMB/NFS file shares. Disk Storage is for VM disks. Table Storage is for structured NoSQL key-value data.'
  },
  {
    domain: 'Azure architecture and services',
    stem:
      'Two Azure regions are paired together to provide redundancy and protection against regional outages. What is this called?',
    options: [
      { id: 'A', text: 'Availability zones' },
      { id: 'B', text: 'Region pairs' },
      { id: 'C', text: 'Resource groups' },
      { id: 'D', text: 'Geographies' }
    ],
    correctId: 'B',
    explanation:
      'Region pairs are pre-defined pairings within the same geography that provide cross-region replication for redundancy. Availability zones are within a single region. Resource groups are logical containers. Geographies are the broader top-level grouping.'
  },
  {
    domain: 'Azure management and governance',
    stem:
      "Which Azure service helps you analyze a workload's actual cost, identify spending anomalies, and forecast future spend?",
    options: [
      { id: 'A', text: 'Azure Advisor' },
      { id: 'B', text: 'Azure Cost Management' },
      { id: 'C', text: 'Azure Policy' },
      { id: 'D', text: 'Azure Monitor' }
    ],
    correctId: 'B',
    explanation:
      'Azure Cost Management is the dedicated service for cost analysis, budgets, and forecasting. Advisor gives recommendations across cost, security, and performance — not in-depth cost analysis. Policy enforces compliance rules. Monitor tracks performance and availability metrics.'
  },
  {
    domain: 'Azure management and governance',
    stem:
      'You need to enforce that all storage accounts in a subscription must use HTTPS-only traffic. Which service should you use?',
    options: [
      { id: 'A', text: 'Azure Blueprints' },
      { id: 'B', text: 'Azure Policy' },
      { id: 'C', text: 'Microsoft Defender for Cloud' },
      { id: 'D', text: 'Azure RBAC' }
    ],
    correctId: 'B',
    explanation:
      'Azure Policy enforces resource configuration standards through definitions and assignments — exactly the use case described. Blueprints bundle environments. Defender provides security recommendations and threat protection but does not enforce configuration rules. RBAC controls who can perform actions, not what configurations resources must have.'
  },
  {
    domain: 'Azure management and governance',
    stem:
      "Your organization's billing department needs read-only access to view costs across all subscriptions but should not be able to modify any resources. What is the most appropriate Azure feature to grant this access?",
    options: [
      { id: 'A', text: 'Assigning the "Owner" role at the management group level.' },
      { id: 'B', text: 'Assigning the built-in "Billing Reader" RBAC role at the appropriate scope.' },
      { id: 'C', text: 'Sharing the global administrator account credentials.' },
      { id: 'D', text: 'Creating a custom Azure AD group with no permissions.' }
    ],
    correctId: 'B',
    explanation:
      'Built-in RBAC roles like Billing Reader are designed for least-privilege scenarios — read-only billing and cost access. Owner grants full access including resource modification. Sharing credentials violates security best practices. A group with no permissions would not grant the needed access.'
  },
  {
    domain: 'Azure management and governance',
    stem: 'Which Azure support plan is required to receive 24/7 phone support for a production workload?',
    options: [
      { id: 'A', text: 'Basic' },
      { id: 'B', text: 'Developer' },
      { id: 'C', text: 'Standard' },
      { id: 'D', text: 'Free' }
    ],
    correctId: 'C',
    explanation:
      'The Standard support plan and above include 24/7 phone support for production workloads. Basic and Free include only billing and subscription support. Developer supports business-hours email/web for non-production environments.'
  }
];

const ACE: Q[] = [
  {
    domain: 'Setting up a cloud solution environment',
    stem:
      'Your organization wants to organize Google Cloud resources for development, staging, and production environments while applying different IAM policies and billing to each. What is the recommended structure?',
    options: [
      { id: 'A', text: 'Use a single project with separate VPCs for each environment.' },
      { id: 'B', text: 'Use separate projects for each environment, organized under folders within an organization.' },
      { id: 'C', text: 'Use a single project with resource labels to differentiate environments.' },
      { id: 'D', text: 'Use separate organizations for each environment.' }
    ],
    correctId: 'B',
    explanation:
      'Best practice is to isolate environments at the project level so IAM, billing, and quotas are scoped independently. Folders allow grouping projects (e.g., dev/staging/prod) under an organization. A single project means shared IAM and billing — the opposite of what is needed. Separate organizations is overkill and creates cross-org admin overhead.'
  },
  {
    domain: 'Setting up a cloud solution environment',
    stem:
      "You need to install the gcloud CLI on a developer's workstation and authenticate it to run commands against your project. Which command initializes gcloud and signs you in?",
    options: [
      { id: 'A', text: '`gcloud auth login`' },
      { id: 'B', text: '`gcloud init`' },
      { id: 'C', text: '`gcloud config set project PROJECT_ID`' },
      { id: 'D', text: '`gcloud components install`' }
    ],
    correctId: 'B',
    explanation:
      '`gcloud init` is the interactive setup that authenticates and configures the default project, region, and zone — it is the canonical first-run command. `gcloud auth login` only handles authentication. `gcloud config set project` only sets the active project. `gcloud components install` manages CLI components, not initial setup.'
  },
  {
    domain: 'Planning and configuring a cloud solution',
    stem:
      'A workload has unpredictable traffic spikes and you want to minimize cost while ensuring it scales to handle bursts. Which Compute Engine option best supports this?',
    options: [
      { id: 'A', text: 'A managed instance group (MIG) with autoscaling enabled.' },
      { id: 'B', text: 'A single high-CPU VM provisioned for peak load.' },
      { id: 'C', text: 'A reservation with a 3-year commitment.' },
      { id: 'D', text: 'Sole-tenant nodes.' }
    ],
    correctId: 'A',
    explanation:
      'MIGs with autoscaling automatically add and remove instances based on metrics like CPU utilization, matching capacity to demand and minimizing idle cost. A peak-sized single VM wastes capacity at low load. A 3-year commitment saves money for steady-state usage but does not help with bursts. Sole-tenant nodes are for compliance or licensing isolation, not autoscaling.'
  },
  {
    domain: 'Planning and configuring a cloud solution',
    stem:
      'You need to estimate the monthly cost of a proposed Google Cloud architecture before deploying it. Which tool should you use?',
    options: [
      { id: 'A', text: 'Cloud Billing reports' },
      { id: 'B', text: 'Google Cloud Pricing Calculator' },
      { id: 'C', text: 'Cost breakdown in the Cloud Console' },
      { id: 'D', text: 'Cloud Monitoring metrics' }
    ],
    correctId: 'B',
    explanation:
      'The Pricing Calculator generates cost estimates from configured services before any deployment. Billing reports and Console cost breakdown show actual incurred costs after deployment. Cloud Monitoring tracks performance and availability, not pricing.'
  },
  {
    domain: 'Deploying and implementing a cloud solution',
    stem:
      'You need to deploy a containerized application to Google Cloud and want Google to manage the underlying nodes, scaling, and Kubernetes control plane entirely. Which service is the best fit?',
    options: [
      { id: 'A', text: 'GKE Standard' },
      { id: 'B', text: 'GKE Autopilot' },
      { id: 'C', text: 'Cloud Run' },
      { id: 'D', text: 'Compute Engine with Docker installed' }
    ],
    correctId: 'B',
    explanation:
      'GKE Autopilot is the fully managed Kubernetes mode — Google manages nodes, autoscaling, and the control plane; you pay per pod. GKE Standard requires you to manage node pools. Cloud Run is excellent serverless but is not Kubernetes. Compute Engine plus Docker is full self-management.'
  },
  {
    domain: 'Deploying and implementing a cloud solution',
    stem:
      "Your team uses Cloud Storage to host a static website's assets. You need to make a new bucket's contents publicly readable over HTTPS. What is the most appropriate way to grant read access to all users?",
    options: [
      { id: 'A', text: 'Grant `roles/storage.objectViewer` to the principal `allUsers`.' },
      { id: 'B', text: 'Set the bucket\'s ACL to "private" and share signed URLs.' },
      { id: 'C', text: 'Grant `roles/storage.admin` to `allAuthenticatedUsers`.' },
      { id: 'D', text: 'Disable IAM on the bucket and rely on legacy ACLs only.' }
    ],
    correctId: 'A',
    explanation:
      '`allUsers` represents anonymous users, and `objectViewer` is the least-privilege read role — exactly what public-read requires. Signed URLs work for time-limited access, not public sites. `storage.admin` grants full control, far more than needed. Disabling IAM is not a recommended pattern.'
  },
  {
    domain: 'Ensuring successful operation of a cloud solution',
    stem:
      "A production VM's CPU is sustained at 90%+ for over an hour. You want to be alerted automatically next time this happens. Which Google Cloud feature should you configure?",
    options: [
      { id: 'A', text: 'A Cloud Logging sink' },
      { id: 'B', text: 'A Cloud Monitoring alerting policy with a threshold condition' },
      { id: 'C', text: 'A Cloud Run job triggered on a schedule' },
      { id: 'D', text: 'A Pub/Sub subscription' }
    ],
    correctId: 'B',
    explanation:
      'Cloud Monitoring alerting policies define conditions on metrics (such as CPU > 90% for 1h) and notify configured channels when fired. Logging sinks export logs but do not compare metrics to thresholds. Cloud Run jobs run code, not alerting. Pub/Sub delivers messages but does not evaluate metric thresholds itself.'
  },
  {
    domain: 'Ensuring successful operation of a cloud solution',
    stem:
      'After a production deployment, your application begins throwing 500 errors. You need to find the relevant log entries quickly. Which tool is designed for searching, filtering, and analyzing log data across Google Cloud services?',
    options: [
      { id: 'A', text: 'Cloud Trace' },
      { id: 'B', text: 'Cloud Logging (Logs Explorer)' },
      { id: 'C', text: 'Cloud Profiler' },
      { id: 'D', text: 'Error Reporting' }
    ],
    correctId: 'B',
    explanation:
      "Cloud Logging's Logs Explorer is the searchable interface for filtering and analyzing logs across Google Cloud services. Cloud Trace shows latency traces, not log content. Cloud Profiler analyzes CPU and memory profiles. Error Reporting groups exceptions but is downstream of Logging — Logs Explorer gives the broadest view."
  },
  {
    domain: 'Configuring access and security',
    stem:
      'You want to grant a user the ability to start and stop Compute Engine VMs but not modify their configuration. Which approach follows the principle of least privilege?',
    options: [
      { id: 'A', text: 'Grant the `roles/compute.admin` role at the project level.' },
      { id: 'B', text: 'Grant the `roles/compute.instanceAdmin.v1` role at the project level.' },
      { id: 'C', text: 'Grant the `roles/owner` role at the project level.' },
      { id: 'D', text: 'Grant `roles/compute.viewer` plus a custom role limited to the `compute.instances.start` and `compute.instances.stop` permissions.' }
    ],
    correctId: 'D',
    explanation:
      'Least privilege requires the smallest set of permissions for the task. A custom role with just start/stop (plus viewer for reading instance state) does that. compute.admin and instanceAdmin grant broad lifecycle permissions including modification and deletion. Owner is full project access — the opposite of least privilege.'
  },
  {
    domain: 'Configuring access and security',
    stem:
      'Your application running on a Compute Engine VM needs to read from a Cloud Storage bucket. What is the most secure way to grant the application this access?',
    options: [
      { id: 'A', text: 'Embed a service account JSON key file in the VM image.' },
      { id: 'B', text: 'Attach a service account to the VM instance with the `roles/storage.objectViewer` role on the bucket.' },
      { id: 'C', text: 'Use the VM owner\'s user credentials by running `gcloud auth login` at startup.' },
      { id: 'D', text: 'Make the bucket publicly readable.' }
    ],
    correctId: 'B',
    explanation:
      'Attaching a service account with scoped IAM is the recommended pattern — credentials are managed by Google, never written to disk, and access is least-privilege. JSON keys are theft-vulnerable and a known anti-pattern. User credentials on a VM tie the workload to a person. Public buckets defeat the purpose of access control.'
  }
];

const REFS_AZ = [{ label: 'Microsoft Learn — AZ-900', url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/' }];
const REFS_GCP = [{ label: 'Google Cloud — Associate Cloud Engineer', url: 'https://cloud.google.com/learn/certification/cloud-engineer' }];

async function seedExam(slug: string, questions: Q[], references: { label: string; url: string }[], teaserCount: number) {
  const exam = await db.exam.findUnique({ where: { slug } });
  if (!exam) {
    console.error(`✗ Exam not found: ${slug}`);
    return;
  }
  const existing = await db.question.count({ where: { examId: exam.id } });
  if (existing > 0) {
    console.log(`• ${slug}: already has ${existing} questions — skipping.`);
    return;
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await db.question.create({
      data: {
        examId: exam.id,
        domain: q.domain,
        difficulty: 3,
        type: QType.SINGLE,
        stem: q.stem,
        options: q.options,
        correct: [q.correctId],
        explanation: q.explanation,
        references,
        status: QStatus.PUBLISHED,
        generatedBy: 'manual:cloud-fundamentals',
        isTeaser: i < teaserCount
      }
    });
  }
  console.log(`✓ ${slug}: ${questions.length} questions seeded (${teaserCount} teasers).`);
}

async function main() {
  await seedExam('microsoft-az-900', AZ900, REFS_AZ, 4);
  await seedExam('google-associate-cloud-engineer', ACE, REFS_GCP, 4);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
