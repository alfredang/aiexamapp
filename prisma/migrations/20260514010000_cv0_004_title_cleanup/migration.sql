-- Targeted migration: remove "Practice Exam N" suffix from CV0-004 titles.
-- The exam variant is already encoded in the `code` field (e.g. CV0-004-P1),
-- so the title doesn't need the suffix.
-- Does NOT touch any other field. Idempotent via WHERE filter.

UPDATE "Exam" SET "title" = 'CompTIA Cloud+'
  WHERE code LIKE 'CV0-004-P%' AND "title" <> 'CompTIA Cloud+';
