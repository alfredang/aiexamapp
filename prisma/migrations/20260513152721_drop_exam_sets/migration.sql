-- Drop Exam.examSets — individual exams no longer carry a "# of sets"
-- count. Bundle membership is the source of truth for how many practice
-- exams a customer gets per bundle.
ALTER TABLE "Exam" DROP COLUMN "examSets";
