import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchBody = z.object({
  question: z.string().min(2).max(300).optional(),
  answer: z.string().min(2).max(4000).optional(),
  position: z.number().int().min(0).optional(),
  published: z.boolean().optional()
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const data = PatchBody.parse(await req.json());
  const item = await db.faq.update({ where: { id }, data });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const { id } = await ctx.params;
  await db.faq.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
