-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "metaKeywords" TEXT;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaKeywords" TEXT,
ADD COLUMN     "metaTitle" TEXT;
