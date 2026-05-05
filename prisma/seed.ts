import { PrismaClient, QStatus, QType, Role, Tier } from '@prisma/client';
import argon2 from 'argon2';

const db = new PrismaClient();

type Level = 'Foundational' | 'Associate' | 'Professional' | 'Expert' | 'Specialty';

const PRICING: Record<Level, { practice: number; bundle: number; voucher: number }> = {
  Foundational: { practice: 1900, bundle: 11900, voucher: 9900 },
  Associate: { practice: 2900, bundle: 17900, voucher: 14900 },
  Professional: { practice: 3900, bundle: 24900, voucher: 19900 },
  Expert: { practice: 4900, bundle: 34900, voucher: 27900 },
  Specialty: { practice: 3400, bundle: 19900, voucher: 16900 }
};

type ExamSeed = {
  vendorSlug: string;
  slug: string;
  code: string;
  title: string;
  description: string;
  level: Level;
  durationMinutes: number;
  passingScore: number;
  questionCount: number;
  domains: { name: string; weight: number }[];
  // Optional per-exam pricing overrides (cents). When omitted, the loop
  // falls back to PRICING[level] defaults. Use these when an exam's real
  // vendor fee diverges from the level default — e.g. AWS CLF-C02's
  // $100 voucher vs the Foundational tier default.
  pricePractice?: number;
  priceBundle?: number;
  priceVoucher?: number;
};

const VENDORS = [
  { slug: 'aws', name: 'Amazon Web Services', description: 'Cloud certifications from AWS.' },
  { slug: 'microsoft', name: 'Microsoft', description: 'Azure, Microsoft 365, and AI certifications.' },
  { slug: 'comptia', name: 'CompTIA', description: 'Vendor-neutral IT industry certifications.' },
  { slug: 'cisco', name: 'Cisco', description: 'Networking, security, and DevNet certifications.' },
  { slug: 'oracle', name: 'Oracle', description: 'Oracle Cloud Infrastructure, database, and AI certifications.' },
  { slug: 'google', name: 'Google Cloud', description: 'Google Cloud Platform certifications across cloud, data, and ML.' },
  { slug: 'anthropic', name: 'Anthropic', description: 'Anthropic Claude — agent SDK, Claude Code, MCP, and applied AI architecture.' }
];

const CLAUDE_ARCHITECT_DOMAINS = [
  { name: 'Agentic Architecture & Orchestration', weight: 27 },
  { name: 'Tool Design & MCP Integration', weight: 18 },
  { name: 'Claude Code Configuration & Workflows', weight: 20 },
  { name: 'Prompt Engineering & Structured Output', weight: 20 },
  { name: 'Context Management & Reliability', weight: 15 }
];

const CLAUDE_ARCHITECT_DESCRIPTION =
  'Foundational certification covering Claude Code, the Claude Agent SDK, the Claude API, and the Model Context Protocol (MCP). Scenario-based questions test architectural judgment for production deployments — agentic loops, tool design, prompt engineering, structured output, and context management.';

// Slugs that previously existed but have been removed from the catalog.
// Cleanup in main() deletes any DB rows still pointing at these (exam,
// questions, entitlements, attempts, orders).
//   - The 3 CCA-F shells were consolidated to a single `anthropic-cca-foundations` slug
//   - aws-soa-c02 retired/renamed to CloudOps Engineer (now aws-soa-c03)
//   - aws-scs-c02 superseded by SCS-C03 (now aws-scs-c03)
// Note: aws-saa-c03 was previously deleted as a placeholder shell but is
// re-added below now that the official AWS catalogue still offers it.
const OBSOLETE_EXAM_SLUGS = [
  'anthropic-claude-architect-foundations-1',
  'anthropic-claude-architect-foundations-2',
  'anthropic-claude-architect-foundations-3',
  'aws-soa-c02',
  'aws-scs-c02'
];

// Curated bundles — multi-exam products defined declaratively here.
// Each item references an exam by slug + the tier the buyer receives.
type BundleSeed = {
  slug: string;
  title: string;
  description: string;
  price: number; // cents
  items: { examSlug: string; tier: 'PRACTICE' | 'VOUCHER'; position?: number }[];
};

// Bundles are no longer offered. Per the simplified product model the
// public catalogue now sells only per-exam PRACTICE and VOUCHER tiers
// (where VOUCHER includes practice access). Existing Bundle rows in the
// DB are unpublished by main() so they disappear from the UI without
// breaking referential integrity on historical Order rows that point
// at them via bundleId.
const BUNDLES: BundleSeed[] = [];

