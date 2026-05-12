import crypto from 'node:crypto';
import { db } from '@/lib/db';

export const SETTING_KEYS = [
  'PAYPAL_ENV',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'PAYNOW_MERCHANT_ID',
  'PAYNOW_API_KEY',
  'HITPAY_API_KEY',
  'HITPAY_SALT',
  'ANTHROPIC_API_KEY'
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export const SECRET_KEYS: ReadonlySet<SettingKey> = new Set([
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'PAYNOW_API_KEY',
  'HITPAY_API_KEY',
  'HITPAY_SALT',
  'ANTHROPIC_API_KEY'
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

export function mask(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}
