/**
 * One-shot seed: Cisco Certified Network Associate (CCNA) (Practice Exam 4) (14 questions).
 *
 *   npx tsx scripts/seed-cisco-ccna-p4.ts
 *
 * Idempotent: skips Question seeding if any questions tagged "manual:cisco-ccna-p4"
 * already exist for this exam. Source: practice PDF (parsed via
 * pdftotext + scripts/_pdf-to-seed.ts).
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

const db = new PrismaClient();

const VENDOR_SLUG = 'cisco';
const EXAM_SLUG = 'cisco-ccna-p4';
const TAG = 'manual:cisco-ccna-p4';

const DOMAINS = [
  { name: 'Network Fundamentals', weight: 20 },
  { name: 'Network Access', weight: 20 },
  { name: 'IP Connectivity', weight: 25 },
  { name: 'IP Services', weight: 10 },
  { name: 'Security Fundamentals', weight: 15 },
  { name: 'Automation and Programmability', weight: 10 }
];

const REF = {
  label: 'Cisco CCNA (200-301) exam page',
  url: 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html'
};

type Q = {
  domain: string;
  type: QType;
  stem: string;
  options: { id: string; text: string }[];
  correct: string[];
  explanation: string;
};

const QUESTIONS: Q[] = [
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'Which feature or protocol determines whether the QoS on the network is sufficient to support IP services?',
    options: [
      { id: 'A', text: 'LLDP' },
      { id: 'B', text: 'IP SLA' },
      { id: 'C', text: 'EEM' },
      { id: 'D', text: 'CDP' }
    ],
    correct: ['B'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'Which type of address is the public IP address of a NAT device?',
    options: [
      { id: 'A', text: 'outside local' },
      { id: 'B', text: 'inside global' },
      { id: 'C', text: 'inside local' },
      { id: 'D', text: 'outside public' },
      { id: 'E', text: 'inside public F. outside global' }
    ],
    correct: ['B'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'Which command can you enter to allow Telnet to be supported in addition to SSH?',
    options: [
      { id: 'A', text: 'privilege level 15' },
      { id: 'B', text: 'transport input telnet' },
      { id: 'C', text: 'no transport input telnet' },
      { id: 'D', text: 'transport input telnet ssh' }
    ],
    correct: ['D'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'Which Cisco IOS command will indicate that interface GigabitEthernet 0/0 is configured via DHCP?',
    options: [
      { id: 'A', text: 'show interface GigabitEthernet 0/0' },
      { id: 'B', text: 'show ip interface GigabitEthernet 0/0 dhcp' },
      { id: 'C', text: 'show ip interface GigabitEthernet 0/0' },
      { id: 'D', text: 'show ip interface GigabitEthernet 0/0 brief' },
      { id: 'E', text: 'show ip interface dhcp' }
    ],
    correct: ['C'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'Which command enables a router to become a DHCP client?',
    options: [
      { id: 'A', text: 'ip dhcp pool' },
      { id: 'B', text: 'ip dhcp client' },
      { id: 'C', text: 'ip helper-address' },
      { id: 'D', text: 'ip address dhcp' }
    ],
    correct: ['D'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'Which command should you enter to configure a device as an NTP server?',
    options: [
      { id: 'A', text: 'ntp peer' },
      { id: 'B', text: 'ntp master' },
      { id: 'C', text: 'ntp authenticate' },
      { id: 'D', text: 'ntp server' }
    ],
    correct: ['B'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.MULTI,
    stem: 'Which two pieces of information can you determine from the output of the show ntp status command? (Choose two)',
    options: [
      { id: 'A', text: 'the configured NTP servers' },
      { id: 'B', text: 'the IP address of the peer to which the clock is synchronized' },
      { id: 'C', text: 'whether the NTP peer is statically configured' },
      { id: 'D', text: 'whether the clock is synchronized' },
      { id: 'E', text: 'the NTP version number of the peer' }
    ],
    correct: ['B', 'D'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'The source IP address is the IP address of the sending packets so it is the "inside local" address. Which keyword in a NAT configuration enables the use of one outside IP address for multiple inside hosts?',
    options: [
      { id: 'A', text: 'overload' },
      { id: 'B', text: 'source' },
      { id: 'C', text: 'static' },
      { id: 'D', text: 'pool Explanation: Overall explanation By adding the keyword "overload" at the end of a NAT statement, NAT becomes PAT (Port Address Translation). This is also a kind of dynamic NAT that maps multiple private IP addresses to a single public IP address (many-to-one) by using different ports. Static NAT and Dynamic NAT both require a one-to-one mapping from the inside local to the inside global address. By using PAT, you can have thousands of users connect to the Internet using only one real global IP address. PAT is the technology that helps us not run out of public IP address on the Internet. This is the most popular type of NAT. An example of using "overload" keyword is shown below: R1(config)# ip nat inside source list 1 interface ethernet1 overload' }
    ],
    correct: ['A'],
    explanation: 'Overall explanation By adding the keyword "overload" at the end of a NAT statement, NAT becomes PAT (Port Address Translation). This is also a kind of dynamic NAT that maps multiple private IP addresses to a single public IP address (many-to-one) by using different ports. Static NAT and Dynamic NAT both require a one-to-one mapping from the inside local to the inside global address. By using PAT, you can have thousands of users connect to the Internet using only one real global IP address. PAT is the technology that helps us not run out of public IP address on the Internet. This is the most popular type of NAT. An example of using "overload" keyword is shown below: R1(config)# ip nat inside source list 1 interface ethernet1 overload'
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'A network engineer must back up 20 network router configurations globally within a customer environment. Which protocol allows the engineer to perform this function using the Cisco IOS MIB?',
    options: [
      { id: 'A', text: 'COP' },
      { id: 'B', text: 'SNMP' },
      { id: 'C', text: 'ARP' },
      { id: 'D', text: 'SMTP' }
    ],
    correct: ['B'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'If a notice-level messaging is sent to a syslog server, which event has occurred?',
    options: [
      { id: 'A', text: 'An ARP Inspection has failed' },
      { id: 'B', text: 'A network device has restarted' },
      { id: 'C', text: 'A debug operation is running' },
      { id: 'D', text: 'A routing instance has flapped' }
    ],
    correct: ['D'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'What will happen if you configure the logging trap debug command on a router?',
    options: [
      { id: 'A', text: 'It causes the router to stop sending all messages to the syslog server' },
      { id: 'B', text: 'It causes the router to send messages with lower severity levels to the syslog server' },
      { id: 'C', text: 'It causes the router to send all messages to the syslog server' },
      { id: 'D', text: 'It causes the router to send all messages with the severity levels Warning, Error, Critical, and Emergency to the syslog server' }
    ],
    correct: ['C'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'Refer to the exhibit. An engineer configured NAT translations and has verified that the configuration is correct. Which IP address is the source IP?',
    options: [
      { id: 'A', text: '10.4.4.4' },
      { id: 'B', text: '10.4.4.5' },
      { id: 'C', text: '172.23.103.10' },
      { id: 'D', text: '172.23.104.4' }
    ],
    correct: ['D'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.SINGLE,
    stem: 'Which statement about the nature of NAT overload is true?',
    options: [
      { id: 'A', text: 'applies a one-to-many relationship to internal IP addresses' },
      { id: 'B', text: 'applies a one-to-one relationship to internal IP addresses' },
      { id: 'C', text: 'can be configured only on Gigabit interface' },
      { id: 'D', text: 'applies a many-to-many relationship to internal IP addresses' }
    ],
    correct: ['A'],
    explanation: ''
  },
  {
    domain: 'IP Connectivity',
    type: QType.MULTI,
    stem: 'Which two tasks must be performed to configure NTP to a trusted server in client mode on a single network device? (Choose two)',
    options: [
      { id: 'A', text: 'Specify the IP address of the NTP server' },
      { id: 'B', text: 'Disable NTP broadcasts' },
      { id: 'C', text: 'Set the NTP server private key' },
      { id: 'D', text: 'Enable NTP authentication' },
      { id: 'E', text: 'Verify the time zone' }
    ],
    correct: ['A', 'D'],
    explanation: ''
  }
];

async function main() {
  const vendor = await db.vendor.findUnique({ where: { slug: VENDOR_SLUG } });
  if (!vendor) throw new Error(`Vendor "${VENDOR_SLUG}" not found — run prisma seed first.`);

  const exam = await db.exam.upsert({
    where: { slug: EXAM_SLUG },
    update: {
      title: 'Cisco Certified Network Associate (CCNA) (Practice Exam 4)',
      description: 'Cisco Certified Network Associate (CCNA, 200-301) practice set covering network fundamentals, access, IP connectivity & services, security fundamentals, and automation. Sourced from a third-party practice exam PDF. Not real exam questions.',
      level: 'Associate',
      durationMinutes: 120,
      passingScore: 82,
      questionCount: 14,
      domains: DOMAINS,
      published: false
    },
    create: {
      vendorId: vendor.id,
      code: '200-301-P4',
      slug: EXAM_SLUG,
      title: 'Cisco Certified Network Associate (CCNA) (Practice Exam 4)',
      description: 'Cisco Certified Network Associate (CCNA, 200-301) practice set covering network fundamentals, access, IP connectivity & services, security fundamentals, and automation. Sourced from a third-party practice exam PDF. Not real exam questions.',
      level: 'Associate',
      durationMinutes: 120,
      passingScore: 82,
      questionCount: 14,
      domains: DOMAINS,
      pricePractice: 2900,
      priceBundle: 17900,
      priceVoucher: 14900,
      published: false
    }
  });

  const alreadySeeded = await db.question.count({
    where: { examId: exam.id, generatedBy: TAG }
  });
  if (alreadySeeded > 0) {
    console.log(`Already have ${alreadySeeded} questions tagged "${TAG}" — skipping.`);
    return;
  }

  let i = 0;
  for (const q of QUESTIONS) {
    await db.question.create({
      data: {
        examId: exam.id,
        domain: q.domain,
        difficulty: 3,
        type: q.type,
        stem: q.stem,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        references: [REF],
        status: QStatus.PUBLISHED,
        generatedBy: TAG,
        isTeaser: i < 10
      }
    });
    i++;
  }

  const total = await db.question.count({ where: { examId: exam.id, status: QStatus.PUBLISHED } });
  console.log(`✓ ${EXAM_SLUG} — inserted ${QUESTIONS.length} questions (${total} total published)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
