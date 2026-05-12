import type { EmailTemplateKey } from '@prisma/client';
import { db } from '@/lib/db';
import { getCompanyInfo, getSetting } from '@/lib/settings';
import { render } from './handlebars';
import { DEFAULT_TEMPLATES } from './defaults';
import { sendMail } from '@/lib/mail';

export type Brand = {
  name: string;
  logoUrl: string;
  primaryColor: string;
  supportEmail: string;
};

export async function getBrand(): Promise<Brand> {
  const [name, logoUrl, primaryColor, supportEmail, company] = await Promise.all([
    getSetting('BRAND_NAME'),
    getSetting('BRAND_LOGO_URL'),
    getSetting('BRAND_PRIMARY_COLOR'),
    getSetting('BRAND_SUPPORT_EMAIL'),
    getCompanyInfo()
  ]);
  return {
    name: name || company.shortName || 'ExamNova',
    logoUrl: logoUrl || '',
    primaryColor: primaryColor || '#2563eb',
    supportEmail: supportEmail || company.email
  };
}

export type RenderedTemplate = { subject: string; html: string };

async function loadSource(key: EmailTemplateKey): Promise<{ subject: string; bodyHtml: string; enabled: boolean }> {
  const row = await db.emailTemplate.findUnique({ where: { key } });
  if (row && row.enabled) return { subject: row.subject, bodyHtml: row.bodyHtml, enabled: true };
  if (row && !row.enabled) return { subject: row.subject, bodyHtml: row.bodyHtml, enabled: false };
  const def = DEFAULT_TEMPLATES[key];
  return { subject: def.subject, bodyHtml: def.bodyHtml, enabled: true };
}

export async function renderTemplate(
  key: EmailTemplateKey,
  vars: Record<string, unknown>
): Promise<RenderedTemplate & { enabled: boolean }> {
  const [src, brand, company] = await Promise.all([loadSource(key), getBrand(), getCompanyInfo()]);
  const ctx = {
    brand,
    company,
    appUrl: process.env.APP_URL || '',
    now: new Date(),
    ...vars
  };
  return {
    subject: render(src.subject, ctx),
    html: render(src.bodyHtml, ctx),
    enabled: src.enabled
  };
}

export async function sendTemplated(
  key: EmailTemplateKey,
  to: string,
  vars: Record<string, unknown>,
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>
) {
  const rendered = await renderTemplate(key, vars);
  if (!rendered.enabled) return null;
  return sendMail(to, rendered.subject, rendered.html, attachments);
}
