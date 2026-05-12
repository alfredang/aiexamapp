'use client';
import { useState } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';

type FieldDef = { key: string; label: string; secret?: boolean; placeholder?: string };

const GROUPS: { title: string; fields: FieldDef[]; compact?: boolean; defaultOpen?: boolean }[] = [
  {
    title: 'Company',
    compact: true,
    defaultOpen: true,
    fields: [
      { key: 'COMPANY_NAME', label: 'Company Name', placeholder: 'Tertiary Infotech Academy Pte Ltd' },
      { key: 'COMPANY_SHORT_NAME', label: 'Company Short Name', placeholder: 'Tertiary Infotech Academy' },
      { key: 'COMPANY_UEN', label: 'UEN', placeholder: '201200696W' },
      { key: 'COMPANY_ADDRESS', label: 'Company Address', placeholder: '12 Woodland Square #07-85/86/87 …' },
      { key: 'COMPANY_EMAIL', label: 'Company Email', placeholder: 'enquiry@tertiaryinfotech.com' },
      { key: 'COMPANY_TEL', label: 'Company Tel', placeholder: '61000613' },
      { key: 'COMPANY_WEBSITE', label: 'Company Website', placeholder: 'https://www.tertiarycourses.com.sg/' }
    ]
  },
  {
    title: 'PayPal',
    fields: [
      { key: 'PAYPAL_ENABLED', label: 'Enabled (true/false)', placeholder: 'true' },
      { key: 'PAYPAL_ENV', label: 'Environment', placeholder: 'sandbox or live' },
      { key: 'PAYPAL_CLIENT_ID', label: 'Client ID (OAuth)' },
      { key: 'PAYPAL_CLIENT_SECRET', label: 'Client Secret (OAuth)', secret: true },
      { key: 'PAYPAL_WEBHOOK_ID', label: 'Webhook ID', secret: true }
    ]
  },
  {
    title: 'PayNow',
    fields: [
      { key: 'PAYNOW_ENABLED', label: 'Enabled (true/false)', placeholder: 'true' },
      { key: 'PAYNOW_MERCHANT_ID', label: 'Merchant ID' },
      { key: 'PAYNOW_UEN', label: 'UEN' },
      { key: 'PAYNOW_BANK', label: 'Bank' },
      { key: 'PAYNOW_QR_LOGO_URL', label: 'QR Logo URL' }
    ]
  },
  {
    title: 'HitPay',
    fields: [
      { key: 'HITPAY_ENABLED', label: 'Enabled (true/false)', placeholder: 'true' },
      { key: 'HITPAY_ENV', label: 'Environment', placeholder: 'sandbox or live' },
      { key: 'HITPAY_API_KEY', label: 'API Key', secret: true },
      { key: 'HITPAY_SALT', label: 'Salt / Webhook Secret', secret: true }
    ]
  },
  {
    title: 'Fulfillment & Branding',
    fields: [
      { key: 'VOUCHER_DELAY_DAYS', label: 'Voucher delay (days)', placeholder: '5' },
      { key: 'FULFILLMENT_TIMEZONE', label: 'Fulfillment timezone', placeholder: 'Asia/Singapore' },
      { key: 'WORKER_SHARED_SECRET', label: 'Worker shared secret', secret: true },
      { key: 'BRAND_NAME', label: 'Brand name (emails)' },
      { key: 'BRAND_LOGO_URL', label: 'Brand logo URL' },
      { key: 'BRAND_PRIMARY_COLOR', label: 'Brand primary color', placeholder: '#2563eb' },
      { key: 'BRAND_SUPPORT_EMAIL', label: 'Brand support email' }
    ]
  },
  {
    title: 'Claude (Anthropic)',
    fields: [{ key: 'ANTHROPIC_API_KEY', label: 'API Token / Subscription Key', secret: true }]
  }
];

type Initial = Record<string, { configured: boolean; preview: string; current: string }>;

export default function SettingsForm({ initial }: { initial: Initial }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.title, !!g.defaultOpen]))
  );

  function toggleGroup(title: string) {
    setOpenGroups((s) => ({ ...s, [title]: !s[title] }));
  }

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
      {GROUPS.map((g) => {
        const isOpen = !!openGroups[g.title];
        return (
        <div key={g.title} className="card p-4">
          <button
            type="button"
            onClick={() => toggleGroup(g.title)}
            className="flex w-full items-center justify-between text-left"
            aria-expanded={isOpen}
          >
            <h2 className="text-lg font-semibold">{g.title}</h2>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isOpen && (
          <div className={`mt-3 grid gap-3 ${g.compact ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
            {g.fields.map((f) => {
              const info = initial[f.key];
              const touched = values[f.key] !== undefined;
              const isRevealed = !!revealed[f.key];
              const hasStored = !!info?.configured;

              // Display logic:
              //  - Non-secret: prefill with current value, editable directly.
              //  - Secret + stored + not revealed + untouched: show masked preview.
              //  - Secret + stored + revealed + untouched: show plaintext.
              //  - Otherwise: show whatever the user has typed (or empty).
              const displayValue = touched
                ? values[f.key]
                : f.secret
                ? hasStored
                  ? isRevealed
                    ? info!.current
                    : info!.preview
                  : ''
                : info?.current ?? '';

              const placeholder = !hasStored ? f.placeholder || '' : '';

              return (
                <div key={f.key} className="text-sm">
                  <div className="mb-1 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span>{f.label}</span>
                    {hasStored && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        SET
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={f.secret && touched && !isRevealed ? 'password' : 'text'}
                      autoComplete="off"
                      className={`w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 ${
                        f.secret ? 'pr-10' : ''
                      } ${!touched && f.secret && hasStored && !isRevealed ? 'font-mono tracking-wider' : ''}`}
                      placeholder={placeholder}
                      value={displayValue}
                      onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                    />
                    {f.secret && hasStored && (
                      <button
                        type="button"
                        onClick={() => setRevealed((s) => ({ ...s, [f.key]: !s[f.key] }))}
                        aria-label={isRevealed ? 'Hide value' : 'Reveal value'}
                        title={isRevealed ? 'Hide value' : 'Reveal value'}
                        className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  {f.secret && hasStored && !touched && (
                    <p className="mt-1 text-xs text-slate-500">
                      {isRevealed
                        ? 'Showing stored value. Type to replace.'
                        : 'Click the eye to reveal. Type to replace.'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
        );
      })}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </form>
  );
}
