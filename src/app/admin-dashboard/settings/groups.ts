export type FieldDef = { key: string; label: string; secret?: boolean; placeholder?: string };

export type SettingsGroup = {
  slug: string; // route slug under /admin-dashboard/settings/<slug>
  title: string;
  description?: string;
  compact?: boolean; // 3-col grid when true (used for short labelled fields)
  fields: FieldDef[];
};

// PayPal, HitPay, PayNow sub-groups shown as collapsible cards on the
// Payment Setting page. Each group bundles enabled toggle, environment,
// merchant identifiers AND the corresponding secrets so admins manage
// one provider at a time without bouncing across pages.
export const PAYMENT_SUBGROUPS: SettingsGroup[] = [
  {
    slug: 'paypal',
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
    slug: 'hitpay',
    title: 'HitPay',
    fields: [
      { key: 'HITPAY_ENABLED', label: 'Enabled (true/false)', placeholder: 'true' },
      { key: 'HITPAY_ENV', label: 'Environment', placeholder: 'sandbox or live' },
      { key: 'HITPAY_API_KEY', label: 'API Key', secret: true },
      { key: 'HITPAY_SALT', label: 'Salt / Webhook Secret', secret: true }
    ]
  },
  {
    slug: 'paynow',
    title: 'PayNow',
    fields: [
      { key: 'PAYNOW_ENABLED', label: 'Enabled (true/false)', placeholder: 'true' },
      { key: 'PAYNOW_MERCHANT_ID', label: 'Merchant ID' },
      { key: 'PAYNOW_UEN', label: 'UEN' },
      { key: 'PAYNOW_BANK', label: 'Bank' },
      { key: 'PAYNOW_QR_LOGO_URL', label: 'QR Logo URL' }
    ]
  }
];

// Fulfillment fields appear on the Payment Setting page above the
// three provider sub-groups — they apply to all providers.
export const PAYMENT_FULFILLMENT_FIELDS: FieldDef[] = [
  { key: 'VOUCHER_DELAY_DAYS', label: 'Voucher delay (days)', placeholder: '5' },
  { key: 'FULFILLMENT_TIMEZONE', label: 'Fulfillment timezone', placeholder: 'Asia/Singapore' }
];

export const GROUPS: SettingsGroup[] = [
  {
    slug: 'company',
    title: 'Company Info',
    description: 'Legal entity details used on invoices, vouchers, and emails.',
    compact: true,
    fields: [
      { key: 'COMPANY_NAME', label: 'Company Name', placeholder: 'Tertiary Infotech Academy Pte Ltd' },
      { key: 'COMPANY_SHORT_NAME', label: 'Company Short Name', placeholder: 'Tertiary Infotech Academy' },
      { key: 'COMPANY_UEN', label: 'UEN', placeholder: '201200696W' },
      { key: 'COMPANY_ADDRESS', label: 'Company Address', placeholder: '12 Woodland Square …' },
      { key: 'COMPANY_EMAIL', label: 'Company Email', placeholder: 'enquiry@tertiaryinfotech.com' },
      { key: 'COMPANY_TEL', label: 'Company Tel', placeholder: '61000613' },
      { key: 'COMPANY_WEBSITE', label: 'Company Website', placeholder: 'https://...' }
    ]
  },
  {
    slug: 'branding',
    title: 'Branding',
    description: 'Logo, colour and support email shown in the email templates and customer touchpoints.',
    compact: true,
    fields: [
      { key: 'BRAND_NAME', label: 'Brand name (emails)', placeholder: 'ExamNova' },
      { key: 'BRAND_LOGO_URL', label: 'Brand logo URL' },
      { key: 'BRAND_PRIMARY_COLOR', label: 'Brand primary color', placeholder: '#2563eb' },
      { key: 'BRAND_SUPPORT_EMAIL', label: 'Brand support email' }
    ]
  },
  {
    slug: 'credentials',
    title: 'Credentials',
    description: 'Non-payment API keys and worker secrets. Payment provider credentials live under Payment Setting.',
    fields: [
      { key: 'ANTHROPIC_API_KEY', label: 'Claude (Anthropic) — API Key', secret: true },
      { key: 'WORKER_SHARED_SECRET', label: 'Cron worker — shared secret', secret: true }
    ]
  }
];

export function getGroup(slug: string): SettingsGroup | undefined {
  return GROUPS.find((g) => g.slug === slug);
}
