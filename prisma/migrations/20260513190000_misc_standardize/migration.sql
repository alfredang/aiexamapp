-- Targeted metadata-only migration: standardize 5 exam rows + archive 1 legacy parent.
-- Touches only the specific fields needed; does NOT flip published flags on any other row.
-- Idempotent: every UPDATE filters on the current (wrong) value, so re-runs are no-ops.

-- 1) ITIL4-F-P7: questionCount 60 -> 40 (official ITIL 4 Foundation: 40q / 60min)
UPDATE "Exam" SET "questionCount" = 40
  WHERE code = 'ITIL4-F-P7' AND "questionCount" <> 40;

-- 2) SOA-C03 (CloudOps Engineer Associate): duration 180 -> 130 (official: 65q / 130min)
UPDATE "Exam" SET "durationMinutes" = 130
  WHERE code = 'SOA-C03' AND "durationMinutes" <> 130;

-- 3) MLA-C01 parent (ML Engineer Associate): duration 130 -> 170 (official: 65q / 170min)
UPDATE "Exam" SET "durationMinutes" = 170
  WHERE code = 'MLA-C01' AND "durationMinutes" <> 170;

-- 4) MLA-C01-P1: questionCount 60->65 and duration 130->170 (match parent / official spec)
UPDATE "Exam" SET "questionCount" = 65
  WHERE code = 'MLA-C01-P1' AND "questionCount" <> 65;
UPDATE "Exam" SET "durationMinutes" = 170
  WHERE code = 'MLA-C01-P1' AND "durationMinutes" <> 170;

-- 5) Archive SAA-C03 parent (legacy parent superseded by SAA-C03-P1..P6 variants).
UPDATE "Exam" SET "deletedAt" = NOW(), "published" = false
  WHERE code = 'SAA-C03' AND "deletedAt" IS NULL;
