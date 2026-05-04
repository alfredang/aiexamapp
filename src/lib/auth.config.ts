// Edge-safe NextAuth config. NO argon2, NO Prisma. Middleware imports this.
// The full config in src/lib/auth.ts extends this with the heavy providers.
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true, // required behind reverse proxy (Coolify/Traefik); else NextAuth rejects host
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [], // populated in src/lib/auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) { (token as any).role = (user as any).role; (token as any).uid = (user as any).id; }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = (token as any).uid;
      (session.user as any).role = (token as any).role;
      return session;
    }
  }
};
