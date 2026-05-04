/**
 * Seed: 30 hand-authored AZ-900 (Microsoft Azure Fundamentals) practice
 * questions covering topics not yet in the existing 10-question seed.
 *
 *   npx tsx scripts/seed-az900-fill.ts
 *
 * Distribution (matches the official 25/35/40 blueprint as closely as
 * possible given the existing question mix; a follow-up batch of 20 will
 * fully reach 60 with target weighting):
 *   Cloud concepts                 +8   (existing 3 → 11; target 15)
 *   Azure architecture & services  +11  (existing 3 → 14; target 21)
 *   Azure management & governance  +11  (existing 4 → 15; target 24)
 *
 * Original practice questions modelled on the published AZ-900 skills
 * outline (learn.microsoft.com/credentials/certifications/azure-fundamentals/).
 *
 * Idempotent: skips if questions tagged generatedBy='manual:az900-fill'
 * already exist for the exam.
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

const db = new PrismaClient();

const EXAM_SLUG = 'microsoft-az-900';
const TAG = 'manual:az900-fill';

type Q = {
  domain: string;
  stem: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
  ref: { label: string; url: string };
};

const REFS = {
  cloudConcepts: { label: 'Microsoft Learn — Describe cloud concepts', url: 'https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/' },
  architecture:  { label: 'Microsoft Learn — Describe Azure architecture and services', url: 'https://learn.microsoft.com/en-us/training/paths/azure-fundamentals-describe-azure-architecture-services/' },
  management:    { label: 'Microsoft Learn — Describe Azure management and governance', url: 'https://learn.microsoft.com/en-us/training/paths/describe-azure-management-governance/' },
  shared:        { label: 'Shared responsibility model in the cloud', url: 'https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility' },
  regions:       { label: 'Azure regions, availability zones, and region pairs', url: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview' },
  storage:       { label: 'Azure Storage services overview', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-introduction' },
  storageRed:    { label: 'Azure Storage redundancy', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy' },
  compute:       { label: 'Azure compute services overview', url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/compute-decision-tree' },
  network:       { label: 'Azure networking overview', url: 'https://learn.microsoft.com/en-us/azure/networking/fundamentals/networking-overview' },
  entra:         { label: 'Microsoft Entra ID overview', url: 'https://learn.microsoft.com/en-us/entra/fundamentals/whatis' },
  defender:      { label: 'Microsoft Defender for Cloud', url: 'https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction' },
  iac:           { label: 'Azure Resource Manager and Bicep', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview' },
  monitor:       { label: 'Azure Monitor overview', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/overview' },
  advisor:       { label: 'Azure Advisor', url: 'https://learn.microsoft.com/en-us/azure/advisor/advisor-overview' },
  pricing:       { label: 'Pricing calculator and TCO', url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/cost-mgt-best-practices' },
  sla:           { label: 'Azure Service Level Agreements', url: 'https://www.microsoft.com/en-us/licensing/docs/customeragreement' },
  governance:    { label: 'Cloud governance — management groups, policy, locks', url: 'https://learn.microsoft.com/en-us/azure/governance/' }
};

const QUESTIONS: Q[] = [

  // ═════════════════════════════════════════════════════════════════
  // Cloud concepts (+8)
  // ═════════════════════════════════════════════════════════════════
  {
    domain: 'Cloud concepts',
    stem: 'Which pricing model lets a company pay only for the compute resources it actually consumes, with no upfront commitment?',
    options: [
      { id: 'A', text: 'Capital expenditure (CapEx) model.' },
      { id: 'B', text: 'Consumption-based (pay-as-you-go) model.' },
      { id: 'C', text: 'Reserved-instance prepayment.' },
      { id: 'D', text: 'Perpetual on-premises licensing.' }
    ],
    correctId: 'B',
    explanation: 'The consumption-based model bills for actual usage with no upfront commitment — the defining cost characteristic of public cloud. CapEx represents large upfront purchases (the opposite). Reserved instances are a discount mechanism that requires upfront commitment. Perpetual on-prem licensing is not cloud at all.',
    ref: REFS.cloudConcepts
  },
  {
    domain: 'Cloud concepts',
    stem: 'Under the cloud shared responsibility model, who is responsible for patching the operating system of an Azure Virtual Machine (IaaS)?',
    options: [
      { id: 'A', text: 'Microsoft.' },
      { id: 'B', text: 'The customer.' },
      { id: 'C', text: 'Both — patching is fully shared.' },
      { id: 'D', text: 'A third-party security partner is required.' }
    ],
    correctId: 'B',
    explanation: 'For IaaS, the customer owns the guest OS — including patching. Microsoft is responsible for the host, hypervisor, and physical infrastructure. PaaS and SaaS shift more responsibility to Microsoft, but for VMs the customer patches the OS.',
    ref: REFS.shared
  },
  {
    domain: 'Cloud concepts',
    stem: 'A retail site has dramatic traffic spikes during flash sales but otherwise normal traffic. Which cloud benefit most directly addresses this?',
    options: [
      { id: 'A', text: 'Disaster recovery.' },
      { id: 'B', text: 'Scalability — adding capacity to handle higher load when needed.' },
      { id: 'C', text: 'High availability across multiple regions.' },
      { id: 'D', text: 'Predictability of cost.' }
    ],
    correctId: 'B',
    explanation: 'Scalability is the ability to increase or decrease capacity to match demand. (Elasticity refers specifically to automatic, often rapid, scaling — but scalability is the broader concept being tested here.) Disaster recovery, high availability, and cost predictability address different problems.',
    ref: REFS.cloudConcepts
  },
  {
    domain: 'Cloud concepts',
    stem: 'Which cloud service model gives the customer a managed application platform — runtime, OS patching, and load balancing — but NOT direct access to the underlying VMs?',
    options: [
      { id: 'A', text: 'Infrastructure as a Service (IaaS).' },
      { id: 'B', text: 'Platform as a Service (PaaS).' },
      { id: 'C', text: 'Software as a Service (SaaS).' },
      { id: 'D', text: 'Function as a Service is the only option that hides VMs.' }
    ],
    correctId: 'B',
    explanation: 'PaaS provides a managed runtime/platform — the provider owns OS, runtime, and load balancing; the customer owns the application code and data. IaaS gives VM-level control. SaaS hides the application as well as the platform. FaaS is a sub-category of PaaS, not the only model with hidden VMs.',
    ref: REFS.cloudConcepts
  },
  {
    domain: 'Cloud concepts',
    stem: 'A manufacturing company is required by regulation to keep certain data on-premises but wants to use Azure for analytics on non-sensitive data. Which deployment model fits best?',
    options: [
      { id: 'A', text: 'Public cloud only.' },
      { id: 'B', text: 'Private cloud only.' },
      { id: 'C', text: 'Hybrid cloud — combining on-premises infrastructure with public cloud services.' },
      { id: 'D', text: 'Multi-cloud — combining two public cloud providers.' }
    ],
    correctId: 'C',
    explanation: 'Hybrid cloud is the documented fit for "some workloads stay on-prem due to regulation, others run in public cloud" scenarios. Public-only would force the regulated data into the cloud. Private-only loses the analytics scale of Azure. Multi-cloud refers to using multiple public providers, not on-prem + public.',
    ref: REFS.cloudConcepts
  },
  {
    domain: 'Cloud concepts',
    stem: 'Your finance team prefers predictable yearly capital purchases over ongoing variable bills. Which characteristic of cloud computing does this preference push back against?',
    options: [
      { id: 'A', text: 'High availability.' },
      { id: 'B', text: 'Operational expenditure (OpEx) — variable, usage-based ongoing spend.' },
      { id: 'C', text: 'Disaster recovery.' },
      { id: 'D', text: 'Geo-redundancy.' }
    ],
    correctId: 'B',
    explanation: 'Cloud spend is OpEx — ongoing and variable, not a one-time CapEx purchase. A finance team that prefers predictable annual capital outlays is pushing back against the OpEx nature of cloud. The other options are technical capabilities unrelated to the spending model.',
    ref: REFS.cloudConcepts
  },
  {
    domain: 'Cloud concepts',
    stem: 'A company designs its production workload to remain operational even if a single Azure datacenter fails. Which design principle is being applied?',
    options: [
      { id: 'A', text: 'Agility.' },
      { id: 'B', text: 'High availability.' },
      { id: 'C', text: 'Consumption-based pricing.' },
      { id: 'D', text: 'Vertical scaling.' }
    ],
    correctId: 'B',
    explanation: 'High availability is the design principle of staying operational despite component failure (such as a datacenter outage). Agility is the speed of provisioning. Consumption pricing is a billing model. Vertical scaling is increasing the size of a single resource (and doesn\'t address datacenter failure on its own).',
    ref: REFS.cloudConcepts
  },
  {
    domain: 'Cloud concepts',
    stem: 'A team needs to recover its workload to a different geographic region within 4 hours after a regional disaster. Which capability does this requirement describe?',
    options: [
      { id: 'A', text: 'Disaster recovery, with a Recovery Time Objective (RTO) of 4 hours.' },
      { id: 'B', text: 'Vertical scaling.' },
      { id: 'C', text: 'Elasticity.' },
      { id: 'D', text: 'Defense in depth.' }
    ],
    correctId: 'A',
    explanation: 'Disaster recovery is the capability to restore operation after a major event. RTO is the maximum acceptable time to recover. The other options describe scaling, automatic capacity adjustment, and a layered security posture — not recovery from a regional disaster.',
    ref: REFS.cloudConcepts
  },

  // ═════════════════════════════════════════════════════════════════
  // Azure architecture and services (+11)
  // ═════════════════════════════════════════════════════════════════
  {
    domain: 'Azure architecture and services',
    stem: 'What is an Availability Zone in Azure?',
    options: [
      { id: 'A', text: 'A pair of regions geographically connected for cross-region redundancy.' },
      { id: 'B', text: 'A physically separate datacenter within an Azure region, with independent power, cooling, and networking.' },
      { id: 'C', text: 'A logical grouping of resources for billing.' },
      { id: 'D', text: 'A subscription-level scope for applying policy.' }
    ],
    correctId: 'B',
    explanation: 'Availability Zones are physically separate datacenters within a single Azure region, each with independent power, cooling, and networking. They\'re used for high availability within a region. Region pairs are at the multi-region level. The other options describe billing and governance scopes, not infrastructure topology.',
    ref: REFS.regions
  },
  {
    domain: 'Azure architecture and services',
    stem: 'You need to organize Azure resources for a multi-team project so that all related resources can be deployed, managed, and deleted together. Which Azure construct is appropriate?',
    options: [
      { id: 'A', text: 'A management group.' },
      { id: 'B', text: 'A resource group.' },
      { id: 'C', text: 'A subscription.' },
      { id: 'D', text: 'An Azure region.' }
    ],
    correctId: 'B',
    explanation: 'A resource group is the logical container for resources that share the same lifecycle (deploy/update/delete together). Management groups organize subscriptions for governance. Subscriptions are billing/access boundaries. Regions are physical locations.',
    ref: REFS.architecture
  },
  {
    domain: 'Azure architecture and services',
    stem: 'A startup needs to host a containerized web application without managing any underlying VMs or container orchestration. Which Azure compute service is the best initial fit?',
    options: [
      { id: 'A', text: 'Azure Virtual Machines.' },
      { id: 'B', text: 'Azure Container Instances (ACI) for the simplest single-container workload, or Azure App Service for a managed web-app platform.' },
      { id: 'C', text: 'Azure Kubernetes Service (AKS).' },
      { id: 'D', text: 'Azure Batch.' }
    ],
    correctId: 'B',
    explanation: 'For a small containerized web app with no orchestration needs, ACI (single container) or App Service (managed web platform) are the lightest options. VMs require OS management. AKS is full Kubernetes orchestration — overkill for a simple app and operationally complex. Batch is for parallel/HPC workloads.',
    ref: REFS.compute
  },
  {
    domain: 'Azure architecture and services',
    stem: 'A company needs the cheapest storage tier for compliance backups that will rarely be accessed but must be retained for 7 years. Which Azure Blob storage tier is most appropriate?',
    options: [
      { id: 'A', text: 'Hot tier.' },
      { id: 'B', text: 'Cool tier.' },
      { id: 'C', text: 'Archive tier.' },
      { id: 'D', text: 'Premium tier.' }
    ],
    correctId: 'C',
    explanation: 'Archive is the lowest-cost storage tier and is designed for data accessed rarely (months or years), with higher retrieval latency and rehydration cost — perfect for long-term compliance retention. Hot is for frequently accessed data. Cool is for infrequent but online data. Premium is high-performance, expensive storage for hot workloads.',
    ref: REFS.storage
  },
  {
    domain: 'Azure architecture and services',
    stem: 'An organization needs storage that survives the loss of an entire Azure region. Which Azure Storage redundancy option meets that requirement?',
    options: [
      { id: 'A', text: 'Locally redundant storage (LRS).' },
      { id: 'B', text: 'Zone-redundant storage (ZRS).' },
      { id: 'C', text: 'Geo-redundant storage (GRS) or geo-zone-redundant storage (GZRS).' },
      { id: 'D', text: 'Premium SSD storage.' }
    ],
    correctId: 'C',
    explanation: 'GRS and GZRS replicate data to a secondary region, surviving the loss of an entire region. LRS protects only against single-disk failure. ZRS protects against datacenter-level failure within a region but not regional loss. Premium SSD is a performance tier, not a redundancy option.',
    ref: REFS.storageRed
  },
  {
    domain: 'Azure architecture and services',
    stem: 'Which Azure service provides cloud-based identity and access management, including features such as single sign-on, multi-factor authentication, and Conditional Access?',
    options: [
      { id: 'A', text: 'Microsoft Defender for Cloud.' },
      { id: 'B', text: 'Microsoft Entra ID (formerly Azure Active Directory).' },
      { id: 'C', text: 'Azure Key Vault.' },
      { id: 'D', text: 'Azure Sentinel.' }
    ],
    correctId: 'B',
    explanation: 'Microsoft Entra ID (the renamed Azure AD) is Azure\'s cloud identity and access management service — SSO, MFA, Conditional Access. Defender for Cloud is a security posture / threat-protection product. Key Vault stores secrets and certificates. Sentinel is a SIEM/SOAR.',
    ref: REFS.entra
  },
  {
    domain: 'Azure architecture and services',
    stem: 'You want an additional verification factor required at sign-in beyond a password. Which Microsoft Entra ID feature provides this?',
    options: [
      { id: 'A', text: 'Multi-factor authentication (MFA).' },
      { id: 'B', text: 'Role-based access control (RBAC).' },
      { id: 'C', text: 'Azure Policy.' },
      { id: 'D', text: 'Resource locks.' }
    ],
    correctId: 'A',
    explanation: 'MFA requires one or more additional verification methods beyond a password (something you have, something you are). RBAC controls what an authenticated user can do, not how they authenticate. Azure Policy enforces resource-level rules. Resource locks prevent deletion or modification.',
    ref: REFS.entra
  },
  {
    domain: 'Azure architecture and services',
    stem: 'Two Azure virtual networks in the same region need to communicate using private IP addresses with low latency. Which feature enables this most simply?',
    options: [
      { id: 'A', text: 'Virtual network peering.' },
      { id: 'B', text: 'A public Internet route.' },
      { id: 'C', text: 'A site-to-site VPN gateway.' },
      { id: 'D', text: 'Azure ExpressRoute.' }
    ],
    correctId: 'A',
    explanation: 'VNet peering connects two virtual networks over the Microsoft backbone using private IPs with low latency — the simplest fit. Public Internet exposes traffic and adds latency/cost. VPN gateway is for cross-premises encrypted tunnels. ExpressRoute is a private Microsoft-partner connection from on-premises to Azure, not VNet-to-VNet.',
    ref: REFS.network
  },
  {
    domain: 'Azure architecture and services',
    stem: 'A company needs a private, high-bandwidth, low-latency connection between its on-premises datacenter and Azure that does NOT traverse the public Internet. Which service meets this need?',
    options: [
      { id: 'A', text: 'Site-to-site VPN.' },
      { id: 'B', text: 'Azure ExpressRoute.' },
      { id: 'C', text: 'VNet peering.' },
      { id: 'D', text: 'Azure DNS.' }
    ],
    correctId: 'B',
    explanation: 'ExpressRoute provides a private connection between on-premises and Azure via a connectivity provider, bypassing the public Internet — designed for high bandwidth and predictable latency. Site-to-site VPN traverses the Internet. VNet peering is intra-Azure. DNS resolves names; it doesn\'t carry data.',
    ref: REFS.network
  },
  {
    domain: 'Azure architecture and services',
    stem: 'Which Azure service helps you continuously assess your security posture, provides recommendations, and protects workloads against threats across Azure and hybrid environments?',
    options: [
      { id: 'A', text: 'Azure Monitor.' },
      { id: 'B', text: 'Microsoft Defender for Cloud.' },
      { id: 'C', text: 'Azure Advisor.' },
      { id: 'D', text: 'Azure Service Health.' }
    ],
    correctId: 'B',
    explanation: 'Defender for Cloud is the security posture management and threat protection product — assessments, recommendations, threat detection. Monitor handles operational telemetry. Advisor gives best-practice recommendations across cost/security/reliability/performance/operations. Service Health reports Azure service status incidents.',
    ref: REFS.defender
  },
  {
    domain: 'Azure architecture and services',
    stem: 'Which Azure storage service is designed to hold structured NoSQL key-value data accessible via a simple table-like API?',
    options: [
      { id: 'A', text: 'Azure Blob Storage.' },
      { id: 'B', text: 'Azure Table Storage.' },
      { id: 'C', text: 'Azure Disk Storage.' },
      { id: 'D', text: 'Azure Files.' }
    ],
    correctId: 'B',
    explanation: 'Azure Table Storage is a NoSQL key-value store with a simple table API — fits structured non-relational data. Blob is for unstructured object data. Disk is block storage for VM disks. Azure Files exposes SMB/NFS file shares.',
    ref: REFS.storage
  },

  // ═════════════════════════════════════════════════════════════════
  // Azure management and governance (+11)
  // ═════════════════════════════════════════════════════════════════
  {
    domain: 'Azure management and governance',
    stem: 'A company evaluating Azure wants to compare its current 5-year on-premises costs (hardware refreshes, power, real estate, staff) with an equivalent Azure deployment. Which Azure tool provides this comparison?',
    options: [
      { id: 'A', text: 'Azure Pricing Calculator.' },
      { id: 'B', text: 'Total Cost of Ownership (TCO) Calculator.' },
      { id: 'C', text: 'Azure Cost Management.' },
      { id: 'D', text: 'Azure Advisor.' }
    ],
    correctId: 'B',
    explanation: 'TCO Calculator compares projected Azure costs against current on-premises total cost of ownership (hardware, power, networking, staffing). Pricing Calculator estimates Azure costs in isolation. Cost Management analyzes existing Azure spend. Advisor gives best-practice recommendations.',
    ref: REFS.pricing
  },
  {
    domain: 'Azure management and governance',
    stem: 'Which Azure governance construct sits ABOVE subscriptions and is used to apply policies and access controls across many subscriptions at once?',
    options: [
      { id: 'A', text: 'Resource group.' },
      { id: 'B', text: 'Management group.' },
      { id: 'C', text: 'Tenant root.' },
      { id: 'D', text: 'Azure Region.' }
    ],
    correctId: 'B',
    explanation: 'Management groups sit above subscriptions in the Azure hierarchy and let you apply governance (policy, RBAC) across many subscriptions at once. Resource groups sit below subscriptions. Tenant root is a special top-level container, not a typical organizational unit. Regions are physical locations, not governance scopes.',
    ref: REFS.governance
  },
  {
    domain: 'Azure management and governance',
    stem: 'Which Azure feature prevents a critical resource from being accidentally deleted or modified, even by users with full RBAC permissions?',
    options: [
      { id: 'A', text: 'Tags.' },
      { id: 'B', text: 'Resource locks (CanNotDelete or ReadOnly).' },
      { id: 'C', text: 'Azure Advisor recommendations.' },
      { id: 'D', text: 'Azure Monitor alerts.' }
    ],
    correctId: 'B',
    explanation: 'Resource locks (CanNotDelete and ReadOnly) prevent deletion or modification of a resource regardless of RBAC role — they apply globally on top of permissions. Tags label resources for organization/billing but don\'t protect them. Advisor and Monitor surface information; they don\'t enforce protection.',
    ref: REFS.governance
  },
  {
    domain: 'Azure management and governance',
    stem: 'You need to label every resource with a `costCenter` and `environment` value so cost reports can be grouped by team. Which feature is appropriate?',
    options: [
      { id: 'A', text: 'Tags.' },
      { id: 'B', text: 'Resource locks.' },
      { id: 'C', text: 'Azure Blueprints.' },
      { id: 'D', text: 'Microsoft Entra groups.' }
    ],
    correctId: 'A',
    explanation: 'Tags are name/value labels attached to resources, used for grouping in cost reports and search. Resource locks protect against deletion; Blueprints package related artifacts (templates, policies, role assignments) for repeatable environments; Entra groups manage user identity, not resource metadata.',
    ref: REFS.governance
  },
  {
    domain: 'Azure management and governance',
    stem: 'A platform team wants to deploy a consistent set of artifacts (ARM templates, policies, role assignments) to multiple subscriptions to onboard new business units. Which Azure service is designed for this?',
    options: [
      { id: 'A', text: 'Azure Resource Manager templates alone.' },
      { id: 'B', text: 'Azure Blueprints.' },
      { id: 'C', text: 'Azure Monitor.' },
      { id: 'D', text: 'Azure Cost Management.' }
    ],
    correctId: 'B',
    explanation: 'Azure Blueprints packages templates, policies, and role assignments into a repeatable artifact for environment provisioning across subscriptions. ARM templates alone don\'t bundle policies and role assignments at the same level. Monitor and Cost Management address operations and billing, not provisioning.',
    ref: REFS.governance
  },
  {
    domain: 'Azure management and governance',
    stem: 'You want to write infrastructure-as-code in a concise, declarative DSL designed specifically for Azure (more readable than raw ARM JSON). Which option fits?',
    options: [
      { id: 'A', text: 'Bicep.' },
      { id: 'B', text: 'PowerShell DSC.' },
      { id: 'C', text: 'Azure CLI scripts.' },
      { id: 'D', text: 'JSON Schema.' }
    ],
    correctId: 'A',
    explanation: 'Bicep is Microsoft\'s declarative DSL that compiles to ARM templates, designed to be more concise and readable than raw ARM JSON. PowerShell DSC and CLI scripts are imperative. JSON Schema is a validation language, not an IaC language.',
    ref: REFS.iac
  },
  {
    domain: 'Azure management and governance',
    stem: 'A developer wants to run Azure CLI commands from any browser without installing anything locally. Which option is correct?',
    options: [
      { id: 'A', text: 'Azure Cloud Shell, available from the portal.' },
      { id: 'B', text: 'Azure PowerShell installed on a local Windows machine.' },
      { id: 'C', text: 'Azure CLI installed locally via Homebrew.' },
      { id: 'D', text: 'Azure Bash, a Microsoft-licensed terminal emulator.' }
    ],
    correctId: 'A',
    explanation: 'Cloud Shell is a browser-based shell (Bash or PowerShell) that runs in the portal — no local install needed. Options B and C require local installs. Option D is a fictional product.',
    ref: REFS.management
  },
  {
    domain: 'Azure management and governance',
    stem: 'Which Azure service provides best-practice recommendations across cost, security, reliability, operational excellence, and performance for the resources you already run?',
    options: [
      { id: 'A', text: 'Azure Advisor.' },
      { id: 'B', text: 'Azure Monitor.' },
      { id: 'C', text: 'Microsoft Defender for Cloud.' },
      { id: 'D', text: 'Azure Service Health.' }
    ],
    correctId: 'A',
    explanation: 'Azure Advisor analyzes your deployed resources and returns recommendations across the five pillars (cost, security, reliability, operational excellence, performance). Monitor collects telemetry; Defender for Cloud focuses on security posture and threats; Service Health reports Azure-side outages.',
    ref: REFS.advisor
  },
  {
    domain: 'Azure management and governance',
    stem: 'Which Azure service notifies you about Azure-side service incidents, planned maintenance, and health advisories that affect your specific resources?',
    options: [
      { id: 'A', text: 'Azure Monitor.' },
      { id: 'B', text: 'Azure Service Health.' },
      { id: 'C', text: 'Azure Advisor.' },
      { id: 'D', text: 'Microsoft Defender for Cloud.' }
    ],
    correctId: 'B',
    explanation: 'Azure Service Health gives a personalized view of Azure incidents, planned maintenance, and health advisories scoped to your subscriptions. Monitor handles your own telemetry. Advisor gives best-practice recommendations. Defender for Cloud focuses on security.',
    ref: REFS.management
  },
  {
    domain: 'Azure management and governance',
    stem: 'A workload uses two Azure services: Service A with a 99.95% SLA and Service B with a 99.9% SLA, both required for the workload to function. What is the composite SLA?',
    options: [
      { id: 'A', text: 'The lower of the two — 99.9%.' },
      { id: 'B', text: 'The higher of the two — 99.95%.' },
      { id: 'C', text: 'The product of the two — approximately 99.85%.' },
      { id: 'D', text: 'The average — 99.925%.' }
    ],
    correctId: 'C',
    explanation: 'When dependencies must all be available, the composite SLA is the product of the individual SLAs (0.9995 × 0.999 ≈ 0.9985, or about 99.85%). The composite is always lower than either individual SLA. Options A, B, and D use intuitive but incorrect arithmetic.',
    ref: REFS.sla
  },
  {
    domain: 'Azure management and governance',
    stem: 'Which Azure stage indicates a service feature is available for production use with a documented SLA?',
    options: [
      { id: 'A', text: 'Private preview.' },
      { id: 'B', text: 'Public preview.' },
      { id: 'C', text: 'General availability (GA).' },
      { id: 'D', text: 'Deprecated.' }
    ],
    correctId: 'C',
    explanation: 'General Availability (GA) means the feature is production-ready with a published SLA. Private and public previews are pre-GA — features may change and typically don\'t carry an SLA. Deprecated is end-of-life.',
    ref: REFS.management
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
    console.log(`To re-seed: DELETE FROM "Question" WHERE "examId" = '${exam.id}' AND "generatedBy" = '${TAG}';`);
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
