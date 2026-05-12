import { NextResponse } from 'next/server';
import type { EmailTemplateKey } from '@prisma/client';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS } from '@/lib/email/defaults';
import { renderTemplate } from '@/lib/email/templates';
import { sendMail } from '@/lib/mail';
import { render } from '@/lib/email/handlebars';
import { getBrand } from '@/lib/email/templates';
import { getCompanyInfo } from '@/lib/settings';

function isKey(s: string): s is EmailTemplateKey {
  return (TEMPLATE_KEYS as string[]).includes(s);
}

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return null;
  return user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { key } = await params;
  if (!isKey(key)) return NextResponse.json({ error: 'unknown-key' }, { status: 404 });
  const row = await db.emailTemplate.findUnique({ where: { key } });
  const def = DEFAULT_TEMPLATES[key];
  return NextResponse.json({
    key,
    description: def.description,
    sampleVars: def.sampleVars,
    default: { subject: def.subject, bodyHtml: def.bodyHtml },
    current: row
      ? { subject: row.subject, bodyHtml: row.bodyHtml, enabled: row.enabled, customized: true }
      : { subject: def.subject, bodyHtml: def.bodyHtml, enabled: true, customized: false }
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { key } = await params;
  if (!isKey(key)) return NextResponse.json({ error: 'unknown-key' }, { status: 404 });
  const body = (await req.json().catch(() => null)) as
    | {
        subject?: string;
        bodyHtml?: string;
        enabled?: boolean;
        displayName?: string | null;
        ccEmails?: string[] | string | null;
      }
    | null;
  if (!body || typeof body.subject !== 'string' || typeof body.bodyHtml !== 'string') {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  // For ccEmails / displayName: only update when the caller explicitly
  // sent the field. This lets the simpler editors (full-preview page)
  // PUT just subject/bodyHtml/enabled without nuking the other values.
  const ccEmailsProvided = body.ccEmails !== undefined;
  const ccEmails = ccEmailsProvided
    ? Array.isArray(body.ccEmails)
      ? body.ccEmails
      : typeof body.ccEmails === 'string'
        ? body.ccEmails.split(',').map((s) => s.trim()).filter(Boolean)
        : []
    : undefined;
  const displayNameProvided = body.displayName !== undefined;
  const displayName = displayNameProvided
    ? typeof body.displayName === 'string' && body.displayName.trim()
      ? body.displayName.trim()
      : null
    : undefined;

  const row = await db.emailTemplate.upsert({
    where: { key },
    create: {
      key,
      displayName: displayName ?? null,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      ccEmails: ccEmails ?? [],
      enabled: body.enabled ?? true,
      updatedById: user.id
    },
    update: {
      ...(displayNameProvided ? { displayName } : {}),
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      ...(ccEmailsProvided ? { ccEmails } : {}),
      enabled: body.enabled ?? true,
      updatedById: user.id
    }
  });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'email-template.update', targetType: 'EmailTemplate', targetId: row.id, metadata: { key } }
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { key } = await params;
  if (!isKey(key)) return NextResponse.json({ error: 'unknown-key' }, { status: 404 });
  await db.emailTemplate.deleteMany({ where: { key } });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'email-template.reset', targetType: 'EmailTemplate', metadata: { key } }
  });
  return NextResponse.json({ ok: true });
}

// POST { action: 'preview' | 'test-send', subject?, bodyHtml?, to?, vars? }
export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { key } = await params;
  if (!isKey(key)) return NextResponse.json({ error: 'unknown-key' }, { status: 404 });
  const body = (await req.json().catch(() => null)) as
    | { action: string; subject?: string; bodyHtml?: string; to?: string; vars?: Record<string, unknown> }
    | null;
  if (!body) return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  if (body.action === 'preview') {
    const def = DEFAULT_TEMPLATES[key];
    const subject = body.subject ?? def.subject;
    const bodyHtml = body.bodyHtml ?? def.bodyHtml;
    const vars = body.vars ?? def.sampleVars;
    const [brand, company] = await Promise.all([getBrand(), getCompanyInfo()]);
    const ctx = { brand, company, appUrl: process.env.APP_URL || '', now: new Date(), ...vars };
    try {
      return NextResponse.json({ subject: render(subject, ctx), html: render(bodyHtml, ctx) });
    } catch (e: any) {
      return NextResponse.json({ error: 'render-failed', message: String(e?.message ?? e) }, { status: 422 });
    }
  }

  if (body.action === 'test-send') {
    const to = body.to || user.email;
    if (!to) return NextResponse.json({ error: 'no-recipient' }, { status: 400 });
    const rendered = await renderTemplate(key, body.vars ?? DEFAULT_TEMPLATES[key].sampleVars);
    await sendMail(to, `[TEST] ${rendered.subject}`, rendered.html);
    await db.adminLog.create({
      data: { adminId: user.id, action: 'email-template.test-send', targetType: 'EmailTemplate', metadata: { key, to } }
    });
    return NextResponse.json({ ok: true, to });
  }

  return NextResponse.json({ error: 'unknown-action' }, { status: 400 });
}
