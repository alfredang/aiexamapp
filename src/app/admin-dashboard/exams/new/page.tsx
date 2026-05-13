import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { CreateExamAiAssist } from './ai-assist';

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
  const examSetsRaw = Number(formData.get('examSets') || 1);
  const examSets = Math.min(6, Math.max(1, Number.isFinite(examSetsRaw) ? examSetsRaw : 1));
  const infoUrlRaw = String(formData.get('infoUrl') || '').trim();
  const infoUrl = infoUrlRaw ? infoUrlRaw : null;
  const pricePractice = Math.round(Number(formData.get('pricePractice') || 29) * 100);
  const priceBundle = Math.round(Number(formData.get('priceBundle') || 179) * 100);
  const priceVoucher = Math.round(Number(formData.get('priceVoucher') || 149) * 100);
  // AI Assist drops the JSON blueprint into a hidden input.
  let domains: { name: string; weight: number }[] = [];
  const domainsJson = String(formData.get('domainsJson') || '').trim();
  if (domainsJson) {
    try {
      const parsed = JSON.parse(domainsJson);
      if (Array.isArray(parsed)) domains = parsed;
    } catch {
      /* ignore — keep empty */
    }
  }
  if (!vendorId || !code || !slug || !title) return;
  const created = await db.exam.create({
    data: {
      vendorId, code, title, slug, description, level,
      durationMinutes, passingScore, questionCount, examSets, infoUrl,
      pricePractice, priceBundle, priceVoucher,
      domains,
      published: false
    }
  });
  revalidatePath('/admin-dashboard/exams');
  redirect(`/admin-dashboard/exams/${created.id}/author`);
}

export default async function NewExamPage() {
  const vendors = await db.vendor.findMany({ orderBy: { name: 'asc' } });
  const vendorMap: Record<string, string> = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Exam</h1>
        <Link href="/admin-dashboard/exams" className="btn-ghost text-sm">← Back to list</Link>
      </div>

      <form data-create-exam action={createExam} className="card grid gap-3 p-4 md:grid-cols-3">
        <CreateExamAiAssist vendorMap={vendorMap} />
        <Field label="Vendor" className="md:col-span-1">
          <select name="vendorId" required className="input">
            <option value="">Vendor…</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Exam code">
          <input name="code" placeholder="e.g. SAA-C03" className="input" required />
        </Field>
        <Field label="Slug">
          <input name="slug" placeholder="aws-saa-c03" className="input" required />
        </Field>

        <Field label="Exam title" className="md:col-span-3">
          <input name="title" placeholder="Exam title" className="input" required />
        </Field>

        <Field label="Level">
          <select name="level" defaultValue="Associate" className="input">
            <option>Foundational</option>
            <option>Associate</option>
            <option>Professional</option>
            <option>Specialty</option>
          </select>
        </Field>
        <Field label="Duration (min)">
          <input name="durationMinutes" type="number" defaultValue={90} className="input" />
        </Field>
        <Field label="Pass %">
          <input name="passingScore" type="number" defaultValue={70} className="input" />
        </Field>

        <Field label="Questions per exam">
          <input name="questionCount" type="number" defaultValue={60} className="input" />
        </Field>
        <Field label="# of Exams (1-6)">
          <input name="examSets" type="number" min={1} max={6} defaultValue={1} className="input" />
        </Field>
        <Field label="Exam Info URL (vendor page or PDF)" className="md:col-span-3">
          <input name="infoUrl" type="url" placeholder="https://vendor.example.com/exam-info" className="input" />
        </Field>
        <Field label="Practice price ($)">
          <input name="pricePractice" type="number" step="0.01" defaultValue={29} className="input" />
        </Field>
        <Field label="Bundle price ($)">
          <input name="priceBundle" type="number" step="0.01" defaultValue={179} className="input" />
        </Field>
        <Field label="Voucher price ($)" className="md:col-span-1">
          <input name="priceVoucher" type="number" step="0.01" defaultValue={149} className="input" />
        </Field>
        <Field label="Description" className="md:col-span-3">
          <input name="description" placeholder="Description" className="input" />
        </Field>

        <div className="md:col-span-3 flex gap-2">
          <button className="btn-primary">Create exam</button>
          <Link href="/admin-dashboard/exams" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm ${className || ''}`}>
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
