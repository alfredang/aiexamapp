import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint for the urgent Microsoft catalog repairs
 * surfaced by /api/admin/microsoft-health on 2026-05-22.
 *
 * DRY-RUN BY DEFAULT. The endpoint reports exactly what it would do and
 * writes NOTHING unless called with `?apply=true`.
 *
 *   POST /api/admin/microsoft-catalog-repair            → dry run
 *   POST /api/admin/microsoft-catalog-repair?apply=true → apply changes
 *
 * Two repair categories:
 *
 * 1. PUBLISH + ACTIVATE — eight current certs whose 3×65 question sets
 *    were built (Wave-3) but left in DRAFT, so their published bundles
 *    serve empty exams. For each variant:
 *      - publish its DRAFT questions (status DRAFT → PUBLISHED)
 *      - activate the exam (published=true, deletedAt=null)
 *      - sync the exam.questionCount field to the new published count
 *    SAFETY: a DRAFT question with duplicate option ids is NOT published
 *    — it is left DRAFT and reported, so known-malformed content never
 *    goes live. (The find-malformed-questions diagnostic only scans
 *    PUBLISHED rows, so this pre-check is the gate.)
 *
 * 2. ARCHIVE RETIREES — three retired/retiring certs whose bundles are
 *    still published and sellable. Archive each bundle (published=false)
 *    and soft-delete each exam variant (deletedAt set, published=false).
 *
 * Idempotent: re-running after a successful apply is a safe no-op
 * (no DRAFT questions left, exams already active, bundles already
 * unpublished).
 */

// 8 current certs — 3 variants each — questions built but stuck DRAFT.
const PUBLISH_ACTIVATE_SLUGS = [
  'microsoft-pl-600-p1', 'microsoft-pl-600-p2', 'microsoft-pl-600-p3',
  'microsoft-pl-900-p1', 'microsoft-pl-900-p2', 'microsoft-pl-900-p3',
  'microsoft-sc-900-p1', 'microsoft-sc-900-p2', 'microsoft-sc-900-p3',
  'microsoft-sc-300-p1', 'microsoft-sc-300-p2', 'microsoft-sc-300-p3',
  'microsoft-az-204-p1', 'microsoft-az-204-p2', 'microsoft-az-204-p3',
  'microsoft-az-305-p1', 'microsoft-az-305-p2', 'microsoft-az-305-p3',
  'microsoft-dp-600-p1', 'microsoft-dp-600-p2', 'microsoft-dp-600-p3',
  'microsoft-sc-100-p1', 'microsoft-sc-100-p2', 'microsoft-sc-100-p3'
];

// Retiree exam variants to soft-delete.
const ARCHIVE_EXAM_SLUGS = [
  'microsoft-dp-203-p1', 'microsoft-dp-203-practice-6',
  'microsoft-dp-100-p1', 'microsoft-dp-100-p2',
  'microsoft-ai-102-p1', 'microsoft-ai-102-p2', 'microsoft-ai-102-p3',
  'microsoft-ai-102-p4', 'microsoft-ai-102-p5', 'microsoft-ai-102-practice'
];

// Retiree bundles to unpublish (Bundle has no deletedAt — published=false
// is the archive mechanism).
const ARCHIVE_BUNDLE_SLUGS = [
  'microsoft-dp-203', 'microsoft-dp-100', 'microsoft-ai-102'
];

