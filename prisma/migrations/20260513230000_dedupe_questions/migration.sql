-- Targeted cleanup migration: remove ~315 pre-existing duplicate Question rows.
-- These were created by a buggy "topup" script run on 2026-05-08 that had a
-- concurrency race condition, creating each question ~2x (rows ~50ms apart
-- with identical stems on the same exam).
--
-- For each (examId, stem) group, keep the row with the EARLIEST createdAt
-- (tiebreaker: id ASC) and delete the rest. Idempotent: second run finds
-- no duplicates and deletes 0 rows.
--
-- Pool sizes will shrink on affected exams. Runner caps delivery at pool
-- size when pool < questionCount.
--
-- Does NOT touch Exam rows, published flags, or any other field.

DELETE FROM "Question" WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY "examId", stem ORDER BY "createdAt" ASC, id ASC) AS rn
    FROM "Question"
  ) ranked
  WHERE rn > 1
);
