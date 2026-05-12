-- CreateEnum
CREATE TYPE "VoucherInventoryStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'ASSIGNED', 'EXPIRED');

-- CreateTable
CREATE TABLE "VoucherInventory" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "examId" TEXT,
    "code" TEXT NOT NULL,
    "status" "VoucherInventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "expiresAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "assignedEntitlementId" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedById" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "VoucherInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoucherInventory_code_key" ON "VoucherInventory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherInventory_assignedEntitlementId_key" ON "VoucherInventory"("assignedEntitlementId");

-- CreateIndex
CREATE INDEX "VoucherInventory_vendorId_status_idx" ON "VoucherInventory"("vendorId", "status");

-- CreateIndex
CREATE INDEX "VoucherInventory_examId_status_idx" ON "VoucherInventory"("examId", "status");

-- CreateIndex
CREATE INDEX "VoucherInventory_status_expiresAt_idx" ON "VoucherInventory"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "VoucherInventory" ADD CONSTRAINT "VoucherInventory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherInventory" ADD CONSTRAINT "VoucherInventory_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherInventory" ADD CONSTRAINT "VoucherInventory_assignedEntitlementId_fkey" FOREIGN KEY ("assignedEntitlementId") REFERENCES "Entitlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherInventory" ADD CONSTRAINT "VoucherInventory_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
