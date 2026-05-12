import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { GeneratorClient } from './generator-client';

export default async function GeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await db.exam.findUnique({ where: { id }, include: { vendor: true } });
  if (!exam) notFound();
  const domains = ((exam.domains as any[]) || []).map((d: any) => d.name as string);
  return (
    <div>
      <h1 className="text-2xl font-bold">Generate questions — {exam.title}</h1>
      <p className="text-sm text-slate-600">{exam.vendor.name} · {exam.code}</p>
      <GeneratorClient examId={exam.id} domains={domains} />
    </div>
  );
}
