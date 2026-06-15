import { NextResponse } from 'next/server';
import argon2 from 'argon2';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Role } from '@prisma/client';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint to create/upsert Mohan (mohanpothula@gmail.com)
 * as an ADMIN user in the current database. Idempotent — safe to call
 * repeatedly. Mirrors prisma/seeds/create-mohan.ts for production, where
 * there is no shell access to run the script directly.
 *
 * Password login works (default `password123`, override via MOHAN_PASSWORD)
 * and Google sign-in links to this record by email
 * (allowDangerousEmailAccountLinking), preserving the ADMIN role either way.
 */
export async function POST() {
  const session = await auth();
  const admin = session?.user as { id?: string; role?: string } | undefined;
  if (admin?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const email = 'mohanpothula@gmail.com';
  const name = 'Mohan';
  const password = process.env.MOHAN_PASSWORD || 'password123';
  const passwordHash = await argon2.hash(password);

  const user = await db.user.upsert({
    where: { email },
    update: { name, role: Role.ADMIN, emailVerified: new Date(), passwordHash },
    create: { email, name, passwordHash, role: Role.ADMIN, emailVerified: new Date() }
  });

  await db.adminLog.create({
    data: {
      adminId: admin.id!,
      action: 'seed.admin-mohan',
      targetType: 'User',
      targetId: user.id,
      metadata: { email: user.email, role: user.role }
    }
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
}
