'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProcessingClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const orderId = sp.get('orderId');
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!orderId) { router.replace('/checkout/failed'); return; }
    let active = true;
    const poll = async () => {
      try {
        const r = await fetch(`/api/orders/${orderId}/status`, { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        if (!active) return;
        if (d.status === 'PAID') router.replace(`/checkout/success?orderId=${orderId}`);
        else if (d.status === 'FAILED') router.replace('/checkout/failed');
      } catch { /* ignore */ }
    };
    poll();
    const t = setInterval(() => { setTries((n) => n + 1); void poll(); }, 3000);
    return () => { active = false; clearInterval(t); };
  }, [orderId, router]);

  return (
    <p className="mt-6 text-xs text-slate-400">Checking… ({tries})</p>
  );
}
