-- Targeted migration: mark the first 30 PUBLISHED questions per exam as teaser.
-- This populates the free-preview pool used by /practice-exams/[vendor]/[slug]/teaser.
-- The runtime randomly samples ~20 of these per anonymous attempt (TEASER_QUESTION_COUNT setting).
--
-- For each Exam, partition its PUBLISHED questions by (createdAt ASC, id ASC) and flag the first 30.
-- Idempotent: AND "isTeaser" = false guard means already-marked questions are skipped on re-run.
-- DRAFT questions are NOT affected. Pool already short of 20 PUBLISHED means that exam gets <30 teasers
-- (the WHERE filter just limits to what's available).

UPDATE "Question" SET "isTeaser" = true
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "examId" ORDER BY "createdAt" ASC, id ASC) AS rn
    FROM "Question" WHERE status = 'PUBLISHED'
  ) ranked
  WHERE rn <= 30
)
AND "isTeaser" = false;
