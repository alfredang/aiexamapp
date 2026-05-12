import crypto from 'node:crypto';
import { getSetting } from '@/lib/settings';

// HitPay docs: https://hit-pay.com/docs.html
//
// v1 API: form-encoded POST to /v1/payment-requests with X-BUSINESS-API-KEY header.
// Webhook: form-encoded POST with an `hmac` field. Signature is HMAC-SHA256 of
// the concatenated "key+value" pairs of all other fields sorted by key,
// using the salt set in admin settings as the secret.

type HitPayEnv = 'sandbox' | 'live';

async function getEnv(): Promise<HitPayEnv> {
  const v = (await getSetting('HITPAY_ENV')).toLowerCase();
  return v === 'live' ? 'live' : 'sandbox';
}

function apiBase(env: HitPayEnv) {
  return env === 'live' ? 'https://api.hit-pay.com/v1' : 'https://api.sandbox.hit-pay.com/v1';
}

export type CreatePaymentInput = {
  amount: number; // cents
  currency: string; // ISO 4217 (SGD, USD, …)
  email?: string;
  name?: string;
  purpose: string;
  referenceNumber: string; // our Order.id
  redirectUrl: string;
  webhookUrl: string;
};

export type CreatePaymentResult = {
  id: string;
  url: string;
  status: string;
  raw: any;
};

export async function createPaymentRequest(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const apiKey = await getSetting('HITPAY_API_KEY');
  if (!apiKey) throw new Error('HITPAY_API_KEY not configured');
  const env = await getEnv();
  const body = new URLSearchParams();
  // HitPay expects the amount as a decimal string in the major unit.
  body.set('amount', (input.amount / 100).toFixed(2));
  body.set('currency', input.currency);
  body.set('purpose', input.purpose);
  body.set('reference_number', input.referenceNumber);
  body.set('redirect_url', input.redirectUrl);
  body.set('webhook', input.webhookUrl);
  if (input.email) body.set('email', input.email);
  if (input.name) body.set('name', input.name);

  const res = await fetch(`${apiBase(env)}/payment-requests`, {
    method: 'POST',
    headers: {
      'X-BUSINESS-API-KEY': apiKey,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || `hitpay create failed (${res.status})`;
    throw new Error(msg);
  }
  return { id: String(json.id), url: String(json.url), status: String(json.status ?? 'pending'), raw: json };
}

// Verify a webhook payload. The caller passes the parsed form-encoded body as a
// flat record of strings. Returns the canonical payload (without `hmac`) when
// valid, or null when invalid / missing signature.
export async function verifyWebhook(form: Record<string, string>): Promise<Record<string, string> | null> {
  const salt = await getSetting('HITPAY_SALT');
  if (!salt) return null;
  const provided = form.hmac;
  if (!provided) return null;
  const rest: Record<string, string> = {};
  for (const [k, v] of Object.entries(form)) if (k !== 'hmac') rest[k] = v;
  const keys = Object.keys(rest).sort();
  const signedString = keys.map((k) => `${k}${rest[k]}`).join('');
  const computed = crypto.createHmac('sha256', salt).update(signedString).digest('hex');
  // Length must match before timingSafeEqual.
  if (computed.length !== provided.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(provided));
  return ok ? rest : null;
}

export async function isEnabled(): Promise<boolean> {
  return (await getSetting('HITPAY_ENABLED')) === 'true';
}

// Refund a captured payment. HitPay returns { id, payment_id, amount, status, ... }.
export async function refundPayment(paymentId: string, amountCents: number): Promise<{ id: string; status: string; raw: any }> {
  const apiKey = await getSetting('HITPAY_API_KEY');
  if (!apiKey) throw new Error('HITPAY_API_KEY not configured');
  const env = await getEnv();
  const body = new URLSearchParams();
  body.set('payment_id', paymentId);
  body.set('amount', (amountCents / 100).toFixed(2));
  const res = await fetch(`${apiBase(env)}/refund`, {
    method: 'POST',
    headers: {
      'X-BUSINESS-API-KEY': apiKey,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `hitpay refund failed (${res.status})`);
  return { id: String(json.id ?? ''), status: String(json.status ?? 'unknown'), raw: json };
}
