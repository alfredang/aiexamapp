import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSetting, setSetting } from '@/lib/settings';
import { getPublicOrigin, publicUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

function callbackUrl(req: Request): string {
  return `${getPublicOrigin(req)}/api/admin/gmail-oauth/callback`;
}

function back(req: Request, params: Record<string, string>): NextResponse {
  const target = publicUrl(req, '/admin-dashboard/settings/email');
  for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
  return NextResponse.redirect(target);
}

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error) return back(req, { error });
  if (!code) return back(req, { error: 'missing_code' });

  const clientId = await getSetting('GMAIL_OAUTH_CLIENT_ID');
  const clientSecret = await getSetting('GMAIL_OAUTH_CLIENT_SECRET');
  if (!clientId || !clientSecret) return back(req, { error: 'missing_client_credentials' });

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl(req),
    grant_type: 'authorization_code'
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const tokenJson = (await tokenRes.json()) as {
    refresh_token?: string;
    access_token?: string;
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenJson.refresh_token) {
    return back(req, {
      error: tokenJson.error_description || tokenJson.error || 'token_exchange_failed'
    });
  }

  // Fetch the sender's primary Gmail address so we can persist it.
  let senderEmail = '';
  if (tokenJson.access_token) {
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as { emailAddress?: string };
      senderEmail = profile.emailAddress || '';
    }
  }

  await setSetting('GMAIL_OAUTH_REFRESH_TOKEN', tokenJson.refresh_token);
  if (senderEmail) await setSetting('GMAIL_OAUTH_SENDER_EMAIL', senderEmail);
  await setSetting('EMAIL_TRANSPORT', 'GMAIL_OAUTH');

  await db.adminLog.create({
    data: {
      adminId: user.id,
      action: 'email.gmail.connect',
      targetType: 'Setting',
      targetId: 'GMAIL_OAUTH',
      metadata: { senderEmail }
    }
  });

  return back(req, { connected: '1' });
}
