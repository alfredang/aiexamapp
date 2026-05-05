import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendVoucherDeliveredEmail } from '@/lib/mail';
import { renderVoucherPdf } from '@/lib/voucher-pdf';

async function issueVoucher(formData: FormData) {
  'use server';
  const entitlementId = String(formData.get('entitlementId') || '');
  const voucher = String(formData.get('voucher') || '').trim();
  if (!entitlementId || !voucher) return;

  // Fetch entitlement + user + exam (with vendor) so we can email + render PDF.
  const ent = await db.entitlement.findUnique({
    where: { id: entitlementId },
    include: { user: true, exam: { include: { vendor: true } } }
  });
  if (!ent || ent.tier !== 'VOUCHER' || ent.voucher) return;

  // Check uniqueness — the `voucher` column has a @unique constraint.
  const existing = await db.entitlement.findFirst({ where: { voucher } });
  if (existing) return; // silent reject — admin should pick a non-collision code

  await db.entitlement.update({
    where: { id: entitlementId },
    data: { voucher }
  });

  // Render PDF + email — best-effort, non-fatal on either.
  let pdf: Buffer | undefined;
  try {
    pdf = await renderVoucherPdf({
      examTitle: ent.exam.title,
      examCode: ent.exam.code,
      vendor: ent.exam.vendor.name,
      voucherCode: voucher,
      buyerName: ent.user.name,
      buyerEmail: ent.user.email
    });
  } catch { /* non-fatal */ }
  await sendVoucherDeliveredEmail(ent.user.email, ent.exam.title, voucher, pdf).catch(() => {});

  revalidatePath('/admin/vouchers');
}

export default async function AdminVouchersPage() {
  const pending = await db.entitlement.findMany({
    where: { tier: 'VOUCHER', voucher: null },
    include: { user: true, exam: { include: { vendor: true } } },
    orderBy: { grantedAt: 'asc' },
    take: 100
  });
  const recentlyIssued = await db.entitlement.findMany({
    where: { tier: 'VOUCHER', voucher: { not: null } },
    include: { user: true, exam: { include: { vendor: true } } },
    orderBy: { grantedAt: 'desc' },
    take: 20
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Vouchers</h1>
      <p className="mt-1 text-sm text-slate-600">
        Issue real exam voucher codes to learners who bought the Voucher tier. Codes are emailed to the learner once you save.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Pending issuance ({pending.length})</h2>
      <div className="mt-2 card divide-y divide-slate-200">
        {pending.length === 0 && <p className="p-5 text-sm text-slate-500">No pending vouchers.</p>}
        {pending.map(e => (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="font-medium">{e.user.email}</div>
              <div className="text-xs text-slate-500">
                {e.exam.vendor.name} · <b>{e.exam.code}</b> — {e.exam.title}
                <span className="mx-2 text-slate-400">·</span>
                granted {e.grantedAt.toLocaleString()}
              </div>
            </div>
            <form action={issueVoucher} className="flex items-center gap-2">
              <input type="hidden" name="entitlementId" value={e.id} />
              <input
                type="text"
                name="voucher"
                placeholder="Enter voucher code"
                required
                className="input w-64"
              />
              <button className="btn-primary-grad whitespace-nowrap" type="submit">Issue</button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Recently issued (last 20)</h2>
      <div className="mt-2 card divide-y divide-slate-200">
        {recentlyIssued.length === 0 && <p className="p-5 text-sm text-slate-500">No vouchers issued yet.</p>}
        {recentlyIssued.map(e => (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="font-medium">{e.user.email}</div>
              <div className="text-xs text-slate-500">
                {e.exam.vendor.name} · <b>{e.exam.code}</b> — {e.exam.title}
              </div>
            </div>
            <code className="rounded bg-slate-100 px-3 py-1.5 text-sm">{e.voucher}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
