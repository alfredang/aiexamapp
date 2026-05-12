import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendVoucherDeliveredEmail } from '@/lib/mail';
import { renderVoucherPdf } from '@/lib/voucher-pdf';

async function deliverVoucher(opts: {
  userEmail: string;
  userName: string | null;
  examTitle: string;
  examCode: string;
  vendorName: string;
  voucher: string;
}) {
  let pdf: Buffer | undefined;
  try {
    pdf = await renderVoucherPdf({
      examTitle: opts.examTitle,
      examCode: opts.examCode,
      vendor: opts.vendorName,
      voucherCode: opts.voucher,
      buyerName: opts.userName,
      buyerEmail: opts.userEmail
    });
  } catch { /* non-fatal */ }
  await sendVoucherDeliveredEmail(opts.userEmail, opts.examTitle, opts.voucher, pdf).catch(() => {});
}

async function issueExistingVoucher(formData: FormData) {
  'use server';
  const entitlementId = String(formData.get('entitlementId') || '');
  const voucher = String(formData.get('voucher') || '').trim();
  if (!entitlementId || !voucher) return;

  const ent = await db.entitlement.findUnique({
    where: { id: entitlementId },
    include: { user: true, exam: { include: { vendor: true } } }
  });
  if (!ent || ent.tier !== 'VOUCHER' || ent.voucher) return;

  const collision = await db.entitlement.findFirst({ where: { voucher } });
  if (collision) return;

  await db.entitlement.update({ where: { id: entitlementId }, data: { voucher } });
  await deliverVoucher({
    userEmail: ent.user.email,
    userName: ent.user.name,
    examTitle: ent.exam.title,
    examCode: ent.exam.code,
    vendorName: ent.exam.vendor.name,
    voucher
  });

  revalidatePath('/admin-dashboard/vouchers');
}

async function grantVoucherToUser(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const examId = String(formData.get('examId') || '');
  const voucher = String(formData.get('voucher') || '').trim();
  if (!email || !examId || !voucher) return;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return;

  const exam = await db.exam.findUnique({ where: { id: examId }, include: { vendor: true } });
  if (!exam) return;

  const collision = await db.entitlement.findFirst({ where: { voucher } });
  if (collision) return;

  await db.entitlement.upsert({
    where: { userId_examId_tier: { userId: user.id, examId, tier: 'VOUCHER' } },
    create: { userId: user.id, examId, tier: 'VOUCHER', voucher },
    update: { voucher }
  });

  await deliverVoucher({
    userEmail: user.email,
    userName: user.name,
    examTitle: exam.title,
    examCode: exam.code,
    vendorName: exam.vendor.name,
    voucher
  });

  revalidatePath('/admin-dashboard/vouchers');
}

type SearchParams = Promise<{ q?: string; vendorId?: string; examId?: string }>;

export default async function AdminVouchersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const vendorId = sp.vendorId || '';
  const examId = sp.examId || '';

  const [vendors, exams] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: 'asc' } }),
    db.exam.findMany({
      where: vendorId ? { vendorId } : undefined,
      orderBy: [{ vendor: { name: 'asc' } }, { code: 'asc' }],
      include: { vendor: true }
    })
  ]);

  const baseWhere: any = { tier: 'VOUCHER' };
  if (examId) baseWhere.examId = examId;
  else if (vendorId) baseWhere.exam = { vendorId };
  if (q) baseWhere.user = { email: { contains: q, mode: 'insensitive' } };

  const [pending, recentlyIssued] = await Promise.all([
    db.entitlement.findMany({
      where: { ...baseWhere, voucher: null },
      include: { user: true, exam: { include: { vendor: true } } },
      orderBy: { grantedAt: 'asc' },
      take: 100
    }),
    db.entitlement.findMany({
      where: { ...baseWhere, voucher: { not: null } },
      include: { user: true, exam: { include: { vendor: true } } },
      orderBy: { grantedAt: 'desc' },
      take: 20
    })
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Voucher Management</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Issue real exam voucher codes. Codes are emailed to the learner once you save.
      </p>

      {/* Grant new voucher */}
      <section className="card mt-6 p-4">
        <h2 className="text-lg font-semibold">Add voucher to a user</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Grants a VOUCHER entitlement to the user for the selected exam.
        </p>
        <form action={grantVoucherToUser} className="mt-3 grid gap-3 sm:grid-cols-4">
          <input
            name="email"
            type="email"
            required
            placeholder="user@example.com"
            className="input sm:col-span-2"
          />
          <select name="examId" required defaultValue="" className="input">
            <option value="" disabled>Select exam…</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.vendor.name} · {e.code} — {e.title}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              name="voucher"
              type="text"
              required
              placeholder="Voucher code"
              className="input flex-1"
            />
            <button type="submit" className="btn-primary-grad whitespace-nowrap">Add</button>
          </div>
        </form>
      </section>

      {/* Filters */}
      <section className="card mt-6 p-4">
        <h2 className="text-base font-semibold">Filters</h2>
        <form method="get" className="mt-3 grid gap-3 sm:grid-cols-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search user email…"
            className="input sm:col-span-2"
          />
          <select name="vendorId" defaultValue={vendorId} className="input">
            <option value="">All vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <select name="examId" defaultValue={examId} className="input">
            <option value="">All exams</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>{e.code} — {e.title}</option>
            ))}
          </select>
          <div className="sm:col-span-4 flex gap-2">
            <button type="submit" className="btn-primary">Apply</button>
            <a href="/admin-dashboard/vouchers" className="btn-ghost">Reset</a>
          </div>
        </form>
      </section>

      <h2 className="mt-8 text-lg font-semibold">Pending issuance ({pending.length})</h2>
      <div className="mt-2 card divide-y divide-slate-200 dark:divide-slate-800">
        {pending.length === 0 && <p className="p-5 text-sm text-slate-500">No pending vouchers.</p>}
        {pending.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="font-medium">{e.user.email}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {e.exam.vendor.name} · <b>{e.exam.code}</b> — {e.exam.title}
                <span className="mx-2 text-slate-400">·</span>
                granted {e.grantedAt.toLocaleString()}
              </div>
            </div>
            <form action={issueExistingVoucher} className="flex items-center gap-2">
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
      <div className="mt-2 card divide-y divide-slate-200 dark:divide-slate-800">
        {recentlyIssued.length === 0 && <p className="p-5 text-sm text-slate-500">No vouchers issued yet.</p>}
        {recentlyIssued.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="font-medium">{e.user.email}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {e.exam.vendor.name} · <b>{e.exam.code}</b> — {e.exam.title}
              </div>
            </div>
            <code className="rounded bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-800">{e.voucher}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
