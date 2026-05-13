-- Rename Exam.tag -> Exam.label (preserves any values entered before rename).
ALTER TABLE "Exam" RENAME COLUMN "tag" TO "label";
