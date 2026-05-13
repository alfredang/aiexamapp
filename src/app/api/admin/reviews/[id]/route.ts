import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchBody = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  adminNote: z.string().max(1000).optional()
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const adminId = (session?.user as any)?.id as string | undefined;
  if (!adminId || !isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const data = PatchBody.parse(await req.json());
  const item = await db.review.update({ where: { id }, data });
  await db.adminLog.create({
    data: { adminId, action: 'review.update', targetType: 'Review', targetId: id, metadata: data }
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
  await db.review.update({ where: { id }, data: { deletedAt: new Date() } });
  await db.adminLog.create({
    data: { adminId, action: 'review.delete', targetType: 'Review', targetId: id }
  });
  return NextResponse.json({ ok: true });
}
