import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function createExam(formData: FormData) {
  'use server';
  const vendorId = String(formData.get('vendorId'));
  const code = String(formData.get('code') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim().toLowerCase();
  const description = String(formData.get('description') || '');
  const level = String(formData.get('level') || 'Associate');
  const durationMinutes = Number(formData.get('durationMinutes') || 90);
  const passingScore = Number(formData.get('passingScore') || 70);
  const questionCount = Number(formData.get('questionCount') || 60);
  const pricePractice = Math.round(Number(formData.get('pricePractice') || 29) * 100);
  const priceBundle = Math.round(Number(formData.get('priceBundle') || 179) * 100);
  const priceVoucher = Math.round(Number(formData.get('priceVoucher') || 149) * 100);
  if (!vendorId || !code || !slug || !title) return;
  await db.exam.create({
    data: {
      vendorId, code, title, slug, description, level,
      durationMinutes, passingScore, questionCount,
      pricePractice, priceBundle, priceVoucher,
      domains: [],
      published: false
    }
  });
  revalidatePath('/admin/exams');
}

async function togglePublish(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const published = formData.get('published') === 'on';
  await db.exam.update({ where: { id }, data: { published } });
  revalidatePath('/admin/exams');
}

export default async function AdminExamsPage() {
  const [vendors, exams] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: 'asc' } }),
    db.exam.findMany({ include: { vendor: true, _count: { select: { questions: true } } }, orderBy: { createdAt: 'desc' } })
  ]);
  return (
    <div>
      <h1 className="text-2xl font-bold">Exams</h1>
      <form action={createExam} className="card mt-4 grid gap-3 p-4 md:grid-cols-3">
        <select name="vendorId" required className="input">
          <option value="">Vendor…</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <input name="code" placeholder="Exam code (e.g. SAA-C03)" className="input" required />
        <input name="slug" placeholder="slug" className="input" required />
        <input name="title" placeholder="Exam title" className="input md:col-span-3" required />
        <select name="level" className="input">
          <option>Foundational</option><option>Associate</option><option>Professional</option><option>Specialty</option>
        </select>
        <input name="durationMinutes" type="number" placeholder="Duration (min)" defaultValue={90} className="input" />
        <input name="passingScore" type="number" placeholder="Pass %" defaultValue={70} className="input" />
        <input name="questionCount" type="number" placeholder="Questions per exam" defaultValue={60} className="input" />
        <input name="pricePractice" type="number" step="0.01" placeholder="Price practice ($)" defaultValue={29} className="input" />
        <input name="priceBundle" type="number" step="0.01" placeholder="Bundle ($)" defaultValue={179} className="input" />
        <input name="priceVoucher" type="number" step="0.01" placeholder="Voucher ($)" defaultValue={149} className="input" />
        <input name="description" placeholder="Description" className="input md:col-span-3" />
        <button className="btn-primary md:col-span-3">Create exam</button>
      </form>
      <div className="card mt-4 divide-y divide-slate-200">
        {exams.map(e => (
          <div key={e.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{e.title}</div>
              <div className="text-xs text-slate-500">{e.vendor.name} · {e.code} · {e.level} · {e._count.questions} questions</div>
            </div>
            <form action={togglePublish} className="flex items-center gap-2">
              <input type="hidden" name="id" value={e.id} />
              <label className="text-xs"><input type="checkbox" name="published" defaultChecked={e.published} /> published</label>
              <button className="btn-outline">Save</button>
              <a href={`/admin/exams/${e.id}/generate`} className="btn-primary-grad">Generate</a>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
