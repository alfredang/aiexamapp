'use client';
import { useState } from 'react';

type FieldDef = { key: string; label: string; secret?: boolean; placeholder?: string };

const GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'PayPal',
    fields: [
      { key: 'PAYPAL_ENV', label: 'Environment', placeholder: 'sandbox or live' },
      { key: 'PAYPAL_CLIENT_ID', label: 'Client ID (OAuth)' },
      { key: 'PAYPAL_CLIENT_SECRET', label: 'Client Secret (OAuth)', secret: true },
      { key: 'PAYPAL_WEBHOOK_ID', label: 'Webhook ID', secret: true }
    ]
  },
  {
    title: 'PayNow',
    fields: [
      { key: 'PAYNOW_MERCHANT_ID', label: 'Merchant ID' },
      { key: 'PAYNOW_API_KEY', label: 'API Key', secret: true }
    ]
  },
  {
    title: 'HitPay',
    fields: [
      { key: 'HITPAY_API_KEY', label: 'API Key', secret: true },
      { key: 'HITPAY_SALT', label: 'Salt / Webhook Secret', secret: true }
    ]
  },
  {
    title: 'Claude (Anthropic)',
    fields: [
      { key: 'ANTHROPIC_API_KEY', label: 'API Token / Subscription Key', secret: true }
    ]
  }
];

type Initial = Record<string, { configured: boolean; preview: string }>;

export default function SettingsForm({ initial }: { initial: Initial }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) if (v !== '') payload[k] = v;
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (res.ok) {
      setMsg('Saved.');
      setValues({});
      setTimeout(() => location.reload(), 600);
    } else {
      setMsg('Save failed.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      {GROUPS.map((g) => (
        <div key={g.title} className="card p-4">
          <h2 className="text-lg font-semibold">{g.title}</h2>
          <div className="mt-3 grid gap-3">
            {g.fields.map((f) => {
              const info = initial[f.key];
              const placeholder = info?.configured
                ? f.secret
                  ? `Configured (${info.preview}) — leave blank to keep`
                  : info.preview
                : f.placeholder || '';
              return (
                <label key={f.key} className="block text-sm">
                  <div className="mb-1 flex items-center gap-2 text-slate-600">
                    <span>{f.label}</span>
                    {info?.configured && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                        SET
                      </span>
                    )}
                  </div>
                  <input
                    type={f.secret ? 'password' : 'text'}
                    autoComplete="off"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder={placeholder}
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </form>
  );
}
