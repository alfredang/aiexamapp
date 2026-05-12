import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS } from '@/lib/email/defaults';

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const rows = await db.emailTemplate.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const items = TEMPLATE_KEYS.map((key) => {
    const row = byKey.get(key);
    const def = DEFAULT_TEMPLATES[key];
    return {
      key,
      description: def.description,
      displayName: row?.displayName ?? def.displayName,
      customized: !!row,
      enabled: row ? row.enabled : true,
      subject: row?.subject ?? def.subject,
      bodyHtml: row?.bodyHtml ?? def.bodyHtml,
      ccEmails: row?.ccEmails ?? [],
      sampleVars: def.sampleVars,
      defaults: { displayName: def.displayName, subject: def.subject, bodyHtml: def.bodyHtml },
      updatedAt: row?.updatedAt ?? null
    };
  });
  return NextResponse.json({ items });
}
