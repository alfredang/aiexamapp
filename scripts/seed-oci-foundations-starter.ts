/**
 * Seed: 6 starter questions for Oracle Cloud Infrastructure Foundations
 * Associate (1Z0-1085-25) — one per domain so the exam appears in the
 * public catalog (which hides 0-question exams) and is browseable end
 * to end. Not a complete fill (target is 40 questions); a follow-up
 * batch can take it the rest of the way.
 *
 *   npx tsx scripts/seed-oci-foundations-starter.ts
 *
 * Idempotent via generatedBy='manual:oci-foundations-starter'.
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

const db = new PrismaClient();
const EXAM_SLUG = 'oracle-oci-foundations-1z0-1085';
const TAG = 'manual:oci-foundations-starter';

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
  guide:    { label: 'Oracle Cloud Infrastructure Foundations Associate', url: 'https://education.oracle.com/oracle-cloud-infrastructure-foundations-associate/pexam_1Z0-1085-25' },
  iam:      { label: 'OCI Identity and Access Management — compartments', url: 'https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/overview.htm' },
  vcn:      { label: 'OCI Virtual Cloud Networks (VCN)', url: 'https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/overview.htm' },
  compute:  { label: 'OCI Compute service overview', url: 'https://docs.oracle.com/en-us/iaas/Content/Compute/Concepts/computeoverview.htm' },
  storage:  { label: 'OCI Object Storage tiers', url: 'https://docs.oracle.com/en-us/iaas/Content/Object/Concepts/objectstorageoverview.htm' },
  vault:    { label: 'OCI Vault key management', url: 'https://docs.oracle.com/en-us/iaas/Content/KeyManagement/Concepts/keyoverview.htm' }
};

const QUESTIONS: Q[] = [
  {
    domain: 'OCI Introduction',
    type: QType.SINGLE,
    stem: 'A company is evaluating Oracle Cloud Infrastructure (OCI) and wants to understand its high-level architecture. Which of the following BEST describes how OCI organizes physical infrastructure for high availability within a region?',
    options: [
      { id: 'A', text: 'Each OCI region contains exactly one data center; high availability comes only from cross-region replication.' },
      { id: 'B', text: 'An OCI region contains one or more Availability Domains (ADs), and most regions also have multiple Fault Domains within each AD for further isolation against hardware failure.' },
      { id: 'C', text: 'OCI uses a single global pool of compute with no regional isolation.' },
      { id: 'D', text: 'OCI does not offer high availability — customers must implement it entirely in their own data centers.' }
    ],
    correct: ['B'],
    explanation: 'OCI structures infrastructure into Regions → Availability Domains (ADs) → Fault Domains (FDs). ADs are physically separate data centers within a region; FDs are logical groupings within an AD that share no single point of hardware failure. This three-tier model is the foundation of OCI HA design.',
    ref: REFS.guide
  },
  {
    domain: 'OCI Identity and Access Management',
    type: QType.SINGLE,
    stem: 'In OCI, which construct is the PRIMARY mechanism for organizing and isolating cloud resources for different teams, projects, or environments — and on which IAM policies are scoped?',
    options: [
      { id: 'A', text: 'Compartments — a hierarchical container that holds resources and is the scope for IAM policies.' },
      { id: 'B', text: 'Tenancies — there is one tenancy per resource.' },
      { id: 'C', text: 'Subnets — IAM policies are attached to subnets.' },
      { id: 'D', text: 'Tags only — OCI uses tags instead of compartments.' }
    ],
    correct: ['A'],
    explanation: 'Compartments are OCI\'s distinctive resource-organization construct: hierarchical, nestable up to 6 levels, and the scope on which IAM policies are written ("ALLOW group X to manage instances in compartment Y"). Tenancies are top-level (one per OCI subscription). Subnets are networking constructs. Tags add metadata but don\'t replace compartments.',
    ref: REFS.iam
  },
  {
    domain: 'Networking',
    type: QType.SINGLE,
    stem: 'You need to launch a VM-based web application in OCI. The application must be reachable from the internet on port 443 with a public IP. Which network construct combination is the MINIMUM required setup in OCI?',
    options: [
      { id: 'A', text: 'A Virtual Cloud Network (VCN) with a public subnet, an Internet Gateway attached to the VCN, a route rule sending 0.0.0.0/0 to the IG, and a Security List or Network Security Group allowing TCP 443 ingress.' },
      { id: 'B', text: 'Just a tenancy — VMs get internet by default.' },
      { id: 'C', text: 'A Service Gateway (used to reach Oracle services privately) is sufficient.' },
      { id: 'D', text: 'A NAT Gateway in a private subnet is the only option for public web traffic.' }
    ],
    correct: ['A'],
    explanation: 'The standard OCI public-facing pattern requires a VCN, public subnet, Internet Gateway (IG), a 0.0.0.0/0 → IG route rule, and security list / NSG rules permitting the desired ports. Service Gateway is for private connectivity to Oracle services (Object Storage, etc.). NAT Gateway gives outbound-only internet for private subnets — not for inbound public traffic.',
    ref: REFS.vcn
  },
  {
    domain: 'Compute',
    type: QType.SINGLE,
    stem: 'A team needs to launch a Linux VM with consistent CPU performance and predictable cost, using AMD-based x86 hardware. Which OCI Compute shape family fits BEST?',
    options: [
      { id: 'A', text: 'Standard E-series shapes (e.g. VM.Standard.E4.Flex / E5.Flex) — AMD EPYC, flexible OCPU and memory, predictable pricing.' },
      { id: 'B', text: 'Ampere A1 shapes — those are Arm-based, not AMD x86.' },
      { id: 'C', text: 'Bare Metal HPC shapes — those are specialized HPC, not general compute.' },
      { id: 'D', text: 'GPU shapes — only useful if the workload uses NVIDIA GPUs.' }
    ],
    correct: ['A'],
    explanation: 'OCI Standard E-series shapes (E4.Flex, E5.Flex) run on AMD EPYC processors and offer flexible OCPU + memory configuration with predictable pricing — the documented fit for general AMD x86 workloads. Ampere A1 shapes are Arm-based. HPC and GPU shapes target specialized workloads.',
    ref: REFS.compute
  },
  {
    domain: 'Storage',
    type: QType.SINGLE,
    stem: 'A company stores 200 TB of compliance archives in OCI Object Storage. The data is accessed less than once a year, and retrieval can take up to 1 hour. Which Object Storage tier provides the LOWEST cost?',
    options: [
      { id: 'A', text: 'Archive Storage tier.' },
      { id: 'B', text: 'Standard tier.' },
      { id: 'C', text: 'Infrequent Access tier (the alias for Standard since OCI consolidated tiers).' },
      { id: 'D', text: 'Block Volume — used as cold archival.' }
    ],
    correct: ['A'],
    explanation: 'OCI Archive Storage is the lowest-cost Object Storage tier, designed for data accessed less than once a year with retrieval latency of about an hour. Standard is for frequently accessed data. Block Volume is for VM disks, not archival object data.',
    ref: REFS.storage
  },
  {
    domain: 'Security and Observability',
    type: QType.SINGLE,
    stem: 'Which OCI service is responsible for centrally managing customer-controlled encryption keys (including HSM-backed keys) and is integrated with Object Storage, Block Volume, and other OCI services for encryption at rest?',
    options: [
      { id: 'A', text: 'OCI Vault.' },
      { id: 'B', text: 'OCI Cloud Guard.' },
      { id: 'C', text: 'OCI Logging.' },
      { id: 'D', text: 'OCI Bastion.' }
    ],
    correct: ['A'],
    explanation: 'OCI Vault (Key Management) stores and manages encryption keys (including FIPS 140-2 Level 3 HSM-backed keys) and integrates with Object Storage, Block Volume, Database, and other services for envelope encryption. Cloud Guard is a security-posture / threat-detection service. Logging is for log aggregation. Bastion provides ephemeral SSH access into private subnets.',
    ref: REFS.vault
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
        difficulty: 2,
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
