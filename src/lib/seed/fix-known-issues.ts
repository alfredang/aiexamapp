/**
 * Consolidated, idempotent repair for the known catalog issues surfaced in
 * the 2026-05-29 audit. All operations are safe to re-run.
 *
 *   #4 Delete the orphan `tableau-tds-*` exams (redundant duplicate of the
 *      published `tableau-desktop-specialist` family; the tableau-tds bundle
 *      is already gone). Only when no attempts/orders.
 *   #5 Unpublish the lonely AWS base shells (`aws-sap-c02`, `aws-soa-c03`)
 *      so their detail page falls through to the bundle instead of the
 *      "lonely exam" page.
 *   #6 Delete the redundant, already-unpublished AWS "track" bundles
 *      (`aws-data-engineer-track`, `aws-devops-track`). Only when no orders.
 *   #1 PMP: reconcile each exam's questionCount to its real published count,
 *      and re-tag the two domain-broken variants (`pmi-pmp-p3`, `pmi-pmp-p6`,
 *      which are ~100% "Process") using a keyword classifier into
 *      People / Process / Business Environment. Heuristic — improves the
 *      results-page breakdown vs the all-Process state; spot-check advised.
 *   #3 AI-900 P4: remove the one degenerate "Choose the correct answer(s)
 *      below" ordering question whose real prompt was lost, and backfill one
 *      grounded Microsoft-Learn question (tag `manual:ai900-regrounded`).
 */
import type { PrismaClient } from '@prisma/client';

type Opt = { id: string; text: string };

// ── #1 PMP domain classifier ──────────────────────────────────────────────
// PMP (PMBOK 7 / ECO) domains. Bias to Process unless a strong People or
// Business-Environment signal is present. Heuristic, not authoritative.
function classifyPmpDomain(text: string): 'People' | 'Process' | 'Business Environment' {
  const t = text.toLowerCase();
  if (
    /\bcomplian|\bregulat|\blegal|legislat|\bgovernance\b|benefits? realization|organi[sz]ational change|business value|business case|\bstrateg|market condition|enterprise environmental|organi[sz]ational process asset|\bportfolio\b|external (factor|environment)|\bcompliance\b/.test(t)
  ) return 'Business Environment';
  if (
    /\bteam\b|teammate|\bconflict|negotiat|\bcoach\b|\bmentor|motivat|leadership|\blead the team|emotional intelligence|servant leader|virtual team|distributed team|\bempower|\bmorale\b|build trust|ground rule|team charter|team performance|team development|team building|\bimpediment|self-organi[sz]/.test(t)
  ) return 'People';
  return 'Process';
}

const PMP_DOMAIN_BROKEN_SLUGS = ['pmi-pmp-p3', 'pmi-pmp-p6'];
const PMP_ALL_SLUGS = ['pmi-pmp-p1', 'pmi-pmp-p2', 'pmi-pmp-p3', 'pmi-pmp-p4', 'pmi-pmp-p5', 'pmi-pmp-p6'];

// ── #3 grounded AI-900 replacement ────────────────────────────────────────
const AI900_BAD_STEM_RE = /^choose the correct answer/i;
const AI900_REGROUND_TAG = 'manual:ai900-regrounded';
const AI900_REPLACEMENT = {
  stem: 'Which Azure offering provides prebuilt APIs for vision, speech, language, and decision capabilities that developers can call without training their own models?',
  type: 'SINGLE' as const,
  options: [
    { id: 'A', text: 'Azure AI Services (formerly Cognitive Services)' },
    { id: 'B', text: 'Azure Machine Learning designer' },
    { id: 'C', text: 'Azure Databricks' },
    { id: 'D', text: 'Azure DevOps' }
  ],
  correct: ['A'],
  explanation: 'Azure AI Services expose prebuilt, consumable APIs (Vision, Speech, Language, and decision services such as Content Safety) that apps call without building or training custom models. Azure Machine Learning is for building/training your own models; Databricks is analytics/Spark; DevOps is CI/CD tooling.',
  references: [{ url: 'https://learn.microsoft.com/en-us/training/modules/get-started-ai-fundamentals/', label: 'Fundamental AI Concepts — Microsoft Learn (AI-900)' }]
};

type Result = {
  tableauOrphans: { deleted: string[]; skipped: string[] };
  awsShells: Record<string, 'unpublished' | 'already-unpublished' | 'absent'>;
  deadTrackBundles: Record<string, 'deleted' | 'unpublished' | 'absent'>;
  pmp: { countReconciled: Record<string, string>; reclassified: Record<string, Record<string, number>> };
  ai900: { removed: number; inserted: number };
};

