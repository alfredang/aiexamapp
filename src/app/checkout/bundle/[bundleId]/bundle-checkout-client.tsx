'use client';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BillingAddressCard } from '@/components/checkout/billing-address-card';
import { PaymentMethodsPicker, usePaymentMethods, type MethodId } from '@/components/checkout/payment-methods';
import { PayNowModal } from '@/components/checkout/paynow-modal';

export function BundleCheckoutClient({ bundleId, tier }: { bundleId: string; tier?: 'PRACTICE' | 'VOUCHER' }) {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [addressId, setAddressId] = useState<string | null>(null);
  const [method, setMethod] = useState<MethodId>('PAYPAL');
  const [hitpayBusy, setHitpayBusy] = useState(false);
  const [paynowBusy, setPaynowBusy] = useState(false);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [paynowSession, setPaynowSession] = useState<{ orderId: string; qrDataUrl: string; reference: string; amount: number; currency: string } | null>(null);
  const methods = usePaymentMethods();
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb';

  useEffect(() => {
    if (!methods) return;
    const enabled = methods.filter((m) => m.enabled);
    if (enabled.length && !enabled.find((m) => m.id === method)) setMethod(enabled[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods]);

  async function payWithPaynow() {
    setErr(''); setPaynowBusy(true);
    const r = await fetch('/api/paynow/create-order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bundleId, tier, billingAddressId: addressId })
    });
    setPaynowBusy(false);
    if (!r.ok) { setErr('Could not start PayNow checkout.'); return; }
    const d = await r.json();
    setPaynowSession({ orderId: d.orderId, qrDataUrl: d.qrDataUrl, reference: d.reference, amount: d.amount, currency: d.currency });
  }

  async function payWithHitpay() {
    setErr(''); setHitpayBusy(true);
    const r = await fetch('/api/hitpay/create-order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bundleId, tier, billingAddressId: addressId })
    });
    setHitpayBusy(false);
    if (!r.ok) { setErr('Could not start HitPay checkout.'); return; }
    const d = await r.json();
    window.location.href = d.url;
  }

  async function payWithStripe() {
    setErr(''); setStripeBusy(true);
    const r = await fetch('/api/stripe/create-order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bundleId, tier, billingAddressId: addressId })
    });
    setStripeBusy(false);
    if (!r.ok) { setErr('Could not start Stripe checkout.'); return; }
    const d = await r.json();
    window.location.href = d.url;
  }

  return (
    <div className="space-y-4">
      <BillingAddressCard selectedId={addressId} onSelect={setAddressId} />
      {methods && <PaymentMethodsPicker methods={methods} selected={method} onSelect={setMethod} />}
      {!addressId && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Select or add a billing address to continue.
        </p>
      )}
      <div className={addressId ? '' : 'pointer-events-none opacity-50'}>
        {method === 'PAYPAL' && (
          <PayPalScriptProvider options={{ clientId, currency: 'USD', intent: 'capture' }}>
            <PayPalButtons
              style={{ layout: 'vertical', shape: 'rect' }}
              disabled={!addressId}
              createOrder={async () => {
                setErr('');
                const r = await fetch('/api/paypal/create-bundle-order', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ bundleId, tier, billingAddressId: addressId })
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
                const d = await r.json().catch(() => ({}));
                router.push(d?.orderId ? `/checkout/success?orderId=${d.orderId}` : '/checkout/success');
              }}
              onError={() => { setErr('Payment error. Please try again.'); router.push('/checkout/failed'); }}
            />
          </PayPalScriptProvider>
        )}
        {method === 'HITPAY' && (
          <button type="button" disabled={!addressId || hitpayBusy} onClick={payWithHitpay} className="btn-primary-grad w-full">
            {hitpayBusy ? 'Redirecting…' : 'Pay with HitPay'}
          </button>
        )}
        {method === 'PAYNOW' && (
          <button type="button" disabled={!addressId || paynowBusy} onClick={payWithPaynow} className="btn-primary-grad w-full">
            {paynowBusy ? 'Generating QR…' : 'Pay with PayNow'}
          </button>
        )}
        {method === 'STRIPE' && (
          <button type="button" disabled={!addressId || stripeBusy} onClick={payWithStripe} className="btn-primary-grad w-full">
            {stripeBusy ? 'Redirecting…' : 'Pay with Stripe'}
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      {paynowSession && (
        <PayNowModal
          orderId={paynowSession.orderId}
          qrDataUrl={paynowSession.qrDataUrl}
          reference={paynowSession.reference}
          amount={paynowSession.amount}
          currency={paynowSession.currency}
          onClose={() => setPaynowSession(null)}
        />
      )}
    </div>
  );
}
