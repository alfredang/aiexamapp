export type FieldDef = { key: string; label: string; secret?: boolean; placeholder?: string };

export type SettingsGroup = {
  slug: string; // route slug under /admin-dashboard/settings/<slug>
  title: string;
  description?: string;
  compact?: boolean; // 3-col grid when true (used for short labelled fields)
  fields: FieldDef[];
};

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
    slug: 'payment',
    title: 'Payment Setting',
    description: 'Enable/disable providers and configure non-secret payment options.',
    fields: [
      { key: 'PAYPAL_ENABLED', label: 'PayPal — Enabled (true/false)', placeholder: 'true' },
      { key: 'PAYPAL_ENV', label: 'PayPal — Environment', placeholder: 'sandbox or live' },
      { key: 'HITPAY_ENABLED', label: 'HitPay — Enabled (true/false)', placeholder: 'true' },
      { key: 'HITPAY_ENV', label: 'HitPay — Environment', placeholder: 'sandbox or live' },
      { key: 'PAYNOW_ENABLED', label: 'PayNow — Enabled (true/false)', placeholder: 'true' },
      { key: 'PAYNOW_MERCHANT_ID', label: 'PayNow — Merchant ID' },
      { key: 'PAYNOW_UEN', label: 'PayNow — UEN' },
      { key: 'PAYNOW_BANK', label: 'PayNow — Bank' },
      { key: 'PAYNOW_QR_LOGO_URL', label: 'PayNow — QR Logo URL' },
      { key: 'VOUCHER_DELAY_DAYS', label: 'Voucher delay (days)', placeholder: '5' },
      { key: 'FULFILLMENT_TIMEZONE', label: 'Fulfillment timezone', placeholder: 'Asia/Singapore' }
    ]
  },
  {
    slug: 'credentials',
    title: 'Credentials',
    description: 'API keys, webhook secrets and other sensitive credentials. Stored encrypted in the database.',
    fields: [
      { key: 'PAYPAL_CLIENT_ID', label: 'PayPal — Client ID (OAuth)' },
      { key: 'PAYPAL_CLIENT_SECRET', label: 'PayPal — Client Secret (OAuth)', secret: true },
      { key: 'PAYPAL_WEBHOOK_ID', label: 'PayPal — Webhook ID', secret: true },
      { key: 'HITPAY_API_KEY', label: 'HitPay — API Key', secret: true },
      { key: 'HITPAY_SALT', label: 'HitPay — Salt / Webhook Secret', secret: true },
      { key: 'ANTHROPIC_API_KEY', label: 'Claude (Anthropic) — API Key', secret: true },
      { key: 'WORKER_SHARED_SECRET', label: 'Cron worker — shared secret', secret: true }
    ]
  }
];

export function getGroup(slug: string): SettingsGroup | undefined {
  return GROUPS.find((g) => g.slug === slug);
}
