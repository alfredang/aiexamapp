import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const url = req.nextUrl;
  const user = (req.auth?.user as any) || null;
  const isAdminPath = url.pathname.startsWith('/admin-dashboard') || url.pathname.startsWith('/api/admin');
  const isPrivate = isAdminPath || url.pathname.startsWith('/user-dashboard');

  if (isPrivate && !user) {
    const login = new URL('/login', url);
    login.searchParams.set('next', url.pathname);
    return NextResponse.redirect(login);
  }
  if (isAdminPath && user.role !== 'ADMIN') return NextResponse.redirect(new URL('/', url));
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin-dashboard/:path*', '/api/admin/:path*', '/user-dashboard/:path*']
};
