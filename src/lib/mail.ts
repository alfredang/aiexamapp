import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
});

const FROM = process.env.SMTP_FROM || process.env.FROM_EMAIL || 'ExamNova <noreply@example.com>';

export async function sendMail(to: string, subject: string, html: string, attachments?: any[]) {
  return transport.sendMail({ from: FROM, to, subject, html, attachments });
}

export async function sendOTPEmail(to: string, code: string, purpose: 'LOGIN' | 'REGISTER' | 'RESET' | 'TEASER_GATE') {
  const titles = {
    LOGIN: 'Your sign-in code',
    REGISTER: 'Verify your email',
    RESET: 'Reset your password',
    TEASER_GATE: 'Continue your practice exam'
  } as const;
  const title = titles[purpose];
  const html = `<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:auto;padding:24px">
    <h2 style="color:#0f172a;margin:0 0 12px">${title}</h2>
    <p style="color:#475569">Your one-time code:</p>
    <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb;margin:8px 0">${code}</p>
    <p style="color:#94a3b8;font-size:13px">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
  </div>`;
  return sendMail(to, `${title} — ExamNova`, html);
}

export async function sendPurchaseEmail(
  to: string,
  examName: string,
  tierLabel: string,
  voucherCode?: string,
  voucherPdf?: Buffer,
  voucherPending?: boolean
) {
  // Three render variants:
  //  1. voucherCode present -> show the code (legacy / admin-grant path)
  //  2. voucherPending true -> "your voucher arrives in 3-5 business days"
  //  3. neither -> just confirm the practice access
  const voucherSection = voucherCode
    ? `<p>Your voucher code: <code style="background:#f1f5f9;padding:6px 10px;border-radius:6px;font-size:16px">${voucherCode}</code></p>`
    : voucherPending
    ? `<p style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 14px;border-radius:6px;color:#78350f"><b>Your exam voucher is on the way.</b><br>We'll email it to you within <b>3–5 business days</b>. Your practice access is already active and you can start studying right now.</p>`
    : '';
  const html = `<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:auto;padding:24px">
    <h2 style="margin:0 0 12px">Purchase confirmed</h2>
    <p>Thanks for your purchase of <b>${tierLabel}</b> for <b>${examName}</b>.</p>
    ${voucherSection}
    <p style="margin-top:24px"><a href="${process.env.APP_URL}/my-content" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Go to My Content →</a></p>
  </div>`;
  const attachments = voucherPdf
    ? [{ filename: `voucher-${voucherCode}.pdf`, content: voucherPdf, contentType: 'application/pdf' }]
    : undefined;
  return sendMail(to, `Order confirmed — ${examName}`, html, attachments);
}

export async function sendVoucherDeliveredEmail(
  to: string,
  examName: string,
  voucherCode: string,
  voucherPdf?: Buffer
) {
  const html = `<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:auto;padding:24px">
    <h2 style="margin:0 0 12px">Your voucher is ready</h2>
    <p>Your <b>${examName}</b> exam voucher has been issued.</p>
    <p>Voucher code: <code style="background:#f1f5f9;padding:6px 10px;border-radius:6px;font-size:16px">${voucherCode}</code></p>
    <p style="color:#64748b;font-size:14px">Use this code on the certification vendor's exam-booking site (e.g. Pearson VUE / PSI) to schedule your exam.</p>
    <p style="margin-top:24px"><a href="${process.env.APP_URL}/my-content/vouchers" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">View in My Content →</a></p>
  </div>`;
  const attachments = voucherPdf
    ? [{ filename: `voucher-${voucherCode}.pdf`, content: voucherPdf, contentType: 'application/pdf' }]
    : undefined;
  return sendMail(to, `Your ${examName} voucher is ready`, html, attachments);
}
