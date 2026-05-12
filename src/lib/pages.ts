import { db } from './db';

export type PageDefault = {
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  showInFooter: boolean;
  footerGroup: 'legal' | 'company' | null;
  position: number;
};

const PARA = (s: string) => `<p style="margin:0 0 12px;line-height:1.7">${s}</p>`;
const HEADING = (s: string) => `<h2 style="margin:24px 0 8px;font-size:1.25rem;font-weight:600">${s}</h2>`;

export const DEFAULT_PAGES: PageDefault[] = [
  {
    slug: 'how-it-works',
    title: 'How it works',
    excerpt: 'How to study with our practice exams.',
    showInFooter: true,
    footerGroup: 'company',
    position: 10,
    bodyHtml: [
      PARA('Our practice exams are designed to mirror the structure, difficulty, and topic weighting of the real certification.'),
      HEADING('1. Try 10 questions free'),
      PARA('Every exam ships with a free teaser. No credit card required.'),
      HEADING('2. Practice mode'),
      PARA('See the correct answer and an explanation immediately after each question. Build your understanding.'),
      HEADING('3. Exam mode'),
      PARA('Timed simulation that matches the real test duration. Get a per-domain breakdown of your score.'),
      HEADING('4. Voucher option'),
      PARA('Some exams include a discounted real-exam voucher delivered within 3-5 business days. Use it at the certification vendor to book your test.')
    ].join('')
  },
  {
    slug: 'faq',
    title: 'FAQ',
    excerpt: 'Common questions about our practice exams.',
    showInFooter: true,
    footerGroup: 'company',
    position: 20,
    bodyHtml: [
      HEADING('Are these real exam questions?'),
      PARA('No. We write original practice questions aligned to each certification\'s published blueprint. We do not provide real exam dumps.'),
      HEADING('How long do I have access?'),
      PARA('Lifetime access. No subscription, no expiry.'),
      HEADING('When does my voucher arrive?'),
      PARA('Voucher codes are emailed within 3-5 business days of purchase. Practice access activates immediately.'),
      HEADING('What if I fail my real exam?'),
      PARA('Reach out to support@yourdomain.com — we\'ll work with you on a plan to retake.')
    ].join('')
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    excerpt: 'Terms governing use of our service.',
    showInFooter: true,
    footerGroup: 'legal',
    position: 10,
    bodyHtml: [
      PARA('By accessing or using this platform you agree to these terms.'),
      HEADING('Accounts'),
      PARA('You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.'),
      HEADING('Content'),
      PARA('All practice questions, explanations, and supplementary materials are our original work, protected by copyright. You may use them for personal exam preparation only — redistribution or resale is prohibited.'),
      HEADING('Vouchers'),
      PARA('Exam vouchers are issued by third-party certification bodies. Voucher delivery times depend on inventory availability and typically take 3-5 business days.'),
      HEADING('Limitation of liability'),
      PARA('We provide practice materials on an "as is" basis. We do not guarantee a passing score on any real certification exam.'),
      PARA('<em>Last updated: this date should be edited via the admin Pages dashboard.</em>')
    ].join('')
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    excerpt: 'How we collect and handle your data.',
    showInFooter: true,
    footerGroup: 'legal',
    position: 20,
    bodyHtml: [
      PARA('We collect only the information needed to deliver our service: your email, name, billing address, and exam progress.'),
      HEADING('What we collect'),
      PARA('Account: email, name, optional password.<br>Purchases: billing address, order history, payment provider transaction id (we never store full card numbers).<br>Usage: which questions you answered and how you scored.'),
      HEADING('What we don\'t do'),
      PARA('We do not sell your data. We do not run third-party advertising trackers on your account pages.'),
      HEADING('Your rights'),
      PARA('You may request deletion of your account and associated data at any time by emailing support.')
    ].join('')
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    excerpt: 'When and how refunds are issued.',
    showInFooter: true,
    footerGroup: 'legal',
    position: 30,
    bodyHtml: [
      PARA('We want you to be confident in your purchase.'),
      HEADING('Practice exams'),
      PARA('Full refund within 7 days of purchase if you have answered fewer than 20 questions across all attempts. Email support with your order id.'),
      HEADING('Voucher bundles'),
      PARA('Once a voucher code has been issued and delivered to you, the voucher portion is non-refundable (we have already paid the certification vendor). The practice-exam portion remains refundable under the 7-day / 20-question rule.'),
      HEADING('How to request'),
      PARA('Reply to your order confirmation email or contact support directly. Approved refunds are returned to the original payment method within 5-10 business days.')
    ].join('')
  }
];

// Idempotently seeds the default pages. Creates a row only if the slug
// doesn't exist — never overwrites admin edits.
export async function seedDefaultPages(): Promise<{ created: string[]; skipped: string[] }> {
  const existing = await db.page.findMany({ select: { slug: true } });
  const have = new Set(existing.map((r) => r.slug));
  const created: string[] = [];
  const skipped: string[] = [];
  for (const p of DEFAULT_PAGES) {
    if (have.has(p.slug)) {
      skipped.push(p.slug);
      continue;
    }
    await db.page.create({
      data: {
        slug: p.slug,
        title: p.title,
        bodyHtml: p.bodyHtml,
        excerpt: p.excerpt,
        showInFooter: p.showInFooter,
        footerGroup: p.footerGroup,
        position: p.position,
        published: true
      }
    });
    created.push(p.slug);
  }
  return { created, skipped };
}

export async function getFooterPages() {
  return db.page.findMany({
    where: { published: true, showInFooter: true },
    select: { slug: true, title: true, footerGroup: true, position: true },
    orderBy: [{ footerGroup: 'asc' }, { position: 'asc' }, { title: 'asc' }]
  });
}
