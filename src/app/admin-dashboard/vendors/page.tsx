import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('forbidden');
  return session!.user as any;
}

async function createVendor(formData: FormData) {
  'use server';
  await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  const slug = String(formData.get('slug') || '').trim().toLowerCase();
  const logo = String(formData.get('logo') || '').trim() || null;
  const description = String(formData.get('description') || '').trim() || null;
  if (!name || !slug) return;
  await db.vendor.create({ data: { name, slug, logo, description } });
  revalidatePath('/admin-dashboard/vendors');
  revalidatePath('/admin-dashboard/exams');
}

async function updateVendor(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id'));
  const name = String(formData.get('name') || '').trim();
  const slug = String(formData.get('slug') || '').trim().toLowerCase();
  const logo = String(formData.get('logo') || '').trim() || null;
  const description = String(formData.get('description') || '').trim() || null;
  if (!id || !name || !slug) return;
  await db.vendor.update({ where: { id }, data: { name, slug, logo, description } });
  revalidatePath('/admin-dashboard/vendors');
  revalidatePath('/admin-dashboard/exams');
}

async function deleteVendor(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id'));
  if (!id) return;
  const count = await db.exam.count({ where: { vendorId: id } });
  if (count > 0) return; // refuse delete when exams still reference it
  await db.vendor.delete({ where: { id } });
  revalidatePath('/admin-dashboard/vendors');
  revalidatePath('/admin-dashboard/exams');
}

export default async function AdminVendorsPage() {
  const vendors = await db.vendor.findMany({
    include: { _count: { select: { exams: true } } },
    orderBy: { name: 'asc' }
  });
  return (
    <div>
      <h1 className="text-2xl font-bold">Vendors</h1>

      <form action={createVendor} className="card mt-4 grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_2fr_auto]">
        <input name="name" placeholder="Name" required className="input" />
        <input name="slug" placeholder="slug" required className="input" />
        <input name="logo" placeholder="Logo URL (optional)" className="input" />
        <input name="description" placeholder="Description" className="input" />
        <button className="btn-primary">Add</button>
      </form>

      <div className="card mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {vendors.map((v) => {
          const canDelete = v._count.exams === 0;
          return (
            <div key={v.id} className="p-4">
              <form
                action={updateVendor}
                className="grid items-center gap-2 md:grid-cols-[1fr_1fr_1fr_2fr_auto_auto]"
              >
                <input type="hidden" name="id" value={v.id} />
                <input name="name" defaultValue={v.name} className="input" required />
                <input name="slug" defaultValue={v.slug} className="input" required />
                <input name="logo" defaultValue={v.logo ?? ''} placeholder="Logo URL" className="input" />
                <input
                  name="description"
                  defaultValue={v.description ?? ''}
                  placeholder="Description"
                  className="input"
                />
                <button className="btn-outline text-sm">Save</button>
                <span className="text-xs text-slate-500 md:col-span-5">
                  /{v.slug} · {v._count.exams} exams
                </span>
              </form>
              <form action={deleteVendor} className="mt-2 flex justify-end">
                <input type="hidden" name="id" value={v.id} />
                <button
                  disabled={!canDelete}
                  title={canDelete ? 'Delete vendor' : 'Cannot delete: vendor still has exams'}
                  className="text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Delete
                </button>
              </form>
            </div>
          );
        })}
        {vendors.length === 0 && <p className="p-4 text-sm text-slate-500">No vendors yet.</p>}
      </div>
    </div>
  );
}
