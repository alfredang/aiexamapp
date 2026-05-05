'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Tier } from '@prisma/client';

type Option = { tier: Tier; label: string; price: number };

function formatUSD(cents: number) {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function BuyTierForm({
  examId,
  vendorSlug,
  examSlug,
  options,
  isSignedIn
}: {
  examId: string;
  vendorSlug: string;
  examSlug: string;
  options: Option[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Tier>(options[0]?.tier);

  function handleClick() {
    if (!isSignedIn) {
      const next = encodeURIComponent(`/checkout/${examId}?tier=${selected}`);
      router.push(`/login?next=${next}`);
      return;
    }
    router.push(`/checkout/${examId}?tier=${selected}`);
  }

  const showVoucherNotice = options.some(o => o.tier === 'VOUCHER');

  return (
    <div className="card p-5">
      <div className="mb-3 text-xs font-semibold uppercase text-slate-500">Pick a plan</div>
      <div className="space-y-2">
        {options.map(o => (
          <label
            key={o.tier}
            className={`flex cursor-pointer items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm transition ${
              selected === o.tier
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="tier"
                value={o.tier}
                checked={selected === o.tier}
                onChange={() => setSelected(o.tier)}
                className="mt-1"
              />
              <span className="font-semibold text-slate-900">{o.label}</span>
            </div>
            <span className="shrink-0 font-bold text-blue-700">{formatUSD(o.price)}</span>
          </label>
        ))}
      </div>
      {showVoucherNotice && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <b>Heads up:</b> exam vouchers take <b>3–5 business days</b> to deliver — you'll get an email with your code when it's ready. Practice access is unlocked immediately on purchase.
        </p>
      )}
      <button onClick={handleClick} className="btn-primary-grad mt-4 w-full">
        {isSignedIn ? 'Buy now' : 'Sign in to buy'}
      </button>
    </div>
  );
}
