/**
 * State-hygiene fix: an archived exam (deletedAt set) must never also carry
 * published=true. The catalog-health audit surfaced 8 such inconsistent rows
 * (comptia 220-1101 / 220-1102 / CS0-003 / N10-009 / SY0-701 and cisco
 * 200-301 / 350-401 / 200-201) — archived base shells with 0 questions that
 * were left published=true. Public reads already exclude archived exams, so
 * there is no customer-facing change; this only reconciles the inconsistent
 * (archived AND published) state the admin tracker flags.
 *
 * General, non-destructive, idempotent: flips published→false for EVERY exam
 * where deletedAt is set and published is still true. Touches nothing else;
 * re-running is a no-op. Returns the slugs it changed.
 */
import type { PrismaClient } from '@prisma/client';

export async function fixArchivedPublished(db: PrismaClient) {
  const targets = await db.exam.findMany({
    where: { deletedAt: { not: null }, published: true },
    select: { id: true, slug: true, code: true }
  });

  if (targets.length > 0) {
    await db.exam.updateMany({
      where: { id: { in: targets.map((e) => e.id) } },
      data: { published: false }
    });
  }

  return {
    fixed: targets.length,
    slugs: targets.map((e) => e.slug),
    codes: targets.map((e) => e.code).filter(Boolean)
  };
}
