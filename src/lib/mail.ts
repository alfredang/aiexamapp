import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
});

const FROM = process.env.SMTP_FROM || process.env.FROM_EMAIL || 'ExamNova <noreply@example.com>';

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  attachments?: any[],
  cc?: string | string[]
) {
  return transport.sendMail({ from: FROM, to, cc, subject, html, attachments });
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
  extras?: { order?: { id: string; amount: number; currency: string }; user?: { name?: string | null; email: string }; paymentMethod?: string }
) {
  const { sendTemplated } = await import('./email/templates');
  const attachments =
    voucherPdf && voucherCode
      ? [{ filename: `voucher-${voucherCode}.pdf`, content: voucherPdf, contentType: 'application/pdf' }]
      : undefined;
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
      user: extras?.user ?? { name: '', email: to }
    },
    attachments
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
