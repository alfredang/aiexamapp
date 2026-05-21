import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * One-shot admin endpoint to perform Phase 3 catalog cleanup after the
 * 2026-05-21 Microsoft rebuild session. Three categories of operations,
 * all idempotent (safe to re-run):
 *
 *   1. ARCHIVE orphan rebuild variants that no longer belong to their
 *      respective 3-variant bundles (PL-300 p4/p5, AI-900 p4/p5/p6,
 *      SC-200 p4/p5, MD-102 p4).
 *
 *   2. ARCHIVE retired Microsoft certifications that should no longer
 *      appear in the catalog (DP-203 retired 2025-03-31, MS-900 retired
 *      2026-03-31, DP-100 retires 2026-06-01, AI-102 retires 2026-06-30,
 *      AZ-500 retires 2026-08-31).
 *
 *   3. ARCHIVE OCI Foundations duplicates that diverge from the canonical
 *      `oracle-oci-foundations-1z0-1085-p*` 3x65 set (the legacy 40-Q
 *      single-variant `oracle-oci-foundations-1z0-1085` and the off-spec
 *      `oracle-oci-foundations-p1/p2/p3` dupes).
 *
 *   4. ACTIVATE (publish) CKA / CKAD 3x65 variants if they are currently
 *      loaded but not yet published (memory 2026-05-19 snapshot flagged
 *      them as awaiting toggle).
 *
 * Archive = set deletedAt + published=false (matches the per-row admin
 * archive action). Activate = set published=true (only when the row is
 * already not archived). All operations look up rows by slug — code may
 * diverge between local and prod (see feedback_topup_key_by_slug memory).
 *
 * Returns a per-slug summary so the caller can verify what changed.
 */

const ARCHIVE_SLUGS = [
  // Orphan rebuild variants
  'microsoft-pl-300-p4',
  'microsoft-pl-300-p5',
  'microsoft-ai-900-p4',
  'microsoft-ai-900-p5',
  'microsoft-ai-900-p6',
  'microsoft-sc-200-p4',
  'microsoft-sc-200-p5',
  'microsoft-md-102-p4',
  // Retired Microsoft exams
  'microsoft-dp-203',
  'microsoft-ms-900',
  'microsoft-dp-100',
  'microsoft-ai-102',
  'microsoft-az-500',
  // OCI dedup
  'oracle-oci-foundations-1z0-1085',
  'oracle-oci-foundations-p1',
  'oracle-oci-foundations-p2',
  'oracle-oci-foundations-p3'
];

const ACTIVATE_SLUGS = [
  'linuxfoundation-cka-p1',
  'linuxfoundation-cka-p2',
  'linuxfoundation-cka-p3',
  'linuxfoundation-ckad-p1',
  'linuxfoundation-ckad-p2',
  'linuxfoundation-ckad-p3'
];

type RowResult = { slug: string; action: 'archived' | 'activated' | 'already-archived' | 'already-active' | 'not-found' };

export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const results: RowResult[] = [];

  // ── 1. Archive ──
  for (const slug of ARCHIVE_SLUGS) {
    const exam = await db.exam.findUnique({ where: { slug }, select: { id: true, deletedAt: true } });
    if (!exam) {
      results.push({ slug, action: 'not-found' });
      continue;
    }
    if (exam.deletedAt) {
      results.push({ slug, action: 'already-archived' });
      continue;
    }
    await db.exam.update({
      where: { id: exam.id },
      data: { deletedAt: new Date(), published: false }
    });
    results.push({ slug, action: 'archived' });
  }

  // ── 2. Activate ──
  for (const slug of ACTIVATE_SLUGS) {
    const exam = await db.exam.findUnique({ where: { slug }, select: { id: true, deletedAt: true, published: true } });
    if (!exam) {
      results.push({ slug, action: 'not-found' });
      continue;
    }
    if (exam.deletedAt) {
      // Don't auto-activate an archived row; leave it for human decision.
      results.push({ slug, action: 'already-archived' });
      continue;
    }
    if (exam.published) {
      results.push({ slug, action: 'already-active' });
      continue;
    }
    await db.exam.update({
      where: { id: exam.id },
      data: { published: true }
    });
    results.push({ slug, action: 'activated' });
  }

  // ── AdminLog ──
  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'catalog.post_rebuild_cleanup',
      targetType: 'Catalog',
      targetId: 'post-rebuild-2026-05-21',
      metadata: { results } as any
    }
  });

  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ ok: true, counts, results });
}
