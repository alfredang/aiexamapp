import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function createVendor(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  const slug = String(formData.get('slug') || '').trim().toLowerCase();
  const description = String(formData.get('description') || '');
  if (!name || !slug) return;
  await db.vendor.create({ data: { name, slug, description } });
  revalidatePath('/admin/vendors');
}

export default async function AdminVendorsPage() {
  const vendors = await db.vendor.findMany({ include: { _count: { select: { exams: true } } }, orderBy: { name: 'asc' } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Vendors</h1>
      <form action={createVendor} className="card mt-4 grid gap-3 p-4 md:grid-cols-[1fr_1fr_2fr_auto]">
        <input name="name" placeholder="Name" required className="input" />
        <input name="slug" placeholder="slug" required className="input" />
        <input name="description" placeholder="Description" className="input" />
        <button className="btn-primary">Add</button>
      </form>
      <div className="card mt-4 divide-y divide-slate-200">
        {vendors.map(v => (
          <div key={v.id} className="flex items-center justify-between p-4">
            <div><div className="font-medium">{v.name}</div><div className="text-xs text-slate-500">/{v.slug} · {v._count.exams} exams</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
