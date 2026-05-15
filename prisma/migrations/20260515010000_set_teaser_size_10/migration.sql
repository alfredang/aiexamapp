-- Set TEASER_QUESTION_COUNT to 10 (was implicitly 20 via the default in
-- src/app/practice-exams/[vendor]/[slug]/teaser/page.tsx).
-- Idempotent via ON CONFLICT.

INSERT INTO "Setting" (key, value, "updatedAt")
VALUES ('TEASER_QUESTION_COUNT', '10', NOW())
ON CONFLICT (key) DO UPDATE SET value = '10', "updatedAt" = NOW();
