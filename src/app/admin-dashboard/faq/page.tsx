import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.role === 'USER') throw new Error('forbidden');
  return user as { id: string };
}

async function createFaq(formData: FormData) {
  'use server';
  await requireAdmin();
  const question = String(formData.get('question') || '').trim();
  const answer = String(formData.get('answer') || '').trim();
  const position = Number(formData.get('position') || 0);
  const published = formData.get('published') === 'on';
  if (!question || !answer) return;
  await db.faq.create({ data: { question, answer, position, published } });
  revalidatePath('/admin-dashboard/faq');
}

async function updateFaq(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id'));
  const question = String(formData.get('question') || '').trim();
  const answer = String(formData.get('answer') || '').trim();
  const position = Number(formData.get('position') || 0);
  const published = formData.get('published') === 'on';
  await db.faq.update({ where: { id }, data: { question, answer, position, published } });
  revalidatePath('/admin-dashboard/faq');
}

async function deleteFaq(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id'));
  await db.faq.delete({ where: { id } });
  revalidatePath('/admin-dashboard/faq');
}

export default async function FaqAdminPage() {
  const session = await auth();
  if ((session?.user as any)?.role === 'USER' || !session?.user) redirect('/');
  const faqs = await db.faq.findMany({ orderBy: { position: 'asc' } });

  return (
    <div>
      <PageHeader title="FAQ" subtitle={`${faqs.length} entr${faqs.length === 1 ? 'y' : 'ies'}. Published entries appear on the public marketing pages.`} />

      <form action={createFaq} className="card mb-3 space-y-2 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Add FAQ</div>
        <input name="question" required placeholder="Question" className="input-sm" />
        <textarea name="answer" required rows={3} placeholder="Answer (markdown)" className="w-full rounded-md border border-slate-200 bg-white p-2 text-[12px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        <div className="flex items-center gap-2">
          <input name="position" type="number" defaultValue={faqs.length} placeholder="Position" className="input-sm w-20" />
          <label className="inline-flex items-center gap-1 text-[11px]"><input type="checkbox" name="published" defaultChecked /> Published</label>
          <button className="ml-auto inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-[12px] font-medium text-white hover:bg-blue-700">Add</button>
        </div>
      </form>

      <div className="space-y-2">
        {faqs.map((f) => (
          <form key={f.id} action={updateFaq} className="card space-y-2 p-3">
            <input type="hidden" name="id" value={f.id} />
            <input name="question" defaultValue={f.question} className="input-sm" />
            <textarea name="answer" rows={3} defaultValue={f.answer} className="w-full rounded-md border border-slate-200 bg-white p-2 text-[12px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            <div className="flex items-center gap-2">
              <input name="position" type="number" defaultValue={f.position} className="input-sm w-20" />
              <label className="inline-flex items-center gap-1 text-[11px]"><input type="checkbox" name="published" defaultChecked={f.published} /> Published</label>
              <button type="submit" className="ml-auto inline-flex h-7 items-center rounded-md bg-emerald-600 px-3 text-[11px] font-medium text-white hover:bg-emerald-700">Save</button>
            </div>
          </form>
        ))}
        {faqs.map((f) => (
          <form key={`del-${f.id}`} action={deleteFaq} className="text-right">
            <input type="hidden" name="id" value={f.id} />
            <ConfirmButton message={`Delete FAQ "${f.question}"?`} className="text-[11px]">
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </ConfirmButton>
          </form>
        ))}
      </div>
    </div>
  );
}