const EXAMS: ExamSeed[] = [
  // ───── AWS ─────
  {
    vendorSlug: 'aws', slug: 'aws-clf-c02', code: 'CLF-C02',
    title: 'AWS Certified Cloud Practitioner',
    description: 'Foundational AWS certification covering the value of the AWS Cloud, the shared responsibility model, the Well-Architected Framework, security best practices, AWS pricing and billing economics, and core services across compute, networking, database, and storage. Available in-person at AWS-authorized testing centers or online via remote proctoring. Real exam fee is USD 100 (voucher).',
    level: 'Foundational', durationMinutes: 90, passingScore: 70, questionCount: 65,
    pricePractice: 2000, priceBundle: 10000, priceVoucher: 10000,
    domains: [
      { name: 'Cloud Concepts', weight: 24 },
      { name: 'Security and Compliance', weight: 30 },
      { name: 'Cloud Technology and Services', weight: 34 },
      { name: 'Billing, Pricing, and Support', weight: 12 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-dva-c02', code: 'DVA-C02',
    title: 'AWS Certified Developer — Associate',
    description: 'Develop, deploy, and debug cloud-based applications using AWS services. Real exam fee is USD 150 (voucher).',
    level: 'Associate', durationMinutes: 130, passingScore: 72, questionCount: 65,
    priceVoucher: 15000,
    domains: [
      { name: 'Development with AWS Services', weight: 32 },
      { name: 'Security', weight: 26 },
      { name: 'Deployment', weight: 24 },
      { name: 'Troubleshooting and Optimization', weight: 18 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-soa-c03', code: 'SOA-C03',
    title: 'AWS Certified CloudOps Engineer — Associate',
    description: 'Deploy, manage, and operate workloads on AWS following the Well-Architected Framework. Covers monitoring, logging, remediation, performance optimisation, reliability and business continuity, deployment provisioning and automation, security and compliance, and networking. Replaces the SysOps Administrator (SOA-C02) exam. Real exam fee is USD 150 (voucher).',
    level: 'Associate', durationMinutes: 180, passingScore: 72, questionCount: 65,
    priceVoucher: 15000,
    domains: [
      { name: 'Monitoring, Logging, Analysis, Remediation, and Performance Optimization', weight: 22 },
      { name: 'Reliability and Business Continuity', weight: 22 },
      { name: 'Deployment, Provisioning, and Automation', weight: 22 },
      { name: 'Security and Compliance', weight: 16 },
      { name: 'Networking and Content Delivery', weight: 18 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-dea-c01', code: 'DEA-C01',
    title: 'AWS Certified Data Engineer — Associate',
    description: 'Build and maintain data pipelines, manage data stores, and operate, monitor, and secure data workloads on AWS. Covers Kinesis, Glue, EMR, Redshift, DynamoDB, Lake Formation, and the broader analytics stack. Real exam fee is USD 150 (voucher).',
    level: 'Associate', durationMinutes: 130, passingScore: 72, questionCount: 65,
    priceVoucher: 15000,
    domains: [
      { name: 'Data Ingestion and Transformation', weight: 34 },
      { name: 'Data Store Management', weight: 26 },
      { name: 'Data Operations and Support', weight: 22 },
      { name: 'Data Security and Governance', weight: 18 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-sap-c02', code: 'SAP-C02',
    title: 'AWS Certified Solutions Architect — Professional',
    description: 'Advanced architectural design across complex AWS environments.',
    level: 'Professional', durationMinutes: 180, passingScore: 75, questionCount: 75,
    domains: [
      { name: 'Design Solutions for Organizational Complexity', weight: 26 },
      { name: 'Design for New Solutions', weight: 29 },
      { name: 'Continuous Improvement for Existing Solutions', weight: 25 },
      { name: 'Accelerate Workload Migration and Modernization', weight: 20 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-dop-c02', code: 'DOP-C02',
    title: 'AWS Certified DevOps Engineer — Professional',
    description: 'Implement and manage continuous delivery systems and methodologies on AWS — CI/CD pipelines, infrastructure as code, monitoring, incident response, and security automation. Real exam fee is USD 300 (voucher).',
    level: 'Professional', durationMinutes: 180, passingScore: 75, questionCount: 75,
    priceVoucher: 30000,
    domains: [
      { name: 'SDLC Automation', weight: 22 },
      { name: 'Configuration Management and IaC', weight: 17 },
      { name: 'Resilient Cloud Solutions', weight: 15 },
      { name: 'Monitoring and Logging', weight: 15 },
      { name: 'Incident and Event Response', weight: 14 },
      { name: 'Security and Compliance', weight: 17 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-scs-c03', code: 'SCS-C03',
    title: 'AWS Certified Security — Specialty',
    description: 'Validate expertise in securing AWS workloads — detection, incident response, infrastructure security, identity and access management, data protection, and security governance. Targets candidates with 3–5 years of cloud security experience. Real exam fee is USD 300 (voucher).',
    level: 'Specialty', durationMinutes: 170, passingScore: 75, questionCount: 65,
    priceVoucher: 30000,
    domains: [
      { name: 'Detection', weight: 16 },
      { name: 'Incident Response', weight: 14 },
      { name: 'Infrastructure Security', weight: 18 },
      { name: 'Identity and Access Management', weight: 20 },
      { name: 'Data Protection', weight: 18 },
      { name: 'Security Foundations and Governance', weight: 14 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-aif-c01', code: 'AIF-C01',
    title: 'AWS Certified AI Practitioner',
    description: 'Foundational understanding of AI, ML, and generative AI concepts on AWS.',
    level: 'Foundational', durationMinutes: 90, passingScore: 70, questionCount: 65,
    domains: [
      { name: 'Fundamentals of AI and ML', weight: 20 },
      { name: 'Fundamentals of Generative AI', weight: 24 },
      { name: 'Applications of Foundation Models', weight: 28 },
      { name: 'Guidelines for Responsible AI', weight: 14 },
      { name: 'Security, Compliance, and Governance for AI Solutions', weight: 14 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-saa-c03', code: 'SAA-C03',
    title: 'AWS Certified Solutions Architect — Associate',
    description: 'Design solutions on AWS based on the Well-Architected Framework — secure, resilient, high-performing, and cost-optimised architectures. Targets candidates with at least 1 year of hands-on AWS design experience. Real exam fee is USD 150 (voucher).',
    level: 'Associate', durationMinutes: 130, passingScore: 72, questionCount: 65,
    priceVoucher: 15000,
    domains: [
      { name: 'Design Secure Architectures', weight: 30 },
      { name: 'Design Resilient Architectures', weight: 26 },
      { name: 'Design High-Performing Architectures', weight: 24 },
      { name: 'Design Cost-Optimized Architectures', weight: 20 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-mla-c01', code: 'MLA-C01',
    title: 'AWS Certified Machine Learning Engineer — Associate',
    description: 'Build, operationalise, deploy, and maintain ML solutions and pipelines on AWS — data preparation, model development, deployment and orchestration, monitoring, maintenance, and security. Targets ML engineers with at least 1 year of hands-on SageMaker experience. Real exam fee is USD 150 (voucher).',
    level: 'Associate', durationMinutes: 130, passingScore: 72, questionCount: 65,
    priceVoucher: 15000,
    domains: [
      { name: 'Data Preparation for Machine Learning (ML)', weight: 28 },
      { name: 'ML Model Development', weight: 26 },
      { name: 'Deployment and Orchestration of ML Workflows', weight: 22 },
      { name: 'ML Solution Monitoring, Maintenance, and Security', weight: 24 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-aip-c01', code: 'AIP-C01',
    title: 'AWS Certified Generative AI Developer — Professional',
    description: 'Integrate foundation models into applications and business workflows on AWS — vector stores, RAG, agentic AI, prompt engineering, AI safety and governance, performance and cost optimisation. Targets GenAI developers with 1+ year hands-on GenAI experience. Real exam fee is USD 300 (voucher).',
    level: 'Professional', durationMinutes: 180, passingScore: 75, questionCount: 75,
    priceVoucher: 30000,
    domains: [
      { name: 'Foundation Model Integration, Data Management, and Compliance', weight: 31 },
      { name: 'Implementation and Integration', weight: 26 },
      { name: 'AI Safety, Security, and Governance', weight: 20 },
      { name: 'Operational Efficiency and Optimization for GenAI Applications', weight: 12 },
      { name: 'Testing, Validation, and Troubleshooting', weight: 11 }
    ]
  },
  {
    vendorSlug: 'aws', slug: 'aws-ans-c01', code: 'ANS-C01',
    title: 'AWS Certified Advanced Networking — Specialty',
    description: 'Design, implement, manage, and secure AWS and hybrid network architectures at scale. Targets candidates with 5+ years of networking experience and 2+ years cloud/hybrid networking. Real exam fee is USD 300 (voucher).',
    level: 'Specialty', durationMinutes: 170, passingScore: 70, questionCount: 65,
    priceVoucher: 30000,
    domains: [
      { name: 'Network Design', weight: 30 },
      { name: 'Network Implementation', weight: 26 },
      { name: 'Network Management and Operation', weight: 20 },
      { name: 'Network Security, Compliance, and Governance', weight: 24 }
    ]
  },

  // ───── Microsoft ─────
  {
    vendorSlug: 'microsoft', slug: 'microsoft-az-900', code: 'AZ-900',
    title: 'Microsoft Azure Fundamentals',
    description: 'Practice questions covering core Azure concepts, services, governance, and pricing.',
    level: 'Foundational', durationMinutes: 60, passingScore: 70, questionCount: 40,
    domains: [
      { name: 'Cloud concepts', weight: 25 },
      { name: 'Azure architecture and services', weight: 35 },
      { name: 'Azure management and governance', weight: 40 }
    ]
  },
  {
    vendorSlug: 'microsoft', slug: 'microsoft-az-104', code: 'AZ-104',
    title: 'Microsoft Azure Administrator',
    description: 'Implement, manage, and monitor identity, governance, storage, compute, and virtual networks.',
    level: 'Associate', durationMinutes: 100, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Manage Azure identities and governance', weight: 22 },
      { name: 'Implement and manage storage', weight: 17 },
      { name: 'Deploy and manage Azure compute resources', weight: 22 },
      { name: 'Implement and manage virtual networking', weight: 17 },
      { name: 'Monitor and maintain Azure resources', weight: 22 }
    ]
  },
  {
    vendorSlug: 'microsoft', slug: 'microsoft-az-204', code: 'AZ-204',
    title: 'Developing Solutions for Microsoft Azure',
    description: 'Design, build, test, and maintain cloud applications and services on Azure.',
    level: 'Associate', durationMinutes: 100, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Develop Azure compute solutions', weight: 27 },
      { name: 'Develop for Azure storage', weight: 17 },
      { name: 'Implement Azure security', weight: 22 },
      { name: 'Monitor, troubleshoot, and optimize solutions', weight: 17 },
      { name: 'Connect to and consume Azure services', weight: 17 }
    ]
  },
  {
    vendorSlug: 'microsoft', slug: 'microsoft-az-305', code: 'AZ-305',
    title: 'Designing Microsoft Azure Infrastructure Solutions',
    description: 'Design identity, governance, monitoring, data, business continuity, and infrastructure solutions.',
    level: 'Expert', durationMinutes: 100, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Design identity, governance, and monitoring solutions', weight: 27 },
      { name: 'Design data storage solutions', weight: 27 },
      { name: 'Design business continuity solutions', weight: 13 },
      { name: 'Design infrastructure solutions', weight: 33 }
    ]
  },
  {
    vendorSlug: 'microsoft', slug: 'microsoft-az-400', code: 'AZ-400',
    title: 'Designing and Implementing Microsoft DevOps Solutions',
    description: 'Combine people, processes, and technologies to continuously deliver products and services.',
    level: 'Expert', durationMinutes: 100, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Configure processes and communications', weight: 12 },
      { name: 'Design and implement source control', weight: 17 },
      { name: 'Design and implement build and release pipelines', weight: 42 },
      { name: 'Develop a security and compliance plan', weight: 14 },
      { name: 'Implement an instrumentation strategy', weight: 15 }
    ]
  },
  {
    vendorSlug: 'microsoft', slug: 'microsoft-az-500', code: 'AZ-500',
    title: 'Microsoft Azure Security Technologies',
    description: 'Implement security controls, identity and access, platform protection, and security operations.',
    level: 'Associate', durationMinutes: 100, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Manage identity and access', weight: 27 },
      { name: 'Secure networking', weight: 22 },
      { name: 'Secure compute, storage, and databases', weight: 22 },
      { name: 'Manage security operations', weight: 29 }
    ]
  },
  {
    vendorSlug: 'microsoft', slug: 'microsoft-ai-900', code: 'AI-900',
    title: 'Microsoft Azure AI Fundamentals',
    description: 'Introduction to AI concepts and Azure services for ML, computer vision, NLP, and generative AI.',
    level: 'Foundational', durationMinutes: 60, passingScore: 70, questionCount: 40,
    domains: [
      { name: 'AI workloads and considerations', weight: 17 },
      { name: 'Fundamentals of machine learning on Azure', weight: 32 },
      { name: 'Computer vision on Azure', weight: 17 },
      { name: 'Natural language processing on Azure', weight: 17 },
      { name: 'Generative AI on Azure', weight: 17 }
    ]
  },
  {
    vendorSlug: 'microsoft', slug: 'microsoft-dp-900', code: 'DP-900',
    title: 'Microsoft Azure Data Fundamentals',
    description: 'Core data concepts and how they are implemented using Azure data services.',
    level: 'Foundational', durationMinutes: 60, passingScore: 70, questionCount: 40,
    domains: [
      { name: 'Core data concepts', weight: 27 },
      { name: 'Considerations for relational data on Azure', weight: 22 },
      { name: 'Considerations for non-relational data on Azure', weight: 17 },
      { name: 'Analytics workloads on Azure', weight: 34 }
    ]
  },
  {
    vendorSlug: 'microsoft', slug: 'microsoft-ms-900', code: 'MS-900',
    title: 'Microsoft 365 Fundamentals',
    description: 'Cloud concepts and Microsoft 365 services, security, compliance, privacy, pricing, and support.',
    level: 'Foundational', durationMinutes: 60, passingScore: 70, questionCount: 40,
    domains: [
      { name: 'Cloud concepts', weight: 12 },
      { name: 'Microsoft 365 apps and services', weight: 32 },
      { name: 'Security, compliance, privacy, and trust in Microsoft 365', weight: 34 },
      { name: 'Microsoft 365 pricing, licensing, and support', weight: 22 }
    ]
  },
  {
    vendorSlug: 'microsoft', slug: 'microsoft-sc-900', code: 'SC-900',
    title: 'Microsoft Security, Compliance, and Identity Fundamentals',
    description: 'Foundational concepts of security, compliance, and identity across Microsoft solutions.',
    level: 'Foundational', durationMinutes: 60, passingScore: 70, questionCount: 40,
    domains: [
      { name: 'Concepts of security, compliance, and identity', weight: 12 },
      { name: 'Capabilities of Microsoft Entra', weight: 27 },
      { name: 'Capabilities of Microsoft security solutions', weight: 38 },
      { name: 'Capabilities of Microsoft compliance solutions', weight: 23 }
    ]
  },

  // ───── CompTIA ─────
  {
    vendorSlug: 'comptia', slug: 'comptia-a-220-1101', code: '220-1101',
    title: 'CompTIA A+ Core 1',
    description: 'Mobile devices, networking technology, hardware, virtualization and cloud, and hardware/network troubleshooting.',
    level: 'Foundational', durationMinutes: 90, passingScore: 75, questionCount: 90,
    domains: [
      { name: 'Mobile Devices', weight: 15 },
      { name: 'Networking', weight: 20 },
      { name: 'Hardware', weight: 25 },
      { name: 'Virtualization and Cloud Computing', weight: 11 },
      { name: 'Hardware and Network Troubleshooting', weight: 29 }
    ]
  },
  {
    vendorSlug: 'comptia', slug: 'comptia-a-220-1102', code: '220-1102',
    title: 'CompTIA A+ Core 2',
    description: 'Operating systems, security, software troubleshooting, and operational procedures.',
    level: 'Foundational', durationMinutes: 90, passingScore: 78, questionCount: 90,
    domains: [
      { name: 'Operating Systems', weight: 31 },
      { name: 'Security', weight: 25 },
      { name: 'Software Troubleshooting', weight: 22 },
      { name: 'Operational Procedures', weight: 22 }
    ]
  },
  {
    vendorSlug: 'comptia', slug: 'comptia-network-n10-009', code: 'N10-009',
    title: 'CompTIA Network+',
    description: 'Networking concepts, implementation, operations, security, and troubleshooting.',
    level: 'Associate', durationMinutes: 90, passingScore: 80, questionCount: 90,
    domains: [
      { name: 'Networking Concepts', weight: 23 },
      { name: 'Network Implementation', weight: 20 },
      { name: 'Network Operations', weight: 19 },
      { name: 'Network Security', weight: 14 },
      { name: 'Network Troubleshooting', weight: 24 }
    ]
  },
  {
    vendorSlug: 'comptia', slug: 'comptia-security-sy0-701', code: 'SY0-701',
    title: 'CompTIA Security+',
    description: 'Foundational cybersecurity skills: threats, architecture, operations, and program management.',
    level: 'Associate', durationMinutes: 90, passingScore: 83, questionCount: 90,
    domains: [
      { name: 'General Security Concepts', weight: 12 },
      { name: 'Threats, Vulnerabilities, and Mitigations', weight: 22 },
      { name: 'Security Architecture', weight: 18 },
      { name: 'Security Operations', weight: 28 },
      { name: 'Security Program Management and Oversight', weight: 20 }
    ]
  },
  {
    vendorSlug: 'comptia', slug: 'comptia-cysa-cs0-003', code: 'CS0-003',
    title: 'CompTIA CySA+',
    description: 'Continuous security monitoring through behavioral analytics, threat hunting, and incident response.',
    level: 'Professional', durationMinutes: 165, passingScore: 83, questionCount: 85,
    domains: [
      { name: 'Security Operations', weight: 33 },
      { name: 'Vulnerability Management', weight: 30 },
      { name: 'Incident Response and Management', weight: 20 },
      { name: 'Reporting and Communication', weight: 17 }
    ]
  },

  // ───── Cisco ─────
  {
    vendorSlug: 'cisco', slug: 'cisco-ccna-200-301', code: '200-301',
    title: 'Cisco Certified Network Associate (CCNA)',
    description: 'Networking fundamentals, IP services, security, automation, and programmability.',
    level: 'Associate', durationMinutes: 120, passingScore: 82, questionCount: 110,
    domains: [
      { name: 'Network Fundamentals', weight: 20 },
      { name: 'Network Access', weight: 20 },
      { name: 'IP Connectivity', weight: 25 },
      { name: 'IP Services', weight: 10 },
      { name: 'Security Fundamentals', weight: 15 },
      { name: 'Automation and Programmability', weight: 10 }
    ]
  },
  {
    vendorSlug: 'cisco', slug: 'cisco-ccnp-encor-350-401', code: '350-401',
    title: 'Implementing Cisco Enterprise Network Core Technologies (ENCOR)',
    description: 'Core enterprise networking: architecture, virtualization, infrastructure, security, and automation.',
    level: 'Professional', durationMinutes: 120, passingScore: 82, questionCount: 100,
    domains: [
      { name: 'Architecture', weight: 15 },
      { name: 'Virtualization', weight: 10 },
      { name: 'Infrastructure', weight: 30 },
      { name: 'Network Assurance', weight: 10 },
      { name: 'Security', weight: 20 },
      { name: 'Automation', weight: 15 }
    ]
  },
  {
    vendorSlug: 'cisco', slug: 'cisco-cyberops-200-201', code: '200-201',
    title: 'Cisco Certified CyberOps Associate (CBROPS)',
    description: 'Security concepts, monitoring, host-based and network analysis, policies and procedures.',
    level: 'Associate', durationMinutes: 120, passingScore: 80, questionCount: 100,
    domains: [
      { name: 'Security Concepts', weight: 20 },
      { name: 'Security Monitoring', weight: 25 },
      { name: 'Host-Based Analysis', weight: 20 },
      { name: 'Network Intrusion Analysis', weight: 20 },
      { name: 'Security Policies and Procedures', weight: 15 }
    ]
  },

  // ───── Oracle ─────
  {
    vendorSlug: 'oracle', slug: 'oracle-oci-foundations-1z0-1085', code: '1Z0-1085-25',
    title: 'Oracle Cloud Infrastructure Foundations Associate',
    description: 'Fundamental concepts of Oracle Cloud Infrastructure: identity, compute, storage, networking, and security.',
    level: 'Foundational', durationMinutes: 60, passingScore: 65, questionCount: 40,
    domains: [
      { name: 'OCI Introduction', weight: 15 },
      { name: 'OCI Identity and Access Management', weight: 20 },
      { name: 'Networking', weight: 20 },
      { name: 'Compute', weight: 15 },
      { name: 'Storage', weight: 15 },
      { name: 'Security and Observability', weight: 15 }
    ]
  },
  {
    vendorSlug: 'oracle', slug: 'oracle-oci-architect-associate-1z0-1072', code: '1Z0-1072-25',
    title: 'Oracle Cloud Infrastructure Architect Associate',
    description: 'Design and implement OCI workloads with networking, compute, storage, identity, security, and HA/DR.',
    level: 'Associate', durationMinutes: 90, passingScore: 65, questionCount: 60,
    domains: [
      { name: 'Identity and Access Management', weight: 15 },
      { name: 'Networking', weight: 25 },
      { name: 'Compute', weight: 15 },
      { name: 'Storage', weight: 15 },
      { name: 'Database', weight: 10 },
      { name: 'Security and Observability', weight: 10 },
      { name: 'High Availability and Disaster Recovery', weight: 10 }
    ]
  },
  {
    vendorSlug: 'oracle', slug: 'oracle-oci-architect-pro-1z0-997', code: '1Z0-997-25',
    title: 'Oracle Cloud Infrastructure Architect Professional',
    description: 'Advanced OCI architecture: complex networks, governance, automation, and hybrid solutions.',
    level: 'Professional', durationMinutes: 90, passingScore: 70, questionCount: 55,
    domains: [
      { name: 'Plan and Design Solutions', weight: 25 },
      { name: 'Implement and Operate Solutions', weight: 30 },
      { name: 'Migration', weight: 15 },
      { name: 'Performance and Cost Optimization', weight: 15 },
      { name: 'Security and Compliance', weight: 15 }
    ]
  },
  {
    vendorSlug: 'oracle', slug: 'oracle-genai-professional-1z0-1127', code: '1Z0-1127-24',
    title: 'Oracle Cloud Infrastructure Generative AI Professional',
    description: 'Generative AI fundamentals, large language models, and OCI Generative AI Service implementation.',
    level: 'Professional', durationMinutes: 90, passingScore: 65, questionCount: 40,
    domains: [
      { name: 'Fundamentals of Large Language Models', weight: 30 },
      { name: 'Using OCI Generative AI Service', weight: 30 },
      { name: 'Building an LLM Application with OCI Generative AI Service', weight: 40 }
    ]
  },
  {
    vendorSlug: 'oracle', slug: 'oracle-db-sql-1z0-071', code: '1Z0-071',
    title: 'Oracle Database SQL Certified Associate',
    description: 'Relational database concepts and SQL skills using Oracle Database.',
    level: 'Associate', durationMinutes: 100, passingScore: 63, questionCount: 78,
    domains: [
      { name: 'Relational Database Concepts', weight: 10 },
      { name: 'Retrieving and Restricting Data', weight: 25 },
      { name: 'Manipulating Data and Tables', weight: 25 },
      { name: 'Using Functions and Group Operations', weight: 20 },
      { name: 'Joins, Subqueries, and Set Operators', weight: 20 }
    ]
  },

  // ───── Google Cloud ─────
  {
    vendorSlug: 'google', slug: 'google-cloud-digital-leader', code: 'CDL',
    title: 'Google Cloud Digital Leader',
    description: 'Foundational understanding of cloud concepts and Google Cloud products and services.',
    level: 'Foundational', durationMinutes: 90, passingScore: 70, questionCount: 60,
    domains: [
      { name: 'Digital Transformation with Google Cloud', weight: 10 },
      { name: 'Exploring Data Transformation with Google Cloud', weight: 30 },
      { name: 'Innovating with Google Cloud Artificial Intelligence', weight: 30 },
      { name: 'Modernizing Infrastructure and Applications with Google Cloud', weight: 30 }
    ]
  },
  {
    vendorSlug: 'google', slug: 'google-associate-cloud-engineer', code: 'ACE',
    title: 'Google Associate Cloud Engineer',
    description: 'Deploy applications, monitor operations, and manage enterprise solutions on Google Cloud.',
    level: 'Associate', durationMinutes: 120, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Setting up a cloud solution environment', weight: 20 },
      { name: 'Planning and configuring a cloud solution', weight: 20 },
      { name: 'Deploying and implementing a cloud solution', weight: 25 },
      { name: 'Ensuring successful operation of a cloud solution', weight: 20 },
      { name: 'Configuring access and security', weight: 15 }
    ]
  },
  {
    vendorSlug: 'google', slug: 'google-professional-cloud-architect', code: 'PCA',
    title: 'Google Professional Cloud Architect',
    description: 'Design, develop, and manage robust, secure, scalable, and dynamic Google Cloud solutions.',
    level: 'Professional', durationMinutes: 120, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Designing and planning a cloud solution architecture', weight: 24 },
      { name: 'Managing and provisioning a solution infrastructure', weight: 15 },
      { name: 'Designing for security and compliance', weight: 18 },
      { name: 'Analyzing and optimizing technical and business processes', weight: 18 },
      { name: 'Managing implementation', weight: 11 },
      { name: 'Ensuring solution and operations reliability', weight: 14 }
    ]
  },
  {
    vendorSlug: 'google', slug: 'google-professional-data-engineer', code: 'PDE',
    title: 'Google Professional Data Engineer',
    description: 'Design data processing systems, build and operationalize ML models, and ensure solution quality.',
    level: 'Professional', durationMinutes: 120, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Designing data processing systems', weight: 22 },
      { name: 'Ingesting and processing the data', weight: 25 },
      { name: 'Storing the data', weight: 20 },
      { name: 'Preparing and using data for analysis', weight: 15 },
      { name: 'Maintaining and automating data workloads', weight: 18 }
    ]
  },
  {
    vendorSlug: 'google', slug: 'google-professional-cloud-security', code: 'PCSE',
    title: 'Google Professional Cloud Security Engineer',
    description: 'Configure access, network security, and ensure data protection on Google Cloud.',
    level: 'Professional', durationMinutes: 120, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Configuring access', weight: 22 },
      { name: 'Securing communications and establishing boundary protection', weight: 20 },
      { name: 'Ensuring data protection', weight: 20 },
      { name: 'Managing operations', weight: 18 },
      { name: 'Supporting compliance requirements', weight: 20 }
    ]
  },
  // ───── Anthropic — Claude Certified Architect — Foundations ─────
  // Single consolidated exam (slug matches scripts/seed-cca-foundations.ts).
  {
    vendorSlug: 'anthropic', slug: 'anthropic-cca-foundations', code: 'CCA-F',
    title: 'Claude Certified Architect — Foundations',
    description: CLAUDE_ARCHITECT_DESCRIPTION,
    level: 'Foundational', durationMinutes: 120, passingScore: 72, questionCount: 60,
    domains: CLAUDE_ARCHITECT_DOMAINS
  },

  {
    vendorSlug: 'google', slug: 'google-professional-ml-engineer', code: 'PMLE',
    title: 'Google Professional Machine Learning Engineer',
    description: 'Design, build, and productionize ML models using Google Cloud technologies.',
    level: 'Professional', durationMinutes: 120, passingScore: 70, questionCount: 50,
    domains: [
      { name: 'Architecting low-code AI solutions', weight: 12 },
      { name: 'Collaborating within and across teams to manage data and models', weight: 16 },
      { name: 'Scaling prototypes into ML models', weight: 18 },
      { name: 'Serving and scaling models', weight: 19 },
      { name: 'Automating and orchestrating ML pipelines', weight: 21 },
      { name: 'Monitoring AI solutions', weight: 14 }
    ]
  }
];

async function main() {
  const admins: { email: string; name: string; password: string }[] = [
    {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      name: 'Admin',
      password: process.env.ADMIN_PASSWORD || 'ChangeMe!2026'
    },
    { email: 'angch@tertiaryinfotech.com', name: 'Alfred', password: 'password123' },
    { email: 'marcus@tertiaryinfotech.com', name: 'Marcus', password: 'password123' }
  ];
  for (const a of admins) {
    const passwordHash = await argon2.hash(a.password);
    await db.user.upsert({
      where: { email: a.email },
      update: { name: a.name, role: Role.ADMIN, emailVerified: new Date(), passwordHash },
      create: {
        email: a.email,
        name: a.name,
        passwordHash,
        role: Role.ADMIN,
        emailVerified: new Date()
      }
    });
  }

  for (const v of VENDORS) {
    await db.vendor.upsert({
      where: { slug: v.slug },
      update: { name: v.name, description: v.description },
      create: v
    });
  }

  const vendorMap = Object.fromEntries(
    (await db.vendor.findMany()).map(v => [v.slug, v.id])
  );

  for (const e of EXAMS) {
    const defaults = PRICING[e.level];
    const pricePractice = e.pricePractice ?? defaults.practice;
    const priceBundle   = e.priceBundle   ?? defaults.bundle;
    const priceVoucher  = e.priceVoucher  ?? defaults.voucher;
    await db.exam.upsert({
      where: { slug: e.slug },
      update: {
        title: e.title,
        description: e.description,
        level: e.level,
        durationMinutes: e.durationMinutes,
        passingScore: e.passingScore,
        questionCount: e.questionCount,
        domains: e.domains,
        // Push pricing on update too so per-exam overrides reach existing
        // rows when seed is re-run, not just on first create.
        pricePractice, priceBundle, priceVoucher,
        published: true
      },
      create: {
        vendorId: vendorMap[e.vendorSlug],
        slug: e.slug,
        code: e.code,
        title: e.title,
        description: e.description,
        level: e.level,
        durationMinutes: e.durationMinutes,
        passingScore: e.passingScore,
        questionCount: e.questionCount,
        domains: e.domains,
        pricePractice, priceBundle, priceVoucher,
        published: true
      }
    });
  }

  // One-time cleanup: remove the obsolete CCA-F placeholder exam shells that
  // were replaced by the consolidated `anthropic-cca-foundations` slug.
  // Safe to delete because they were 0-question placeholders; we still cascade
  // any FK-attached rows (entitlements, questions, attempts, orders) defensively
  // in case the team-entitlement grant loop or admin actions touched them.
  const obsoleteExams = await db.exam.findMany({ where: { slug: { in: OBSOLETE_EXAM_SLUGS } } });
  if (obsoleteExams.length > 0) {
    const obsoleteIds = obsoleteExams.map(e => e.id);
    await db.entitlement.deleteMany({ where: { examId: { in: obsoleteIds } } });
    await db.question.deleteMany({ where: { examId: { in: obsoleteIds } } });
    await db.attempt.deleteMany({ where: { examId: { in: obsoleteIds } } });
    await db.order.deleteMany({ where: { examId: { in: obsoleteIds } } });
    await db.exam.deleteMany({ where: { slug: { in: OBSOLETE_EXAM_SLUGS } } });
    console.log(`✓ Removed ${obsoleteExams.length} obsolete CCA-F placeholder exam shell(s).`);
  }

  // Grant the internal team test access (PRACTICE tier) on every published exam
  // so they can dogfood the full catalog without going through checkout.
  const teamEmails = ['angch@tertiaryinfotech.com', 'marcus@tertiaryinfotech.com'];
  const teamUsers = await db.user.findMany({ where: { email: { in: teamEmails } } });
  const allExams = await db.exam.findMany({ where: { published: true }, select: { id: true } });
  for (const u of teamUsers) {
    for (const e of allExams) {
      await db.entitlement.upsert({
        where: { userId_examId_tier: { userId: u.id, examId: e.id, tier: Tier.PRACTICE } },
        update: {},
        create: { userId: u.id, examId: e.id, tier: Tier.PRACTICE }
      });
    }
  }

  // Seed bundles. The seed file is the source of truth for what bundles
  // are offered — any existing Bundle rows not present in BUNDLES are
  // unpublished (not deleted, to preserve referential integrity with
  // any historical Order.bundleId references).
  const examMap = Object.fromEntries((await db.exam.findMany()).map(e => [e.slug, e.id]));
  const seededSlugs = new Set(BUNDLES.map(b => b.slug));
  // Unpublish bundles no longer in the seed list.
  await db.bundle.updateMany({
    where: { slug: { notIn: [...seededSlugs] }, published: true },
    data: { published: false }
  });
  for (const b of BUNDLES) {
    const bundle = await db.bundle.upsert({
      where: { slug: b.slug },
      update: { title: b.title, description: b.description, price: b.price, published: true },
      create: { slug: b.slug, title: b.title, description: b.description, price: b.price, published: true }
    });
    await db.bundleItem.deleteMany({ where: { bundleId: bundle.id } });
    for (const item of b.items) {
      const examId = examMap[item.examSlug];
      if (!examId) {
        console.warn(`  ⚠ Bundle "${b.slug}" references unknown exam slug "${item.examSlug}" — skipping`);
        continue;
      }
      await db.bundleItem.create({
        data: { bundleId: bundle.id, examId, tier: item.tier as Tier, position: item.position ?? 0 }
      });
    }
  }

  // Ensure every visible exam has up to 10 isTeaser questions so the
  // "Try 10 questions for free" teaser link always lands on a real
  // 10-question attempt. Top-up only — never unflags existing teasers.
  // Idempotent: skips exams that already have >= 10.
  const examsWithContent = await db.exam.findMany({
    where: { published: true, questions: { some: { status: QStatus.PUBLISHED } } },
    select: { id: true, slug: true }
  });
  let topUpTotal = 0;
  for (const e of examsWithContent) {
    const teaserCount = await db.question.count({
      where: { examId: e.id, isTeaser: true, status: QStatus.PUBLISHED }
    });
    if (teaserCount >= 10) continue;
    const need = 10 - teaserCount;
    const candidates = await db.question.findMany({
      where: { examId: e.id, isTeaser: false, status: QStatus.PUBLISHED },
      take: need,
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });
    if (candidates.length === 0) continue;
    await db.question.updateMany({
      where: { id: { in: candidates.map(c => c.id) } },
      data: { isTeaser: true }
    });
    topUpTotal += candidates.length;
  }
  if (topUpTotal > 0) console.log(`✓ Topped up ${topUpTotal} questions to isTeaser=true across ${examsWithContent.length} exams`);

  console.log(`Seed complete. Vendors: ${VENDORS.length}, Exams: ${EXAMS.length}, Bundles: ${BUNDLES.length}. Admins: ${admins.map(a => a.email).join(', ')}`);
}

main().finally(() => db.$disconnect());
