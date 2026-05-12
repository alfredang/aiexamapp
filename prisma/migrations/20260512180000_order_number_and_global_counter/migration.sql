-- Add Order.number (nullable initially so existing rows pass).
ALTER TABLE "Order" ADD COLUMN "number" TEXT;

-- New global NumberCounter table (one row per entity kind).
CREATE TABLE "NumberCounter" (
  "kind"      TEXT PRIMARY KEY,
  "last"      INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed INVOICE counter from existing per-year totals so new invoices
-- continue past the highest issued number.
INSERT INTO "NumberCounter" ("kind", "last", "updatedAt")
SELECT 'INVOICE', COALESCE(SUM("last"), 0), NOW() FROM "InvoiceCounter";

-- Renumber existing invoices to the new global format INV-000001…
-- Use issueDate ASC so the oldest gets 000001.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "issueDate" ASC, "createdAt" ASC) AS rn
  FROM "Invoice"
)
UPDATE "Invoice" i
SET "number" = 'INV-' || LPAD(ranked.rn::text, 6, '0')
FROM ranked
WHERE i."id" = ranked."id";

-- Drop the per-year InvoiceCounter, no longer used.
DROP TABLE "InvoiceCounter";

-- Assign Order numbers ORD-000001… by createdAt ASC.
WITH ranked_orders AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "Order"
)
UPDATE "Order" o
SET "number" = 'ORD-' || LPAD(ranked_orders.rn::text, 6, '0')
FROM ranked_orders
WHERE o."id" = ranked_orders."id";

-- Seed ORDER counter so future inserts continue past the last assigned.
INSERT INTO "NumberCounter" ("kind", "last", "updatedAt")
VALUES ('ORDER', (SELECT COUNT(*) FROM "Order"), NOW())
ON CONFLICT ("kind") DO UPDATE SET "last" = EXCLUDED."last";

-- Add the unique constraint after backfill.
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
