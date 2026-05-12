import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const Body = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(200).optional(),
  bodyHtml: z.string().optional(),
  excerpt: z.string().max(300).optional().nullable(),
  published: z.boolean().optional(),
  showInFooter: z.boolean().optional(),
  footerGroup: z.enum(['legal', 'company']).optional().nullable(),
  position: z.number().int().optional()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  const existing = await db.page.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad-request', issues: parsed.error.issues }, { status: 400 });
  const data = parsed.data;
  if (data.slug && data.slug !== existing.slug) {
    const dupe = await db.page.findUnique({ where: { slug: data.slug } });
    if (dupe) return NextResponse.json({ error: 'slug-exists' }, { status: 409 });
  }
  const updated = await db.page.update({
    where: { id },
    data: { ...data, updatedById: user.id }
  });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'page.update', targetType: 'Page', targetId: id, metadata: { slug: updated.slug } }
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  const existing = await db.page.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  await db.page.delete({ where: { id } });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'page.delete', targetType: 'Page', targetId: id, metadata: { slug: existing.slug } }
  });
  return NextResponse.json({ ok: true });
}
