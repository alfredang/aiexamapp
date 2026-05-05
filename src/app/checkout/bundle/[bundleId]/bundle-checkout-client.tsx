'use client';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function BundleCheckoutClient({ bundleId }: { bundleId: string }) {
  const router = useRouter();
  const [err, setErr] = useState('');
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb';

  return (
    <PayPalScriptProvider options={{ clientId, currency: 'USD', intent: 'capture' }}>
      <PayPalButtons
        style={{ layout: 'vertical', shape: 'rect' }}
        createOrder={async () => {
          setErr('');
          const r = await fetch('/api/paypal/create-bundle-order', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ bundleId })
          });
          if (!r.ok) { setErr('Could not create order.'); throw new Error('create-bundle-order failed'); }
          return (await r.json()).paypalOrderId;
        }}
        onApprove={async (data) => {
          const r = await fetch('/api/paypal/capture', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ paypalOrderId: data.orderID })
          });
          if (!r.ok) { setErr('Capture failed.'); router.push('/checkout/failed'); return; }
          router.push('/checkout/success');
        }}
        onError={() => { setErr('Payment error. Please try again.'); router.push('/checkout/failed'); }}
      />
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </PayPalScriptProvider>
  );
}
