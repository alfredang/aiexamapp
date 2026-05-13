-- AlterTable: add audit fields. Backfill updatedAt from createdAt for
-- existing rows, then enforce NOT NULL.
ALTER TABLE "Exam" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Exam" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Exam" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "Exam" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
