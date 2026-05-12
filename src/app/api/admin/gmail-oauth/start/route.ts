import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

function callbackUrl(req: Request): string {
  const u = new URL(req.url);
  // Honor X-Forwarded-Host / NEXTAUTH_URL when set so the URL matches the
  // OAuth client's registered redirect URI.
  const base = process.env.NEXTAUTH_URL || `${u.protocol}//${u.host}`;
  return `${base.replace(/\/$/, '')}/api/admin/gmail-oauth/callback`;
}

export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const clientId = await getSetting('GMAIL_OAUTH_CLIENT_ID');
  if (!clientId) {
    return NextResponse.redirect(
      new URL('/admin-dashboard/settings/email?error=missing_client_id', req.url)
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(req),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true'
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
