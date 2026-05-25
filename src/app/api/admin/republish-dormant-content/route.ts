import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One-shot fix for the dead-bundle / hidden-content backlog surfaced by
 * /api/admin/audit-teaser-bundles. Two surgical changes:
 *
 *   1. Publish 17 exam variants that have content sitting underneath
 *      `published:false`. Restores 1,275 questions to customer view and
 *      unbreaks four published bundles (pmi-pmp, microsoft-az-104,
 *      microsoft-dp-300, microsoft-dp-900).
 *
 *   2. Unpublish 3 retired-cert bundles (microsoft-ai-102, dp-100,
 *      dp-203) so customers stop seeing PICK A PLAN cards that link
 *      nowhere. Drift audit (2026-05-20) flagged these as retired.
 *
 * Idempotent — safe to re-run. Skips rows already in the target state.
 * Returns a structured report (and writes one AdminLog row) so the
 * actual mutation count is auditable.
 *
 * POST /api/admin/republish-dormant-content
 */

const EXAMS_TO_PUBLISH = [
  // PMI PMP — 6 variants, 601 questions, fixes pmi-pmp bundle
  'pmi-pmp-p1', 'pmi-pmp-p2', 'pmi-pmp-p3', 'pmi-pmp-p4', 'pmi-pmp-p5', 'pmi-pmp-p6',
  // Microsoft AZ-104 — 3 variants, 195 questions, fixes microsoft-az-104 bundle
  'microsoft-az-104-p1', 'microsoft-az-104-p2', 'microsoft-az-104-p3',
  // Microsoft DP-300 — 4 variants, 239 questions, fixes microsoft-dp-300 bundle
  'microsoft-dp-300-p1', 'microsoft-dp-300-p2', 'microsoft-dp-300-p3', 'microsoft-dp-300-p4',
  // Microsoft DP-900 — 4 variants, 240 questions, fixes microsoft-dp-900 bundle
  'microsoft-dp-900-p1', 'microsoft-dp-900-p2', 'microsoft-dp-900-p3', 'microsoft-dp-900-p4'
] as const;

const BUNDLES_TO_UNPUBLISH = [
  'microsoft-ai-102', // AI-102 retired per drift audit 2026-05-20
  'microsoft-dp-100', // DP-100 retired per drift audit 2026-05-20
  'microsoft-dp-203'  // DP-203 retired per drift audit 2026-05-20
] as const;

export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  type ExamResult = {
    slug: string;
    action: 'published' | 'already-published' | 'not-found' | 'archived-skipped' | 'no-content-skipped';
    publishedQuestions?: number;
  };
  const examResults: ExamResult[] = [];

  for (const slug of EXAMS_TO_PUBLISH) {
    const ex = await db.exam.findUnique({
      where: { slug },
      select: {
        id: true, published: true, deletedAt: true,
        _count: { select: { questions: { where: { status: 'PUBLISHED' } } } }
      }
    });
    if (!ex) {
      examResults.push({ slug, action: 'not-found' });
      continue;
    }
    if (ex.deletedAt) {
      // Refuse to un-archive blindly — that's a different decision.
      examResults.push({ slug, action: 'archived-skipped' });
      continue;
    }
    if (ex._count.questions === 0) {
      // Defensive: if the diagnostic was stale and this exam has no
      // published content, refuse to publish — would produce a card
      // that opens to nothing. The audit reported 60–110 questions for
      // every slug in this list; this branch should never trigger.
      examResults.push({ slug, action: 'no-content-skipped' });
      continue;
    }
    if (ex.published) {
      examResults.push({ slug, action: 'already-published', publishedQuestions: ex._count.questions });
      continue;
    }
    await db.exam.update({ where: { id: ex.id }, data: { published: true } });
    examResults.push({ slug, action: 'published', publishedQuestions: ex._count.questions });
  }

  type BundleResult = {
    slug: string;
    action: 'unpublished' | 'already-unpublished' | 'not-found';
  };
  const bundleResults: BundleResult[] = [];

  for (const slug of BUNDLES_TO_UNPUBLISH) {
    const b = await db.bundle.findUnique({ where: { slug }, select: { id: true, published: true } });
    if (!b) {
      bundleResults.push({ slug, action: 'not-found' });
      continue;
    }
    if (!b.published) {
      bundleResults.push({ slug, action: 'already-unpublished' });
      continue;
    }
    await db.bundle.update({ where: { id: b.id }, data: { published: false } });
    bundleResults.push({ slug, action: 'unpublished' });
  }

  const examsPublished = examResults.filter((r) => r.action === 'published').length;
  const bundlesUnpublished = bundleResults.filter((r) => r.action === 'unpublished').length;
  const questionsRestored = examResults
    .filter((r) => r.action === 'published')
    .reduce((sum, r) => sum + (r.publishedQuestions || 0), 0);

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'content.republish-dormant',
      targetType: 'Exam',
      targetId: 'batch',
      metadata: {
        examsPublished,
        bundlesUnpublished,
        questionsRestored,
        examResults,
        bundleResults
      }
    }
  });

  return NextResponse.json({
    ok: true,
    summary: { examsPublished, bundlesUnpublished, questionsRestored },
    examResults,
    bundleResults
  });
}
