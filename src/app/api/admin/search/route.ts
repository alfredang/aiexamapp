import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ hits: [] }, { status: 403 });
  }
  const q = (new URL(req.url).searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ hits: [] });

  const PER = 5;
  const [orders, users, exams, entitlements] = await Promise.all([
    db.order.findMany({
      where: {
        OR: [
          { id: { contains: q } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { user: { name: { contains: q, mode: 'insensitive' } } }
        ]
      },
      include: { user: { select: { email: true, name: true } } },
      take: PER,
      orderBy: { createdAt: 'desc' }
    }),
    db.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: PER,
      orderBy: { createdAt: 'desc' }
    }),
    db.exam.findMany({
      where: {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: { vendor: { select: { name: true } } },
      take: PER,
      orderBy: { title: 'asc' }
    }),
    db.entitlement.findMany({
      where: { voucher: { contains: q, mode: 'insensitive' } },
      include: {
        user: { select: { email: true } },
        exam: { select: { code: true, title: true } }
      },
      take: PER,
      orderBy: { grantedAt: 'desc' }
    })
  ]);

  const hits = [
    ...orders.map((o) => ({
      kind: 'order' as const,
      id: o.id,
      title: `${o.id.slice(0, 10)} · ${o.user.email}`,
      subtitle: `${o.status} · ${o.provider}`,
      href: `/admin-dashboard/orders/${o.id}`
    })),
    ...users.map((u) => ({
      kind: 'user' as const,
      id: u.id,
      title: u.name || u.email,
      subtitle: u.name ? u.email : undefined,
      href: `/admin-dashboard/users/${u.id}`
    })),
    ...exams.map((e) => ({
      kind: 'exam' as const,
      id: e.id,
      title: `${e.code} — ${e.title}`,
      subtitle: e.vendor.name,
      href: `/admin-dashboard/exams/${e.id}`
    })),
    ...entitlements.map((e) => ({
      kind: 'voucher' as const,
      id: e.id,
      title: e.voucher!,
      subtitle: `${e.exam.code} · ${e.user.email}`,
      href: `/admin-dashboard/vouchers`
    }))
  ];

  return NextResponse.json({ hits });
}
