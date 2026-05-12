-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYPAL', 'PAYNOW', 'HITPAY', 'TEST');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "EmailTemplateKey" AS ENUM ('ORDER_CONFIRMATION', 'VOUCHER_DELIVERY', 'OTP_LOGIN', 'OTP_REGISTER', 'OTP_RESET', 'OTP_TEASER_GATE', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billingAddressId" TEXT,
ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'PAYPAL',
ADD COLUMN     "providerCaptureId" TEXT,
ADD COLUMN     "providerOrderId" TEXT,
ADD COLUMN     "providerPayload" JSONB,
ADD COLUMN     "refundAmount" INTEGER,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundRef" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ALTER COLUMN "paypalOrderId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BillingAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "company" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherDelivery" (
    "id" TEXT NOT NULL,
    "entitlementId" TEXT NOT NULL,
    "orderId" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "voucherCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "key" "EmailTemplateKey" NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyMjml" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingAddress_userId_idx" ON "BillingAddress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherDelivery_entitlementId_key" ON "VoucherDelivery"("entitlementId");

-- CreateIndex
CREATE INDEX "VoucherDelivery_status_scheduledFor_idx" ON "VoucherDelivery"("status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_provider_providerOrderId_key" ON "Order"("provider", "providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_provider_providerCaptureId_key" ON "Order"("provider", "providerCaptureId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "BillingAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingAddress" ADD CONSTRAINT "BillingAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherDelivery" ADD CONSTRAINT "VoucherDelivery_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill provider columns from legacy PayPal columns. provider is already
-- 'PAYPAL' by default, so we only need to copy the identifiers.
UPDATE "Order" SET "providerOrderId" = "paypalOrderId" WHERE "providerOrderId" IS NULL AND "paypalOrderId" IS NOT NULL;
UPDATE "Order" SET "providerCaptureId" = "paypalCaptureId" WHERE "providerCaptureId" IS NULL AND "paypalCaptureId" IS NOT NULL;

