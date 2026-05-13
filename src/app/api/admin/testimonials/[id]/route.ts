import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchBody = z.object({
  authorName: z.string().min(1).max(120).optional(),
  authorTitle: z.string().max(160).optional().nullable(),
  avatarUrl: z.string().max(500).optional().nullable(),
  quote: z.string().min(1).max(800).optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  examId: z.string().optional().nullable(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const adminId = (session?.user as any)?.id as string | undefined;
  if (!adminId || !isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const data = PatchBody.parse(await req.json());
  const cleaned: any = { ...data };
  if (cleaned.authorTitle === '') cleaned.authorTitle = null;
  if (cleaned.avatarUrl === '') cleaned.avatarUrl = null;
  if (cleaned.examId === '') cleaned.examId = null;
  const item = await db.testimonial.update({ where: { id }, data: cleaned });
  await db.adminLog.create({
    data: { adminId, action: 'testimonial.update', targetType: 'Testimonial', targetId: id, metadata: cleaned }
  });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const adminId = (session?.user as any)?.id as string | undefined;
  if (!adminId || !isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const { id } = await ctx.params;
  await db.testimonial.update({ where: { id }, data: { deletedAt: new Date() } });
  await db.adminLog.create({
    data: { adminId, action: 'testimonial.delete', targetType: 'Testimonial', targetId: id }
  });
  return NextResponse.json({ ok: true });
}
