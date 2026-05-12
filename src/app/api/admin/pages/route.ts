import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const Body = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers, dashes only'),
  title: z.string().min(1).max(200),
  bodyHtml: z.string().default(''),
  excerpt: z.string().max(300).optional().nullable(),
  published: z.boolean().optional(),
  showInFooter: z.boolean().optional(),
  footerGroup: z.enum(['legal', 'company']).optional().nullable(),
  position: z.number().int().optional()
});

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const items = await db.page.findMany({ orderBy: [{ footerGroup: 'asc' }, { position: 'asc' }, { title: 'asc' }] });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad-request', issues: parsed.error.issues }, { status: 400 });
  const data = parsed.data;
  const dupe = await db.page.findUnique({ where: { slug: data.slug } });
  if (dupe) return NextResponse.json({ error: 'slug-exists' }, { status: 409 });
  const created = await db.page.create({
    data: {
      slug: data.slug,
      title: data.title,
      bodyHtml: data.bodyHtml,
      excerpt: data.excerpt ?? null,
      published: data.published ?? true,
      showInFooter: data.showInFooter ?? false,
      footerGroup: data.footerGroup ?? null,
      position: data.position ?? 0,
      updatedById: user.id
    }
  });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'page.create', targetType: 'Page', targetId: created.id, metadata: { slug: created.slug } }
  });
  return NextResponse.json({ item: created }, { status: 201 });
}
