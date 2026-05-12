import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Streamed CSV export of the filtered user list. Mirrors the same filters
 * as /admin-dashboard/users so admins get exactly what they see on screen.
 */
export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const sp = new URL(req.url).searchParams;
  const q = (sp.get('q') || '').trim();
  const status = sp.get('status') || '';
  const tagSlug = (sp.get('tag') || '').trim();
  const fromStr = (sp.get('from') || '').trim();
  const toStr = (sp.get('to') || '').trim();

  const where: Prisma.UserWhereInput = { role: 'USER' };
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (status === 'active') where.active = true;
  if (status === 'suspended') where.active = false;
  if (status === 'anonymized') where.anonymizedAt = { not: null };
  if (tagSlug) where.tags = { some: { tag: { slug: tagSlug } } };
  const fromDate = fromStr ? new Date(fromStr) : null;
  const toDate = toStr ? new Date(toStr) : null;
  if (toDate) toDate.setHours(23, 59, 59, 999);
  if ((fromDate && !isNaN(fromDate.getTime())) || (toDate && !isNaN(toDate.getTime()))) {
    where.createdAt = {
      ...(fromDate && !isNaN(fromDate.getTime()) ? { gte: fromDate } : {}),
      ...(toDate && !isNaN(toDate.getTime()) ? { lte: toDate } : {})
    };
  }

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { orders: true, entitlements: true, attempts: true } }
    },
    // We don't paginate the export — admins can refine filters first.
    take: 50_000
  });

  const header = [
    'id',
    'email',
    'name',
    'role',
    'active',
    'anonymizedAt',
    'nationality',
    'tags',
    'orders',
    'entitlements',
    'attempts',
    'joinedAt'
  ];
  const lines = [header.join(',')];
  for (const u of users) {
    lines.push(
      [
        u.id,
        csv(u.email),
        csv(u.name ?? ''),
        u.role,
        u.active ? 'true' : 'false',
        u.anonymizedAt ? u.anonymizedAt.toISOString() : '',
        csv(u.nationality ?? ''),
        csv(u.tags.map((t) => t.tag.slug).join('|')),
        u._count.orders,
        u._count.entitlements,
        u._count.attempts,
        u.createdAt.toISOString()
      ].join(',')
    );
  }
  const body = lines.join('\n');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function csv(v: string): string {
  if (!v) return '';
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
