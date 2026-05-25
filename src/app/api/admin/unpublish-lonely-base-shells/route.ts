import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One-shot fix for the "lonely base shell" pattern surfaced by the
 * audit-teaser-bundles endpoint's new `lonelyBaseShells` section.
 *
 * Background: when we ship a multi-variant cert (e.g. SOA-C03), the
 * data model has 4 exam rows — a base shell `aws-soa-c03` and 3
 * variants `aws-soa-c03-p1..p3` — plus 1 bundle `aws-soa-c03` that
 * groups the variants. The intent: the page resolver at
 * /practice-exams/[vendor]/[slug] looks up the exam first; if the
 * exam is unpublished (the base shell case), it falls through to the
 * bundle. So the base shell MUST be `published:false`.
 *
 * `prisma/seed.ts:84-86` enforces this at create-time via
 * HIDDEN_EXAM_SLUGS. But if a prod admin manually flips the base
 * shell to published (easy to do during a cert build when wiring
 * everything up), the resolver picks the exam and renders the
 * "lonely-exam" view — customers see "this exam isn't yet available
 * in a bundle" even though the bundle exists right next door.
 *
 * Two known offenders identified 2026-05-25: aws-soa-c03 and
 * aws-sap-c02. (aws-saa-c03 is in the same HIDDEN_EXAM_SLUGS list
 * but its base shell stayed published:false correctly.)
 *
 * Idempotent — skips rows already in the target state. Refuses to
 * unpublish a row that has no published sibling in a published
 * bundle (would just be hiding live content, not fixing wiring).
 *
 * POST /api/admin/unpublish-lonely-base-shells
 */

const KNOWN_LONELY_BASE_SHELLS = [
  'aws-soa-c03',
  'aws-sap-c02'
] as const;

const VARIANT_RE = /^(.+?)-(?:p|practice-)\d+$/i;

export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  type Result = {
    slug: string;
    action: 'unpublished' | 'already-unpublished' | 'not-found' | 'no-bundle-sibling-skipped';
    siblings?: string[];
  };
  const results: Result[] = [];

  for (const slug of KNOWN_LONELY_BASE_SHELLS) {
    const ex = await db.exam.findUnique({
      where: { slug },
      select: { id: true, published: true }
    });
    if (!ex) {
      results.push({ slug, action: 'not-found' });
      continue;
    }
    if (!ex.published) {
      results.push({ slug, action: 'already-unpublished' });
      continue;
    }

    // Safety guard: only unpublish if at least one sibling variant is
    // actually wired into a published bundle. Otherwise we'd be hiding
    // content with no fallback — exactly the opposite of the intent.
    const variantPrefix = `${slug}-`;
    const siblingInBundle = await db.bundle.findFirst({
      where: {
        published: true,
        items: {
          some: {
            exam: {
              slug: { startsWith: variantPrefix }
            }
          }
        }
      },
      include: {
        items: {
          where: { exam: { slug: { startsWith: variantPrefix } } },
          include: { exam: { select: { slug: true } } }
        }
      }
    });

    const siblings = siblingInBundle?.items
      .map((i) => i.exam.slug)
      .filter((s) => VARIANT_RE.test(s) && s.match(VARIANT_RE)?.[1] === slug)
      ?? [];

    if (siblings.length === 0) {
      results.push({ slug, action: 'no-bundle-sibling-skipped' });
      continue;
    }

    await db.exam.update({ where: { id: ex.id }, data: { published: false } });
    results.push({ slug, action: 'unpublished', siblings });
  }

  const unpublishedCount = results.filter((r) => r.action === 'unpublished').length;

  await db.adminLog.create({
    data: {
      adminId: user.id!,
      action: 'content.unpublish-lonely-base-shells',
      targetType: 'Exam',
      targetId: 'batch',
      metadata: { unpublishedCount, results }
    }
  });

  return NextResponse.json({
    ok: true,
    summary: { unpublishedCount },
    results
  });
}