function hasDuplicateOptionIds(options: unknown): boolean {
  if (!Array.isArray(options)) return false;
  const ids = (options as { id?: string }[]).map(o => o?.id ?? '');
  return new Set(ids).size !== ids.length;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const apply = req.nextUrl.searchParams.get('apply') === 'true';

  const publishActivate: Record<string, unknown>[] = [];
  const archiveExams: Record<string, unknown>[] = [];
  const archiveBundles: Record<string, unknown>[] = [];
  let totalPublished = 0;
  let totalMalformedSkipped = 0;

  // ── 1. Publish + activate ──
  for (const slug of PUBLISH_ACTIVATE_SLUGS) {
    const exam = await db.exam.findUnique({ where: { slug }, select: { id: true, published: true, deletedAt: true, questionCount: true } });
    if (!exam) {
      publishActivate.push({ slug, status: 'not-found' });
      continue;
    }
    const draftQs = await db.question.findMany({
      where: { examId: exam.id, status: 'DRAFT' },
      select: { id: true, options: true }
    });
    const goodIds: string[] = [];
    const malformedIds: string[] = [];
    for (const q of draftQs) {
      if (hasDuplicateOptionIds(q.options)) malformedIds.push(q.id);
      else goodIds.push(q.id);
    }

    if (apply) {
      if (goodIds.length > 0) {
        await db.question.updateMany({
          where: { id: { in: goodIds } },
          data: { status: 'PUBLISHED' }
        });
      }
      const pubCount = await db.question.count({ where: { examId: exam.id, status: 'PUBLISHED' } });
      await db.exam.update({
        where: { id: exam.id },
        data: { published: true, deletedAt: null, questionCount: pubCount }
      });
    }

    totalPublished += goodIds.length;
    totalMalformedSkipped += malformedIds.length;
    publishActivate.push({
      slug,
      status: 'ok',
      wasPublished: exam.published,
      wasArchived: exam.deletedAt != null,
      draftFound: draftQs.length,
      wouldPublish: goodIds.length,
      malformedSkipped: malformedIds.length,
      malformedIds
    });
  }

  // ── 2a. Archive retiree exam variants ──
  for (const slug of ARCHIVE_EXAM_SLUGS) {
    const exam = await db.exam.findUnique({ where: { slug }, select: { id: true, deletedAt: true, published: true } });
    if (!exam) {
      archiveExams.push({ slug, status: 'not-found' });
      continue;
    }
    if (exam.deletedAt != null) {
      archiveExams.push({ slug, status: 'already-archived' });
      continue;
    }
    if (apply) {
      await db.exam.update({ where: { id: exam.id }, data: { deletedAt: new Date(), published: false } });
    }
    archiveExams.push({ slug, status: 'archived', wasPublished: exam.published });
  }

  // ── 2b. Unpublish retiree bundles ──
  for (const slug of ARCHIVE_BUNDLE_SLUGS) {
    const bundle = await db.bundle.findUnique({ where: { slug }, select: { id: true, published: true } });
    if (!bundle) {
      archiveBundles.push({ slug, status: 'not-found' });
      continue;
    }
    if (!bundle.published) {
      archiveBundles.push({ slug, status: 'already-unpublished' });
      continue;
    }
    if (apply) {
      await db.bundle.update({ where: { id: bundle.id }, data: { published: false } });
    }
    archiveBundles.push({ slug, status: 'unpublished' });
  }

  if (apply) {
    await db.adminLog.create({
      data: {
        adminId: user.id!,
        action: 'catalog.microsoft_urgent_repair',
        targetType: 'Catalog',
        targetId: 'microsoft-urgent-2026-05-22',
        metadata: { publishActivate, archiveExams, archiveBundles } as any
      }
    });
  }

  return NextResponse.json({
    ok: true,
    mode: apply ? 'applied' : 'dry-run',
    hint: apply ? undefined : 'Re-call with ?apply=true to write these changes.',
    summary: {
      examsToPublishActivate: publishActivate.filter(p => p.status === 'ok').length,
      questionsPublished: totalPublished,
      malformedQuestionsSkipped: totalMalformedSkipped,
      retireeExamsArchived: archiveExams.filter(e => e.status === 'archived').length,
      retireeBundlesUnpublished: archiveBundles.filter(b => b.status === 'unpublished').length
    },
    publishActivate,
    archiveExams,
    archiveBundles
  });
}
