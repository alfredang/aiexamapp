import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export default async function TeaserStartPage({ params }: { params: Promise<{ vendor: string; slug: string }> }) {
  const { vendor: vendorSlug, slug } = await params;
  const exam = await db.exam.findUnique({ where: { slug }, include: { vendor: true } });
  if (!exam || exam.vendor.slug !== vendorSlug) notFound();

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  // Cookie for guest token
  const c = await cookies();
  let gt = c.get('gt')?.value;
  if (!userId && !gt) {
    gt = `g_${crypto.randomUUID()}`;
    c.set('gt', gt, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  }

  const teaserQuestions = await db.question.findMany({
    where: { examId: exam.id, isTeaser: true, status: 'PUBLISHED' },
    select: { id: true }
  });
  if (teaserQuestions.length === 0) {
    return <div className="container-app py-16 text-center"><h1 className="text-xl font-semibold">Teaser not yet available</h1></div>;
  }
  const ids = teaserQuestions.map(q => q.id).sort(() => Math.random() - 0.5).slice(0, 30);

  const attempt = await db.attempt.create({
    data: {
      userId: userId ?? null,
      guestToken: !userId ? gt : null,
      examId: exam.id,
      mode: 'PRACTICE',
      isTeaser: true,
      questionIds: ids,
      durationSec: 0,
      responses: {}
    }
  });
  redirect(`/exam/${attempt.id}`);
}
