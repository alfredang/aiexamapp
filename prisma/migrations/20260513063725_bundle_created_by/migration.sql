-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
