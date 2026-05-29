/**
 * Unpublish the two redundant AWS "track" bundles that are wired to dead
 * base-exam slugs (the certs are already sold via their own per-cert
 * bundles). Customer impact: their "Start free teaser" CTA points at an
 * archived/unpublished exam and 404s.
 *
 * Non-destructive and idempotent: only flips `published` to false (data and
 * any order history preserved); re-running is a no-op. Repoint the items to
 * the live `-p1…-pN` variants and republish if track bundles are ever wanted.
 */
import type { PrismaClient } from '@prisma/client';

export const DEAD_TRACK_BUNDLE_SLUGS = ['aws-data-engineer-track', 'aws-devops-track'];

export async function fixAwsDeadBundles(db: PrismaClient) {
  const result: Record<string, 'unpublished' | 'already-unpublished' | 'absent'> = {};
  for (const slug of DEAD_TRACK_BUNDLE_SLUGS) {
    const bundle = await db.bundle.findUnique({ where: { slug }, select: { id: true, published: true } });
    if (!bundle) {
      result[slug] = 'absent';
      continue;
    }
    if (!bundle.published) {
      result[slug] = 'already-unpublished';
      continue;
    }
    await db.bundle.update({ where: { id: bundle.id }, data: { published: false } });
    result[slug] = 'unpublished';
  }
  return result;
}
