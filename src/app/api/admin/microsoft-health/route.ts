import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Read-only health check for every Microsoft exam on production.
 *
 * For each exam under the `microsoft` vendor it reports:
 *   - identity: slug, code, title, level
 *   - state: published, archived (deletedAt != null)
 *   - questions: stored questionCount field vs actual PUBLISHED count
 *     vs DRAFT count
 *   - blueprint: domain names + weights and whether they sum to 100
 *   - flags: a list of detected anomalies
 *
 * Also lists Microsoft bundles and their item wiring so the bundle
 * surface can be sanity-checked.
 *
 * Pure reads (findMany / groupBy / count). No writes.
 */

type ExamHealth = {
  slug: string;
  code: string;
  title: string;
  level: string;
  published: boolean;
  archived: boolean;
  questionCountField: number;
  publishedQuestions: number;
  draftQuestions: number;
  domainWeightSum: number;
  domains: { name: string; weight: number }[];
  flags: string[];
};

export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const vendor = await db.vendor.findUnique({ where: { slug: 'microsoft' } });
  if (!vendor) {
    return NextResponse.json({ error: 'microsoft vendor not found' }, { status: 404 });
  }

  const exams = await db.exam.findMany({
    where: { vendorId: vendor.id },
    orderBy: { slug: 'asc' }
  });

  // Actual question counts per exam, split by status.
  const grp = await db.question.groupBy({
    by: ['examId', 'status'],
    where: { examId: { in: exams.map(e => e.id) } },
    _count: { _all: true }
  });
  const pub = new Map<string, number>();
  const draft = new Map<string, number>();
  for (const r of grp) {
    if (r.status === 'PUBLISHED') pub.set(r.examId, r._count._all);
    else if (r.status === 'DRAFT') draft.set(r.examId, (draft.get(r.examId) || 0) + r._count._all);
  }

  const health: ExamHealth[] = exams.map(e => {
    const domains = Array.isArray(e.domains) ? (e.domains as { name: string; weight: number }[]) : [];
    const weightSum = domains.reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const publishedQuestions = pub.get(e.id) || 0;
    const draftQuestions = draft.get(e.id) || 0;
    const archived = e.deletedAt != null;
    const flags: string[] = [];

    if (domains.length > 0 && weightSum !== 100) flags.push(`domain weights sum to ${weightSum}, not 100`);
    if (e.published && !archived && publishedQuestions === 0) flags.push('published but has 0 published questions');
    if (e.published && !archived && publishedQuestions > 0 && publishedQuestions < 50) flags.push(`thin: only ${publishedQuestions} published questions`);
    if (!archived && e.questionCount !== publishedQuestions && publishedQuestions > 0) {
      flags.push(`questionCount field (${e.questionCount}) != actual published (${publishedQuestions})`);
    }
    if (e.published && archived) flags.push('archived AND published=true (inconsistent state)');

    return {
      slug: e.slug,
      code: e.code,
      title: e.title,
      level: e.level,
      published: e.published,
      archived,
      questionCountField: e.questionCount,
      publishedQuestions,
      draftQuestions,
      domainWeightSum: weightSum,
      domains,
      flags
    };
  });

  // Microsoft bundles + item wiring.
  const bundles = await db.bundle.findMany({
    where: { items: { some: { exam: { vendorId: vendor.id } } } },
    include: { items: { orderBy: { position: 'asc' }, include: { exam: { select: { slug: true } } } } },
    orderBy: { slug: 'asc' }
  });
  const bundleReport = bundles.map(b => ({
    slug: b.slug,
    title: b.title,
    published: b.published,
    items: b.items.map(it => ({ examSlug: it.exam.slug, tier: it.tier, position: it.position }))
  }));

  const withFlags = health.filter(h => h.flags.length > 0);
  const summary = {
    totalExams: health.length,
    active: health.filter(h => h.published && !h.archived).length,
    inactive: health.filter(h => !h.published && !h.archived).length,
    archived: health.filter(h => h.archived).length,
    examsWithFlags: withFlags.length,
    totalBundles: bundleReport.length
  };

  return NextResponse.json({ vendor: 'microsoft', summary, exams: health, bundles: bundleReport });
}
