import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendTestEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { to?: string };
  const to = (body.to || '').trim();
  if (!to) return NextResponse.json({ ok: false, error: 'missing_to' }, { status: 400 });

  const result = await sendTestEmail(to);
  await db.adminLog.create({
    data: {
      adminId: user.id,
      action: result.ok ? 'email.test-send.success' : 'email.test-send.failed',
      targetType: 'Email',
      targetId: null,
      metadata: { to, transport: result.transport, error: result.error ?? null, messageId: result.messageId ?? null }
    }
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
