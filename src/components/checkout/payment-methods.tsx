'use client';
import { useEffect, useState } from 'react';

export type MethodId = 'PAYPAL' | 'HITPAY' | 'PAYNOW' | 'STRIPE';

type MethodInfo = { id: MethodId; enabled: boolean };

export function usePaymentMethods() {
  const [methods, setMethods] = useState<MethodInfo[] | null>(null);
  useEffect(() => {
    fetch('/api/checkout/methods')
      .then((r) => r.json())
      .then((d) => setMethods(d.methods ?? []))
      .catch(() => setMethods([]));
  }, []);
  return methods;
}

type Props = {
  methods: MethodInfo[];
  selected: MethodId;
  onSelect: (m: MethodId) => void;
};

const LABEL: Record<MethodId, string> = { PAYPAL: 'PayPal / Card', HITPAY: 'HitPay (Card, GrabPay, Apple Pay)', PAYNOW: 'PayNow (SG)', STRIPE: 'Stripe (Card, Apple Pay, Google Pay)' };

export function PaymentMethodsPicker({ methods, selected, onSelect }: Props) {
  const enabled = methods.filter((m) => m.enabled);
  if (enabled.length <= 1) return null; // no choice to make
  return (
    <div className="card p-3">
      <h3 className="text-sm font-semibold">Payment method</h3>
      <div className="mt-2 grid gap-2">
        {enabled.map((m) => {
          const isSel = selected === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={`flex items-center gap-3 rounded-md border p-3 text-left text-sm ${isSel ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
            >
              <input type="radio" readOnly checked={isSel} className="pointer-events-none" />
              <span className="font-medium">{LABEL[m.id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
