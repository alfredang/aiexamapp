import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBody = z.object({
  authorName: z.string().min(1).max(120),
  authorTitle: z.string().max(160).optional().or(z.literal('')),
  avatarUrl: z.string().max(500).optional().or(z.literal('')),
  quote: z.string().min(1).max(800),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  examId: z.string().optional().or(z.literal('')),
  published: z.boolean().default(false),
  sortOrder: z.number().int().default(0)
});

export async function GET() {
  const session = await auth();
  if (!isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const items = await db.testimonial.findMany({
    where: { deletedAt: null },
    orderBy: [{ published: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { exam: { select: { code: true, title: true } } }
  });
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const session = await auth();
  const adminId = (session?.user as any)?.id as string | undefined;
  if (!adminId || !isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const raw = CreateBody.parse(await req.json());
  const item = await db.testimonial.create({
    data: {
      authorName: raw.authorName,
      authorTitle: raw.authorTitle?.trim() || null,
      avatarUrl: raw.avatarUrl?.trim() || null,
      quote: raw.quote,
      rating: raw.rating ?? null,
      examId: raw.examId?.trim() || null,
      published: raw.published,
      sortOrder: raw.sortOrder
    }
  });
  await db.adminLog.create({
    data: { adminId, action: 'testimonial.create', targetType: 'Testimonial', targetId: item.id }
  });
  return NextResponse.json({ ok: true, item });
}
