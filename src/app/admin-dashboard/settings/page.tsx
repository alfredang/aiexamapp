import { redirect } from 'next/navigation';
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
        Click any section to expand. Credentials are stored encrypted in the database and override matching environment variables.
      </p>
      <SettingsForm initial={initial} />
    </div>
  );
}
