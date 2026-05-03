import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import argon2 from 'argon2';
import { db } from './db';
import { verifyOtp } from './otp';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      id: 'password',
      name: 'Email + Password',
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email || '').toLowerCase().trim();
        const password = String(creds?.password || '');
        if (!email || !password) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.emailVerified || !user.passwordHash) return null;
        const ok = await argon2.verify(user.passwordHash, password);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role } as any;
      }
    }),
    Credentials({
      id: 'otp',
      name: 'Email + OTP',
      credentials: { email: {}, code: {} },
      async authorize(creds) {
        const email = String(creds?.email || '').toLowerCase().trim();
        const code = String(creds?.code || '');
        if (!email || !code) return null;
        const ok = await verifyOtp(email, code, 'LOGIN');
        if (!ok) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;
        if (!user.emailVerified) await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
        return { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role } as any;
      }
    })
  ]
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Response('Unauthorized', { status: 401 });
  return session.user as { id: string; email: string; role: 'USER' | 'ADMIN' };
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== 'ADMIN') throw new Response('Forbidden', { status: 403 });
  return u;
}
