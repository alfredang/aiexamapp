import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBody = z.object({
  question: z.string().min(2).max(300),
  answer: z.string().min(2).max(4000),
  position: z.number().int().min(0).default(0),
  published: z.boolean().default(true)
});

const BulkBody = z.object({
  items: z.array(z.object({ question: z.string(), answer: z.string() })).min(1).max(20)
});

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const json = await req.json();
  // Branch: bulk vs single.
  if (json && Array.isArray(json.items)) {
    const { items } = BulkBody.parse(json);
    const existing = await db.faq.count();
    const created = await db.$transaction(
      items.map((it, i) =>
        db.faq.create({
          data: {
            question: it.question.slice(0, 300),
            answer: it.answer.slice(0, 4000),
            position: existing + i,
            published: true
          }
        })
      )
    );
    return NextResponse.json({ ok: true, count: created.length });
  }
  const data = CreateBody.parse(json);
  const item = await db.faq.create({ data });
  return NextResponse.json({ ok: true, item });
}
