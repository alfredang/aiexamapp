const BASE = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function token() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store'
  });
  if (!r.ok) throw new Error(`PayPal token failed: ${r.status}`);
  return (await r.json()).access_token as string;
}

export async function createOrder(amountCents: number, currency: string, refId: string) {
  const t = await token();
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: refId,
        amount: { currency_code: currency, value: (amountCents / 100).toFixed(2) }
      }]
    })
  });
  if (!r.ok) throw new Error(`PayPal createOrder failed: ${r.status}`);
  return r.json() as Promise<{ id: string; status: string }>;
}

export async function captureOrder(orderId: string) {
  const t = await token();
  const r = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
  });
  if (!r.ok) throw new Error(`PayPal capture failed: ${r.status}`);
  return r.json();
}

export async function refundCapture(captureId: string, amountCents?: number, currency = 'USD', reason?: string) {
  const t = await token();
  const body: any = {};
  if (amountCents !== undefined) {
    body.amount = { value: (amountCents / 100).toFixed(2), currency_code: currency };
  }
  if (reason) body.note_to_payer = reason.slice(0, 255);
  const r = await fetch(`${BASE}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `refund-${captureId}-${Date.now()}`
    },
    body: JSON.stringify(body)
  });
  const json: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`PayPal refund failed: ${r.status} ${json?.message ?? ''}`);
  return json as { id: string; status: string };
}

export async function verifyWebhook(headers: Headers, body: string) {
  const t = await token();
  const r = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body)
    })
  });
  if (!r.ok) return false;
  const j = await r.json();
  return j.verification_status === 'SUCCESS';
}
