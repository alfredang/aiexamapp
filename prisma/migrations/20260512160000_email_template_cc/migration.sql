-- AlterTable
ALTER TABLE "EmailTemplate" ADD COLUMN     "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "displayName" TEXT;

