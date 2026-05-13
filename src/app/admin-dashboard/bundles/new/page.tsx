import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/page-header';

export const dynamic = 'force-dynamic';

async function create(formData: FormData) {
  'use server';
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') throw new Error('forbidden');

  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  const description = String(formData.get('description') || '').trim();
  const price = Math.round(Number(formData.get('price') || 0) * 100);
  const priceVoucherStr = String(formData.get('priceVoucher') || '').trim();
  const priceVoucher = priceVoucherStr ? Math.round(Number(priceVoucherStr) * 100) : null;
  if (!title || !slug || !price) return;

  const created = await db.bundle.create({
    data: { title, slug, description, price, priceVoucher, published: false, createdById: user.id }
  });
  await db.adminLog.create({
    data: { adminId: user.id, action: 'bundle.create', targetType: 'Bundle', targetId: created.id, metadata: { slug } }
  });
  revalidatePath('/admin-dashboard/bundles');
  redirect(`/admin-dashboard/bundles/${created.id}`);
}

export default async function NewBundlePage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');

  return (
    <div>
      <PageHeader title="New bundle" back={{ href: '/admin-dashboard/bundles', label: 'Back to bundles' }} />
      <form action={create} className="card mx-auto max-w-2xl space-y-3 p-4 text-sm">
        <Field label="Title"><input name="title" required className="input-sm" placeholder="AWS Practitioner Track" /></Field>
        <Field label="Slug"><input name="slug" required className="input-sm" placeholder="aws-practitioner-track" /></Field>
        <Field label="Description"><textarea name="description" rows={3} className="w-full rounded-md border border-slate-200 bg-white p-2 text-[12px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Price ($)"><input name="price" type="number" step="0.01" min="0" required className="input-sm" /></Field>
          <Field label="Voucher price ($, optional)"><input name="priceVoucher" type="number" step="0.01" min="0" placeholder="Leave empty for practice-only" className="input-sm" /></Field>
        </div>
        <p className="text-[11px] text-slate-500">After create, add items (exam + tier) on the bundle detail page.</p>
        <div className="flex items-center gap-2 pt-2">
          <button className="inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-[12px] font-medium text-white hover:bg-blue-700">Create bundle</button>
          <Link href="/admin-dashboard/bundles" className="text-[12px] text-slate-500 hover:underline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}
