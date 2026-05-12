import nodemailer, { type Transporter } from 'nodemailer';
import { getAllSettings } from './settings';
import { db } from './db';

type CachedTransporter = {
  transporter: Transporter;
  from: string;
  signature: string;
};

let cached: CachedTransporter | null = null;

/**
 * Build (or reuse) the active nodemailer transporter based on the
 * `EMAIL_TRANSPORT` setting. Switches between Gmail OAuth and SMTP
 * without a redeploy — the signature string is the cache key, so
 * any settings change invalidates the cached transport.
 */
async function getTransport(): Promise<CachedTransporter> {
  const s = await getAllSettings();
  const transport = (s.EMAIL_TRANSPORT || 'SMTP').toUpperCase();

  if (transport === 'GMAIL_OAUTH') {
    const user = s.GMAIL_OAUTH_SENDER_EMAIL || '';
    const clientId = s.GMAIL_OAUTH_CLIENT_ID || '';
    const clientSecret = s.GMAIL_OAUTH_CLIENT_SECRET || '';
    const refreshToken = s.GMAIL_OAUTH_REFRESH_TOKEN || '';
    if (!user || !clientId || !clientSecret || !refreshToken) {
      throw new Error('Gmail OAuth is selected but configuration is incomplete. Visit Settings → Email.');
    }
    const signature = `gmail:${user}:${refreshToken.slice(-10)}`;
    if (cached && cached.signature === signature) return cached;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { type: 'OAuth2', user, clientId, clientSecret, refreshToken }
    } as any);
    const from = s.EMAIL_FROM || user;
    cached = { transporter, from, signature };
    return cached;
  }

  // SMTP path. Settings DB takes precedence, env is fallback for backwards
  // compat with deployments that haven't migrated the values yet.
  const host = s.SMTP_HOST || process.env.SMTP_HOST || '';
  const port = Number(s.SMTP_PORT || process.env.SMTP_PORT || 587);
  const secureSetting = (s.SMTP_SECURE || '').toLowerCase();
  const secure = secureSetting ? secureSetting === 'true' : port === 465;
  const user = s.SMTP_USER || process.env.SMTP_USER || '';
  const pass = s.SMTP_PASSWORD || process.env.SMTP_PASSWORD || '';
  const signature = `smtp:${host}:${port}:${user}:${pass.slice(-6)}`;
  if (cached && cached.signature === signature) return cached;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined
  });
  const from =
    s.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.FROM_EMAIL ||
    'ExamNova <noreply@example.com>';
  cached = { transporter, from, signature };
  return cached;
}

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  attachments?: any[],
  cc?: string | string[],
  meta?: { template?: string; vars?: Record<string, unknown> }
) {
  const t = await getTransport();
  const transportLabel = t.signature.startsWith('gmail:') ? 'GMAIL_OAUTH' : 'SMTP';
  let providerId: string | undefined;
  let error: string | undefined;
  try {
    const info = await t.transporter.sendMail({ from: t.from, to, cc, subject, html, attachments });
    providerId = info.messageId;
    await logEmail({ to, cc, subject, transport: transportLabel, status: 'SENT', providerId, meta });
    return info;
  } catch (err: any) {
    error = String(err?.message ?? err);
    await logEmail({ to, cc, subject, transport: transportLabel, status: 'FAILED', error, meta });
    throw err;
  }
}

async function logEmail(input: {
  to: string;
  cc?: string | string[];
  subject: string;
  transport: string;
  status: 'SENT' | 'FAILED';
  providerId?: string;
  error?: string;
  meta?: { template?: string; vars?: Record<string, unknown> };
}) {
  try {
    const user = await db.user.findUnique({ where: { email: input.to.toLowerCase() }, select: { id: true } }).catch(() => null);
    // Truncate the vars payload to keep individual rows tame.
    let payloadVars: any = input.meta?.vars ?? null;
    if (payloadVars) {
      try {
        const json = JSON.stringify(payloadVars);
        if (json.length > 8000) payloadVars = { _truncated: true, preview: json.slice(0, 800) };
      } catch {
        payloadVars = null;
      }
    }
    await db.emailLog.create({
      data: {
        to: input.to,
        cc: Array.isArray(input.cc) ? input.cc.join(',') : (input.cc || null),
        subject: input.subject,
        template: input.meta?.template ?? null,
        transport: input.transport,
        status: input.status,
        providerId: input.providerId ?? null,
        error: input.error ?? null,
        userId: user?.id ?? null,
        payloadVars: payloadVars ?? undefined
      }
    });
  } catch {
    // Logging failure must never break mail sends.
  }
}

