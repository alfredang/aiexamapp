import { NextResponse } from 'next/server';
import { z } from 'zod';
import argon2 from 'argon2';
import { db } from '@/lib/db';
import { verifyOtp } from '@/lib/otp';

const Body = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(['REGISTER', 'RESET', 'TEASER_GATE']),
  newPassword: z.string().min(8).optional(),
  name: z.string().optional()
});

export async function POST(req: Request) {
  const data = Body.parse(await req.json());
  const ok = await verifyOtp(data.email, data.code, data.purpose);
  if (!ok) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });

  const email = data.email.toLowerCase().trim();

  if (data.purpose === 'REGISTER') {
    const passwordHash = data.newPassword ? await argon2.hash(data.newPassword) : null;
    const user = await db.user.upsert({
      where: { email },
      update: { emailVerified: new Date(), name: data.name ?? undefined, ...(passwordHash ? { passwordHash } : {}) },
      create: { email, emailVerified: new Date(), name: data.name, passwordHash }
    });

    // Migrate any guest attempts associated with the gt cookie to this user
    const cookieHeader = req.headers.get('cookie') || '';
    const gt = /(?:^|; )gt=([^;]+)/.exec(cookieHeader)?.[1];
    if (gt) {
      await db.attempt.updateMany({ where: { guestToken: gt, userId: null }, data: { userId: user.id, guestToken: null } });
    }
    return NextResponse.json({ ok: true });
  }

  if (data.purpose === 'RESET') {
    if (!data.newPassword) return NextResponse.json({ error: 'newPassword required' }, { status: 400 });
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'No such user' }, { status: 400 });
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await argon2.hash(data.newPassword) } });
    return NextResponse.json({ ok: true });
  }

  if (data.purpose === 'TEASER_GATE') {
    // Just create or attach the user; teaser gate flow follows up with sign-in via OTP separately
    await db.user.upsert({ where: { email }, update: { emailVerified: new Date() }, create: { email, emailVerified: new Date() } });
    const cookieHeader = req.headers.get('cookie') || '';
    const gt = /(?:^|; )gt=([^;]+)/.exec(cookieHeader)?.[1];
    if (gt) {
      const user = await db.user.findUnique({ where: { email } });
      if (user) await db.attempt.updateMany({ where: { guestToken: gt, userId: null }, data: { userId: user.id, guestToken: null } });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unsupported purpose' }, { status: 400 });
}
