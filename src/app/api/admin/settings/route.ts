import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { SETTING_KEYS, SettingKey, setSetting } from '@/lib/settings';

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  const allowed = new Set<string>(SETTING_KEYS);
  const changed: string[] = [];
  for (const [k, v] of Object.entries(body)) {
    if (!allowed.has(k)) continue;
    if (typeof v !== 'string') continue;
    if (v === '') continue;
    await setSetting(k as SettingKey, v);
    changed.push(k);
  }

  await db.adminLog.create({
    data: {
      adminId: user.id,
      action: 'settings.update',
      targetType: 'Setting',
      metadata: { keys: changed }
    }
  });

  return NextResponse.json({ ok: true, changed });
}
