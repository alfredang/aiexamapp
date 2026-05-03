import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export default async function VouchersPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect('/login');
  const ents = await db.entitlement.findMany({
    where: { userId, voucher: { not: null } },
    include: { exam: { include: { vendor: true } } },
    orderBy: { grantedAt: 'desc' }
  });
  return (
    <>
      <h1 className="text-2xl font-bold">My Vouchers</h1>
      <div className="mt-4 card divide-y divide-slate-200">
        {ents.length === 0 && <p className="p-5 text-sm text-slate-500">No vouchers yet.</p>}
        {ents.map(e => (
          <div key={e.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{e.exam.title}</div>
              <div className="text-xs text-slate-500">{e.exam.vendor.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <code className="rounded bg-slate-100 px-3 py-1.5 text-sm">{e.voucher}</code>
              <a href={`/api/vouchers/${e.id}/pdf`} className="btn-outline">Download PDF</a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
