-- Targeted migration: bump CCNA 200-301-P% questionCount to 100.
-- Official CCNA 200-301 spec: 100-120 questions / 120 min / 825 passing.
-- Pool stays at 60 per exam (no new questions inserted); runner will deliver
-- up to questionCount, capped by pool size. Mismatch is intentional per
-- the cost trade-off chosen.
-- Does NOT touch published/deletedAt; idempotent via WHERE filter.

UPDATE "Exam" SET "questionCount" = 100
  WHERE code LIKE '200-301-P%' AND "questionCount" <> 100;
