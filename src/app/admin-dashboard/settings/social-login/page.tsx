import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAllSettings, SECRET_KEYS, mask } from '@/lib/settings';
import { PageHeader } from '@/components/admin/page-header';
import SocialLoginForm from './social-login-form';
import { SOCIAL_GOOGLE_FIELDS, SOCIAL_GITHUB_FIELDS, type FieldDef } from '../groups';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function SocialLoginSettingsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');

  const values = await getAllSettings();
  const allFields: FieldDef[] = [...SOCIAL_GOOGLE_FIELDS, ...SOCIAL_GITHUB_FIELDS];
  const initial: Record<string, { configured: boolean; preview: string; current: string }> = {};
  for (const f of allFields) {
    const stored = (values as any)[f.key] || '';
    const isSecret = SECRET_KEYS.has(f.key as any);
    initial[f.key] = {
      configured: !!stored,
      preview: isSecret ? mask(stored) : stored,
      current: stored
    };
  }

  // Compute the base URL the redirect URIs should point at so admins can
  // copy-paste them straight into the provider console.
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '127.0.0.1:3040';
  const callbackBase = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || `${proto}://${host}`;

  return (
    <div>
      <PageHeader
        title="Social Login"
        subtitle="Enable Google and GitHub sign-in. Buttons appear on the login + signup pages only when the provider is enabled and credentials are saved."
      />
      <SocialLoginForm
        initial={initial}
        googleFields={SOCIAL_GOOGLE_FIELDS}
        githubFields={SOCIAL_GITHUB_FIELDS}
        callbackBase={callbackBase}
      />
    </div>
  );
}
