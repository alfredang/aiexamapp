-- Bundle-only pricing model: Exam loses its three price columns.
-- Values were only ever read at order-placement time; placed orders snapshot
-- the amount in Order.amount, so dropping is non-destructive for history.
ALTER TABLE "Exam"
  DROP COLUMN "pricePractice",
  DROP COLUMN "priceBundle",
  DROP COLUMN "priceVoucher";