export async function sendOTPEmail(
  to: string,
  code: string,
  purpose: 'LOGIN' | 'REGISTER' | 'RESET' | 'TEASER_GATE'
) {
  const { sendTemplated } = await import('./email/templates');
  const key = ({
    LOGIN: 'OTP_LOGIN',
    REGISTER: 'OTP_REGISTER',
    RESET: 'OTP_RESET',
    TEASER_GATE: 'OTP_TEASER_GATE'
  } as const)[purpose];
  return sendTemplated(key, to, { code, expiresInMinutes: 10, purpose });
}

export async function sendPurchaseEmail(
  to: string,
  productName: string,
  tierLabel: string,
  voucherCode?: string,
  voucherPdf?: Buffer,
  voucherPending?: boolean,
  extras?: {
    order?: { id: string; amount: number; currency: string };
    user?: { name?: string | null; email: string };
    paymentMethod?: string;
  },
  invoice?: { invoicePdf: Buffer; invoiceNumber: string }
) {
  const { sendTemplated } = await import('./email/templates');
  const attachments: any[] = [];
  if (voucherPdf && voucherCode) {
    attachments.push({ filename: `voucher-${voucherCode}.pdf`, content: voucherPdf, contentType: 'application/pdf' });
  }
  if (invoice?.invoicePdf) {
    attachments.push({ filename: `invoice-${invoice.invoiceNumber}.pdf`, content: invoice.invoicePdf, contentType: 'application/pdf' });
  }
  return sendTemplated(
    'ORDER_CONFIRMATION',
    to,
    {
      productName,
      tierLabel,
      voucherCode,
      voucherPending: !!voucherPending,
      paymentMethod: extras?.paymentMethod ?? 'PayPal',
      order: extras?.order ?? { id: '', amount: 0, currency: 'USD' },
      user: extras?.user ?? { name: '', email: to },
      invoiceNumber: invoice?.invoiceNumber ?? null
    },
    attachments.length ? attachments : undefined
  );
}

export async function sendVoucherDeliveredEmail(
  to: string,
  examName: string,
  voucherCode: string,
  voucherPdf?: Buffer,
  expiresAt?: Date | null
) {
  const { sendTemplated } = await import('./email/templates');
  const attachments = voucherPdf
    ? [{ filename: `voucher-${voucherCode}.pdf`, content: voucherPdf, contentType: 'application/pdf' }]
    : undefined;
  return sendTemplated(
    'VOUCHER_DELIVERY',
    to,
    { examName, voucherCode, expiresAt: expiresAt ?? null, user: { email: to } },
    attachments
  );
}

/** Used by the admin "Send test email" button. */
export async function sendTestEmail(to: string): Promise<{ ok: boolean; messageId?: string; transport: string; error?: string }> {
  try {
    const t = await getTransport();
    const transportLabel = t.signature.startsWith('gmail:') ? 'Gmail OAuth' : 'SMTP';
    const info = await t.transporter.sendMail({
      from: t.from,
      to,
      subject: `ExamNova — test email (${transportLabel})`,
      html: `<p>This is a test email sent via <b>${transportLabel}</b> from the admin Settings page.</p><p>If you can read this, the transport is configured correctly.</p>`
    });
    return { ok: true, messageId: info.messageId, transport: transportLabel };
  } catch (err: any) {
    return { ok: false, transport: 'unknown', error: String(err?.message || err) };
  }
}
