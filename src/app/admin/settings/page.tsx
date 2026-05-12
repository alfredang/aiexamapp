import { getAllSettings, SECRET_KEYS, mask } from '@/lib/settings';
import SettingsForm from './settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const values = await getAllSettings();
  const initial: Record<string, { configured: boolean; preview: string }> = {};
  for (const [k, v] of Object.entries(values)) {
    initial[k] = SECRET_KEYS.has(k as any)
      ? { configured: !!v, preview: mask(v) }
      : { configured: !!v, preview: v };
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Credentials are stored encrypted in the database and override matching environment variables.
      </p>
      <SettingsForm initial={initial} />
    </div>
  );
}
