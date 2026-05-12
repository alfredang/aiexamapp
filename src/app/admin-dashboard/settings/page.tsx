import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Mail, FileText } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getAllSettings, SECRET_KEYS, mask } from '@/lib/settings';
import SettingsForm from './settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  // Hard gate — the page below leaks plaintext secrets to the client on reveal.
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');

  const values = await getAllSettings();
  const initial: Record<string, { configured: boolean; preview: string; current: string }> = {};
  for (const [k, v] of Object.entries(values)) {
    const isSecret = SECRET_KEYS.has(k as any);
    initial[k] = {
      configured: !!v,
      preview: isSecret ? mask(v) : v,
      current: v
    };
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Credentials are stored encrypted in the database and override matching environment variables.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin-dashboard/settings/email-templates"
          className="card flex items-start gap-3 p-4 hover:border-blue-400 hover:shadow-sm"
        >
          <Mail className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <div className="font-medium">Email Templates</div>
            <div className="text-xs text-slate-500">Order confirmation, voucher delivery, OTP, password reset.</div>
          </div>
        </Link>
        <Link
          href="/admin-dashboard/pages"
          className="card flex items-start gap-3 p-4 hover:border-blue-400 hover:shadow-sm"
        >
          <FileText className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <div className="font-medium">Pages</div>
            <div className="text-xs text-slate-500">Terms, Privacy, Refund, FAQ, How it works — anything the footer links to.</div>
          </div>
        </Link>
      </div>
      <SettingsForm initial={initial} />
    </div>
  );
}
