import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export async function GET() {
  const [paypal, hitpay, paynow] = await Promise.all([
    getSetting('PAYPAL_ENABLED'),
    getSetting('HITPAY_ENABLED'),
    getSetting('PAYNOW_ENABLED')
  ]);
  // PayPal historically had no enabled flag; treat empty as "on" if a client id
  // is configured so we don't regress existing deployments.
  const paypalClient = await getSetting('PAYPAL_CLIENT_ID');
  const paypalOn = paypal === 'true' || (paypal === '' && !!paypalClient);
  return NextResponse.json({
    methods: [
      { id: 'PAYPAL', enabled: paypalOn },
      { id: 'HITPAY', enabled: hitpay === 'true' },
      { id: 'PAYNOW', enabled: paynow === 'true' }
    ]
  });
}
