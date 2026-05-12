-- CreateEnum
CREATE TYPE "ExamSourceKind" AS ENUM ('PDF', 'EPUB', 'URL');

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "sourceId" TEXT;

-- CreateTable
CREATE TABLE "ExamSource" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "kind" "ExamSourceKind" NOT NULL,
    "label" TEXT NOT NULL,
    "storagePath" TEXT,
    "urls" JSONB,
    "importedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamSource_examId_idx" ON "ExamSource"("examId");

-- CreateIndex
CREATE INDEX "Question_sourceId_idx" ON "Question"("sourceId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ExamSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSource" ADD CONSTRAINT "ExamSource_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSource" ADD CONSTRAINT "ExamSource_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
