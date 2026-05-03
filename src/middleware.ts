import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const url = req.nextUrl;
  const user = (req.auth?.user as any) || null;
  const isAdminPath = url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin');
  const isPrivate = isAdminPath || url.pathname.startsWith('/my-content');

  if (isPrivate && !user) {
    const login = new URL('/login', url);
    login.searchParams.set('next', url.pathname);
    return NextResponse.redirect(login);
  }
  if (isAdminPath && user.role !== 'ADMIN') return NextResponse.redirect(new URL('/', url));
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/my-content/:path*']
};
