import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isAdminRole } from '@/lib/permissions';
import { generateSeoForExam } from '@/lib/seo-assist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const me = session?.user as any;
  if (!isAdminRole(me?.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  const exam = await db.exam.findUnique({ where: { id }, include: { vendor: true } });
  if (!exam) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  try {
    const seo = await generateSeoForExam({
      vendor: exam.vendor.name,
      code: exam.code,
      title: exam.title,
      description: exam.description,
      domains: (exam.domains as any[]) || []
    });
    await db.exam.update({
      where: { id },
      data: { metaTitle: seo.title, metaDescription: seo.description, metaKeywords: seo.keywords }
    });
    await db.adminLog.create({
      data: { adminId: me.id, action: 'exam.seo.assist', targetType: 'Exam', targetId: id, metadata: { ...seo } }
    });
    return NextResponse.json({ ok: true, ...seo });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
