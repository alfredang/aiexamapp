/**
 * Seed: 20 additional AZ-900 practice questions to bring the exam from
 * 40 → 60 (target). Distribution chosen to land near the 25/35/40
 * blueprint after this batch:
 *   Cloud concepts                 +4   (11 → 15; target 15)
 *   Azure architecture & services  +7   (14 → 21; target 21)
 *   Azure management & governance  +9   (15 → 24; target 24)
 *
 *   npx tsx scripts/seed-az900-fill2.ts
 *
 * Idempotent via generatedBy='manual:az900-fill2'.
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

const db = new PrismaClient();
const EXAM_SLUG = 'microsoft-az-900';
const TAG = 'manual:az900-fill2';

type Q = {
  domain: string;
  stem: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
  ref: { label: string; url: string };
};

const REFS = {
  cloud:      { label: 'Microsoft Learn — Describe cloud concepts', url: 'https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/' },
  arch:       { label: 'Microsoft Learn — Describe Azure architecture and services', url: 'https://learn.microsoft.com/en-us/training/paths/azure-fundamentals-describe-azure-architecture-services/' },
  mgmt:       { label: 'Microsoft Learn — Describe Azure management and governance', url: 'https://learn.microsoft.com/en-us/training/paths/describe-azure-management-governance/' },
  compute:    { label: 'Azure compute services overview', url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/compute-decision-tree' },
  network:    { label: 'Azure networking overview', url: 'https://learn.microsoft.com/en-us/azure/networking/fundamentals/networking-overview' },
  entra:      { label: 'Microsoft Entra ID overview', url: 'https://learn.microsoft.com/en-us/entra/fundamentals/whatis' },
  policy:     { label: 'Azure Policy overview', url: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview' },
  rbac:       { label: 'Azure RBAC overview', url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/overview' },
  monitor:    { label: 'Azure Monitor overview', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/overview' },
  purview:    { label: 'Microsoft Purview', url: 'https://learn.microsoft.com/en-us/purview/purview' },
  zerotrust:  { label: 'Zero Trust security model', url: 'https://learn.microsoft.com/en-us/security/zero-trust/zero-trust-overview' }
};

const QUESTIONS: Q[] = [

  // ───── Cloud concepts (+4) ─────
  {
    domain: 'Cloud concepts',
    stem: 'Which cloud benefit lets a development team provision a new test environment in minutes instead of waiting weeks for hardware procurement?',
    options: [
      { id: 'A', text: 'Reliability.' },
      { id: 'B', text: 'Agility.' },
      { id: 'C', text: 'Security.' },
      { id: 'D', text: 'Predictability.' }
    ],
    correctId: 'B',
    explanation: 'Agility is the ability to provision and reconfigure resources quickly to respond to changing needs — directly addresses "minutes instead of weeks". Reliability is about staying up; security is about protecting data; predictability covers cost and performance.',
    ref: REFS.cloud
  },
  {
    domain: 'Cloud concepts',
    stem: 'A team is fully managed by Microsoft and accesses Microsoft 365 by signing into a web portal. Which cloud service category does Microsoft 365 represent?',
    options: [
      { id: 'A', text: 'IaaS.' },
      { id: 'B', text: 'PaaS.' },
      { id: 'C', text: 'SaaS.' },
      { id: 'D', text: 'On-premises.' }
    ],
    correctId: 'C',
    explanation: 'Microsoft 365 is delivered as a complete application — the customer manages only data and identity. That\'s SaaS. IaaS gives VM control, PaaS gives a managed application platform but the customer still writes code, on-prem is not cloud at all.',
    ref: REFS.cloud
  },
  {
    domain: 'Cloud concepts',
    stem: 'A workload\'s usage automatically scales out during business hours and scales in overnight without human intervention. Which cloud characteristic is this?',
    options: [
      { id: 'A', text: 'Reliability.' },
      { id: 'B', text: 'Elasticity.' },
      { id: 'C', text: 'Governance.' },
      { id: 'D', text: 'Disaster recovery.' }
    ],
    correctId: 'B',
    explanation: 'Elasticity is automatic scaling out and in based on demand. Reliability is about staying available, governance is about policy, disaster recovery is recovery from major events. (Scalability is the broader umbrella; elasticity is the automatic, demand-driven variant.)',
    ref: REFS.cloud
  },
  {
    domain: 'Cloud concepts',
    stem: 'Which security principle assumes breach has already occurred and explicitly verifies every access request regardless of network location?',
    options: [
      { id: 'A', text: 'Defense in depth.' },
      { id: 'B', text: 'Zero Trust.' },
      { id: 'C', text: 'Perimeter security.' },
      { id: 'D', text: 'Single sign-on.' }
    ],
    correctId: 'B',
    explanation: 'Zero Trust assumes breach and requires explicit verification for every request regardless of the network it originated from. Defense in depth uses layered controls but doesn\'t carry the "assume breach + always verify" stance. Perimeter security trusts the internal network — the opposite. SSO is an authentication convenience, not a model.',
    ref: REFS.zerotrust
  },

  // ───── Azure architecture and services (+7) ─────
  {
    domain: 'Azure architecture and services',
    stem: 'You need to run an existing Linux web application that uses a custom kernel module. Which Azure compute service is the most appropriate?',
    options: [
      { id: 'A', text: 'Azure App Service.' },
      { id: 'B', text: 'Azure Functions.' },
      { id: 'C', text: 'Azure Virtual Machines.' },
      { id: 'D', text: 'Azure Container Instances.' }
    ],
    correctId: 'C',
    explanation: 'Custom kernel modules require full OS access — only Azure VMs (IaaS) provide that. App Service and Functions are managed PaaS where you don\'t control the host OS. ACI runs containers but not arbitrary kernel modules.',
    ref: REFS.compute
  },
  {
    domain: 'Azure architecture and services',
    stem: 'A team needs to orchestrate dozens of containerized microservices with auto-scaling, rolling updates, and service discovery. Which Azure service is designed for this?',
    options: [
      { id: 'A', text: 'Azure Kubernetes Service (AKS).' },
      { id: 'B', text: 'Azure Container Instances.' },
      { id: 'C', text: 'Azure Functions.' },
      { id: 'D', text: 'Azure App Service.' }
    ],
    correctId: 'A',
    explanation: 'AKS is managed Kubernetes — built for orchestrating many containers, rolling updates, and service discovery. ACI runs single containers and doesn\'t orchestrate fleets. Functions is event-driven serverless, not container orchestration. App Service can host a few container web apps but isn\'t a Kubernetes orchestrator.',
    ref: REFS.compute
  },
  {
    domain: 'Azure architecture and services',
    stem: 'You need to expose an SMB file share to multiple VMs across different operating systems. Which Azure storage option fits?',
    options: [
      { id: 'A', text: 'Azure Blob Storage.' },
      { id: 'B', text: 'Azure Files.' },
      { id: 'C', text: 'Azure Disk Storage.' },
      { id: 'D', text: 'Azure Table Storage.' }
    ],
    correctId: 'B',
    explanation: 'Azure Files exposes fully managed file shares accessible via SMB and NFS — designed for shared mount across multiple VMs. Blob is object storage. Disks attach to a single VM. Tables are NoSQL key-value, not file shares.',
    ref: REFS.compute
  },
  {
    domain: 'Azure architecture and services',
    stem: 'A subscription needs to filter inbound traffic to a subnet by source IP, port, and protocol. Which Azure networking feature provides this?',
    options: [
      { id: 'A', text: 'Network Security Group (NSG).' },
      { id: 'B', text: 'Virtual network peering.' },
      { id: 'C', text: 'Azure DNS.' },
      { id: 'D', text: 'ExpressRoute.' }
    ],
    correctId: 'A',
    explanation: 'NSGs filter traffic at the subnet or NIC level by source/destination IP, port, and protocol. VNet peering connects two VNets but doesn\'t filter traffic. DNS resolves names. ExpressRoute is a private connectivity option, not a packet filter.',
    ref: REFS.network
  },
  {
    domain: 'Azure architecture and services',
    stem: 'Which Microsoft Entra ID feature lets you require MFA only when a sign-in is risky (unusual location, anonymous IP, etc.) instead of always?',
    options: [
      { id: 'A', text: 'Conditional Access.' },
      { id: 'B', text: 'Single sign-on (SSO).' },
      { id: 'C', text: 'Self-service password reset.' },
      { id: 'D', text: 'Azure Policy.' }
    ],
    correctId: 'A',
    explanation: 'Conditional Access policies evaluate signals (user, location, device, risk) and apply controls (e.g., require MFA) when conditions are met. SSO is a convenience for repeated sign-ins. Self-service password reset addresses lockouts. Azure Policy governs Azure resources, not sign-ins.',
    ref: REFS.entra
  },
  {
    domain: 'Azure architecture and services',
    stem: 'A company wants users to sign in once and access multiple SaaS applications without re-authenticating. Which feature supports this?',
    options: [
      { id: 'A', text: 'Multi-factor authentication.' },
      { id: 'B', text: 'Single sign-on (SSO).' },
      { id: 'C', text: 'Conditional Access.' },
      { id: 'D', text: 'Azure Policy.' }
    ],
    correctId: 'B',
    explanation: 'SSO lets a user authenticate once and gain access to multiple applications. MFA is a verification step. Conditional Access decides when to require additional controls. Azure Policy governs resources, not sign-ins.',
    ref: REFS.entra
  },
  {
    domain: 'Azure architecture and services',
    stem: 'A multinational firm has a regulatory requirement that some workloads be hosted in datacenters operated under specific national agreements (e.g., U.S. Government, China). Which Azure construct addresses this?',
    options: [
      { id: 'A', text: 'Sovereign / specialized regions (e.g., Azure Government, Azure China).' },
      { id: 'B', text: 'Availability Zones.' },
      { id: 'C', text: 'Region pairs.' },
      { id: 'D', text: 'Resource locks.' }
    ],
    correctId: 'A',
    explanation: 'Sovereign regions (Azure Government, Azure China) are physically and operationally separated, designed to meet specific regulatory and national security requirements. Availability Zones, region pairs, and resource locks address availability and resource protection — not sovereignty.',
    ref: REFS.arch
  },

  // ───── Azure management and governance (+9) ─────
  {
    domain: 'Azure management and governance',
    stem: 'Which Azure service collects metrics and logs from resources and enables alerting based on those signals?',
    options: [
      { id: 'A', text: 'Azure Monitor.' },
      { id: 'B', text: 'Microsoft Defender for Cloud.' },
      { id: 'C', text: 'Azure Service Health.' },
      { id: 'D', text: 'Azure Advisor.' }
    ],
    correctId: 'A',
    explanation: 'Azure Monitor collects metrics and logs from Azure resources and supports alert rules based on them. Defender for Cloud focuses on security posture and threats. Service Health reports Azure-side incidents. Advisor surfaces best-practice recommendations.',
    ref: REFS.monitor
  },
  {
    domain: 'Azure management and governance',
    stem: 'You want to ensure no one in the organization can deploy a public IP address in any subscription. Which Azure capability enforces this at scale?',
    options: [
      { id: 'A', text: 'Azure Policy with a deny effect, applied at the management group.' },
      { id: 'B', text: 'Resource locks on every resource group.' },
      { id: 'C', text: 'Tagging all subscriptions with `noPublicIp=true`.' },
      { id: 'D', text: 'Removing the user\'s permissions in each subscription manually.' }
    ],
    correctId: 'A',
    explanation: 'Azure Policy with a deny effect blocks non-compliant deployments before they happen, and applying it at the management group cascades to all child subscriptions. Resource locks prevent deletion/modification but don\'t prevent creation by type. Tags are descriptive metadata. Manual permission edits don\'t scale and miss new users.',
    ref: REFS.policy
  },
  {
    domain: 'Azure management and governance',
    stem: 'You want a developer to be able to start, stop, and restart only one specific virtual machine, but nothing else. Which Azure access pattern fits?',
    options: [
      { id: 'A', text: 'Assign the developer the Owner role on the subscription.' },
      { id: 'B', text: 'Create a custom Azure RBAC role with the minimum required actions, scoped to that single VM.' },
      { id: 'C', text: 'Add the developer to a Microsoft Entra security group with no role.' },
      { id: 'D', text: 'Apply a CanNotDelete lock on the VM.' }
    ],
    correctId: 'B',
    explanation: 'A custom RBAC role with minimum needed actions (start/stop/restart on Microsoft.Compute/virtualMachines), scoped to that single VM, applies the principle of least privilege. Owner is wildly excessive. Entra group membership alone confers no permissions. Resource locks prevent destructive changes but don\'t grant operational access.',
    ref: REFS.rbac
  },
  {
    domain: 'Azure management and governance',
    stem: 'Where in the Azure RBAC scope hierarchy does a role assignment NOT propagate downward?',
    options: [
      { id: 'A', text: 'Role assignments at any scope propagate downward to all child scopes.' },
      { id: 'B', text: 'Role assignments at the resource scope; they apply only to that resource.' },
      { id: 'C', text: 'Role assignments at the management-group scope; they apply only to the group itself.' },
      { id: 'D', text: 'Role assignments are global and have no scope.' }
    ],
    correctId: 'B',
    explanation: 'RBAC scopes are: management group → subscription → resource group → resource. Assignments propagate down — except an assignment at the resource scope is already at the leaf and has no children to propagate to. Option A is *almost* right except for the resource scope. Options C and D misdescribe how RBAC propagation works.',
    ref: REFS.rbac
  },
  {
    domain: 'Azure management and governance',
    stem: 'Which Microsoft service is designed to discover, classify, and govern data across Azure, on-premises, and other clouds — supporting data-related compliance work?',
    options: [
      { id: 'A', text: 'Microsoft Purview.' },
      { id: 'B', text: 'Microsoft Defender for Cloud.' },
      { id: 'C', text: 'Azure Monitor.' },
      { id: 'D', text: 'Azure Advisor.' }
    ],
    correctId: 'A',
    explanation: 'Microsoft Purview is the data governance and compliance service — discovery, classification, lineage, and protection across hybrid and multi-cloud data estates. Defender for Cloud is for security posture and threat protection. Monitor is operational telemetry. Advisor is best-practice recommendations.',
    ref: REFS.purview
  },
  {
    domain: 'Azure management and governance',
    stem: 'You need an Azure tool that can produce a cost estimate for a proposed architecture (a specific VM size, a load balancer, and 100 GB of storage) BEFORE deployment. Which tool fits?',
    options: [
      { id: 'A', text: 'Azure Pricing Calculator.' },
      { id: 'B', text: 'Total Cost of Ownership (TCO) Calculator.' },
      { id: 'C', text: 'Azure Cost Management.' },
      { id: 'D', text: 'Azure Monitor.' }
    ],
    correctId: 'A',
    explanation: 'Pricing Calculator estimates Azure costs for a hypothetical configuration before deployment. TCO compares Azure vs current on-prem (different question). Cost Management analyzes deployed-resource spend (after the fact). Monitor handles telemetry, not cost.',
    ref: REFS.mgmt
  },
  {
    domain: 'Azure management and governance',
    stem: 'Which factor does NOT typically affect the cost of running an Azure VM?',
    options: [
      { id: 'A', text: 'The VM size and region.' },
      { id: 'B', text: 'The number of hours the VM is running.' },
      { id: 'C', text: 'The Azure tenant\'s name.' },
      { id: 'D', text: 'The amount of outbound data transfer (egress).' }
    ],
    correctId: 'C',
    explanation: 'VM cost depends on size (CPU/RAM/disk), region (regional pricing varies), running hours (consumption), and bandwidth (egress is metered). The tenant name is metadata only and has no pricing impact.',
    ref: REFS.mgmt
  },
  {
    domain: 'Azure management and governance',
    stem: 'Which Azure tool allows you to manage Azure resources interactively from a mobile device while away from a workstation?',
    options: [
      { id: 'A', text: 'Azure mobile app.' },
      { id: 'B', text: 'ARM template editor.' },
      { id: 'C', text: 'Bicep CLI.' },
      { id: 'D', text: 'Azure Resource Graph.' }
    ],
    correctId: 'A',
    explanation: 'The Azure mobile app provides interactive resource management from iOS/Android. ARM templates and Bicep are infrastructure-as-code tools, not interactive admin UIs. Resource Graph is a query API, not a mobile management surface.',
    ref: REFS.mgmt
  },
  {
    domain: 'Azure management and governance',
    stem: 'Where is the official source of truth for Microsoft\'s commitments around uptime guarantees and service credits for Azure services?',
    options: [
      { id: 'A', text: 'Azure Pricing Calculator.' },
      { id: 'B', text: 'Service Level Agreements (SLA) for each individual Azure service.' },
      { id: 'C', text: 'Azure Advisor.' },
      { id: 'D', text: 'Microsoft\'s annual report.' }
    ],
    correctId: 'B',
    explanation: 'Each Azure service publishes its own SLA documenting uptime commitments and service-credit terms. Pricing Calculator estimates cost. Advisor surfaces best practices. The annual report is corporate financial information.',
    ref: REFS.mgmt
  }
];

async function main() {
  const exam = await db.exam.findUnique({ where: { slug: EXAM_SLUG } });
  if (!exam) throw new Error(`Exam "${EXAM_SLUG}" not found`);

  const alreadySeeded = await db.question.count({
    where: { examId: exam.id, generatedBy: TAG }
  });
  if (alreadySeeded > 0) {
    console.log(`Already have ${alreadySeeded} questions tagged "${TAG}" — skipping.`);
    return;
  }

  for (const q of QUESTIONS) {
    await db.question.create({
      data: {
        examId: exam.id,
        domain: q.domain,
        difficulty: 2,
        type: QType.SINGLE,
        stem: q.stem,
        options: q.options,
        correct: [q.correctId],
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
