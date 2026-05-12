import crypto from 'node:crypto';
import { db } from '@/lib/db';

export const SETTING_KEYS = [
  'PAYPAL_ENV',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'PAYPAL_ENABLED',
  'PAYNOW_ENABLED',
  'PAYNOW_MERCHANT_ID',
  'PAYNOW_UEN',
  'PAYNOW_BANK',
  'PAYNOW_QR_LOGO_URL',
  'HITPAY_ENABLED',
  'HITPAY_ENV',
  'HITPAY_API_KEY',
  'HITPAY_SALT',
  'ANTHROPIC_API_KEY',
  'COMPANY_NAME',
  'COMPANY_SHORT_NAME',
  'COMPANY_UEN',
  'COMPANY_ADDRESS',
  'COMPANY_EMAIL',
  'COMPANY_TEL',
  'COMPANY_WEBSITE',
  'BRAND_NAME',
  'BRAND_LOGO_URL',
  'BRAND_PRIMARY_COLOR',
  'BRAND_SUPPORT_EMAIL',
  'VOUCHER_DELAY_DAYS',
  'FULFILLMENT_TIMEZONE',
  'WORKER_SHARED_SECRET'
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export const SECRET_KEYS: ReadonlySet<SettingKey> = new Set([
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'HITPAY_API_KEY',
  'HITPAY_SALT',
  'ANTHROPIC_API_KEY',
  'WORKER_SHARED_SECRET'
]);

function key(): Buffer {
  const src = process.env.SETTINGS_KEY || process.env.NEXTAUTH_SECRET || 'dev-fallback-secret';
  return crypto.createHash('sha256').update(src).digest();
}

export function encrypt(plain: string): string {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decrypt(stored: string): string {
  if (!stored) return '';
  if (!stored.startsWith('v1:')) return stored;
  const [, ivB, tagB, encB] = stored.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64'));
  const dec = Buffer.concat([decipher.update(Buffer.from(encB, 'base64')), decipher.final()]);
  return dec.toString('utf8');
}

export async function getSetting(k: SettingKey): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: k } });
  if (row?.value) return decrypt(row.value);
  return process.env[k] || '';
}

export async function getAllSettings(): Promise<Record<SettingKey, string>> {
  const rows = await db.setting.findMany({ where: { key: { in: [...SETTING_KEYS] } } });
  const map = new Map(rows.map((r) => [r.key, decrypt(r.value)]));
  const out = {} as Record<SettingKey, string>;
  for (const k of SETTING_KEYS) out[k] = map.get(k) || process.env[k] || '';
  return out;
}

export async function setSetting(k: SettingKey, value: string): Promise<void> {
  const enc = encrypt(value);
  await db.setting.upsert({
    where: { key: k },
    create: { key: k, value: enc },
    update: { value: enc }
  });
}

export type CompanyInfo = {
  name: string;
  shortName: string;
  uen: string;
  address: string;
  email: string;
  tel: string;
  website: string;
};

export const COMPANY_DEFAULTS: CompanyInfo = {
  name: 'Tertiary Infotech Academy Pte Ltd',
  shortName: 'Tertiary Infotech Academy',
  uen: '201200696W',
  address: '12 Woodland Square #07-85/86/87 Woods Square Tower 1, Singapore 737715',
  email: 'enquiry@tertiaryinfotech.com',
  tel: '61000613',
  website: 'https://www.tertiarycourses.com.sg/'
};

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const all = await getAllSettings();
  return {
    name: all.COMPANY_NAME || COMPANY_DEFAULTS.name,
    shortName: all.COMPANY_SHORT_NAME || COMPANY_DEFAULTS.shortName,
    uen: all.COMPANY_UEN || COMPANY_DEFAULTS.uen,
    address: all.COMPANY_ADDRESS || COMPANY_DEFAULTS.address,
    email: all.COMPANY_EMAIL || COMPANY_DEFAULTS.email,
    tel: all.COMPANY_TEL || COMPANY_DEFAULTS.tel,
    website: all.COMPANY_WEBSITE || COMPANY_DEFAULTS.website
  };
}

export function mask(value: string): string {
  if (!value) return '';
  if (value.length <= 6) return '••••••••••••';
  if (value.length <= 12) {
    const dots = '•'.repeat(Math.max(8, value.length - 4));
    return `${value.slice(0, 2)}${dots}${value.slice(-2)}`;
  }
  // Scale the dot count with the real string so the mask looks like a credential,
  // not a 4-dot stub. Cap at 32 dots to keep the input from overflowing.
  const dotCount = Math.min(32, Math.max(12, value.length - 8));
  return `${value.slice(0, 4)}${'•'.repeat(dotCount)}${value.slice(-4)}`;
}