export async function fixKnownIssues(db: PrismaClient): Promise<Result> {
  const result: Result = {
    tableauOrphans: { deleted: [], skipped: [] },
    awsShells: {},
    deadTrackBundles: {},
    pmp: { countReconciled: {}, reclassified: {} },
    ai900: { removed: 0, inserted: 0 }
  };

  // ── #4 Delete orphan tableau-tds-* exams (and bundle if it lingers) ──
  const tdsBundle = await db.bundle.findUnique({ where: { slug: 'tableau-tds' }, select: { id: true, _count: { select: { orders: true } } } });
  if (tdsBundle && tdsBundle._count.orders === 0) {
    await db.bundleItem.deleteMany({ where: { bundleId: tdsBundle.id } });
    await db.bundle.delete({ where: { id: tdsBundle.id } });
  }
  const tdsExams = await db.exam.findMany({
    where: { slug: { startsWith: 'tableau-tds-' } },
    select: { id: true, slug: true, _count: { select: { attempts: true, orders: true } } }
  });
  for (const e of tdsExams) {
    if (e._count.attempts === 0 && e._count.orders === 0) {
      await db.question.deleteMany({ where: { examId: e.id } });
      await db.entitlement.deleteMany({ where: { examId: e.id } });
      await db.bundleItem.deleteMany({ where: { examId: e.id } });
      await db.exam.delete({ where: { id: e.id } });
      result.tableauOrphans.deleted.push(e.slug);
    } else {
      result.tableauOrphans.skipped.push(e.slug);
    }
  }

  // ── #5 Unpublish lonely AWS base shells ──
  for (const slug of ['aws-sap-c02', 'aws-soa-c03']) {
    const e = await db.exam.findUnique({ where: { slug }, select: { id: true, published: true } });
    if (!e) { result.awsShells[slug] = 'absent'; continue; }
    if (!e.published) { result.awsShells[slug] = 'already-unpublished'; continue; }
    await db.exam.update({ where: { id: e.id }, data: { published: false } });
    result.awsShells[slug] = 'unpublished';
  }

  // ── #6 Delete redundant AWS track bundles ──
  for (const slug of ['aws-data-engineer-track', 'aws-devops-track']) {
    const b = await db.bundle.findUnique({ where: { slug }, select: { id: true, _count: { select: { orders: true } } } });
    if (!b) { result.deadTrackBundles[slug] = 'absent'; continue; }
    if (b._count.orders === 0) {
      await db.bundleItem.deleteMany({ where: { bundleId: b.id } });
      await db.bundle.delete({ where: { id: b.id } });
      result.deadTrackBundles[slug] = 'deleted';
    } else {
      await db.bundle.update({ where: { id: b.id }, data: { published: false } });
      result.deadTrackBundles[slug] = 'unpublished';
    }
  }

  // ── #1 PMP: reconcile counts (all variants) + re-tag broken domains ──
  for (const slug of PMP_ALL_SLUGS) {
    const e = await db.exam.findFirst({ where: { slug }, select: { id: true, questionCount: true } });
    if (!e) continue;
    const pub = await db.question.count({ where: { examId: e.id, status: 'PUBLISHED' } });
    if (e.questionCount !== pub) {
      await db.exam.update({ where: { id: e.id }, data: { questionCount: pub } });
      result.pmp.countReconciled[slug] = `${e.questionCount}->${pub}`;
    }
  }
  for (const slug of PMP_DOMAIN_BROKEN_SLUGS) {
    const e = await db.exam.findFirst({ where: { slug }, select: { id: true } });
    if (!e) continue;
    const qs = await db.question.findMany({ where: { examId: e.id }, select: { id: true, stem: true, options: true } });
    const dist: Record<string, number> = { People: 0, Process: 0, 'Business Environment': 0 };
    for (const q of qs) {
      const opts = Array.isArray(q.options) ? (q.options as Opt[]) : [];
      const blob = `${q.stem}\n${opts.map((o) => o?.text ?? '').join('\n')}`;
      const domain = classifyPmpDomain(blob);
      dist[domain]++;
      await db.question.update({ where: { id: q.id }, data: { domain } });
    }
    result.pmp.reclassified[slug] = dist;
  }

  // ── #3 AI-900 P4: remove degenerate ordering question + backfill grounded ──
  const ai = await db.exam.findFirst({ where: { slug: 'microsoft-ai-900-p4' }, select: { id: true } });
  if (ai) {
    const candidates = await db.question.findMany({ where: { examId: ai.id }, select: { id: true, stem: true, options: true, domain: true, isTeaser: true } });
    let replacementDomain = 'Describe Artificial Intelligence workloads and considerations';
    let replacementTeaser = false;
    for (const q of candidates) {
      const opts = Array.isArray(q.options) ? (q.options as Opt[]) : [];
      const numeric = opts.length >= 3 && opts.every((o) => /^[\d.,)\s-]+$/.test(String(o?.text ?? '').trim()));
      if (AI900_BAD_STEM_RE.test(q.stem.trim()) && numeric) {
        replacementDomain = q.domain;
        replacementTeaser = q.isTeaser;
        await db.question.delete({ where: { id: q.id } });
        result.ai900.removed++;
      }
    }
    // delete-and-recreate the grounded replacement by tag (idempotent)
    await db.question.deleteMany({ where: { examId: ai.id, generatedBy: AI900_REGROUND_TAG } });
    await db.question.create({
      data: {
        examId: ai.id,
        stem: AI900_REPLACEMENT.stem,
        type: AI900_REPLACEMENT.type,
        domain: replacementDomain,
        difficulty: 3,
        explanation: AI900_REPLACEMENT.explanation,
        options: AI900_REPLACEMENT.options,
        correct: AI900_REPLACEMENT.correct,
        references: AI900_REPLACEMENT.references,
        status: 'PUBLISHED',
        generatedBy: AI900_REGROUND_TAG,
        isTeaser: replacementTeaser
      }
    });
    result.ai900.inserted++;
  }

  return result;
}
