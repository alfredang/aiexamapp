-- Targeted migration: standardize DVA-C02-P% questionCount to 65
-- (official DVA-C02 spec: 65 questions / 130 minutes / 720 passing)
-- The earlier session migration missed DVA-C02 in its standardization sweep.
-- Idempotent: WHERE filter only matches rows that need the update.
-- Does NOT touch published, deletedAt, or any other field.

UPDATE "Exam" SET "questionCount" = 65
  WHERE code LIKE 'DVA-C02-P%' AND "questionCount" <> 65;
