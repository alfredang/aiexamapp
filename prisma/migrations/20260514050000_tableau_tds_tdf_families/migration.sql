-- Targeted migration: add 2 new Tableau exam families.
-- 1) Tableau Desktop Specialist (TDS-C01): 45q / 60min / 75% pass — 6 P-variants
--    Reuses existing orphan TDS-P5 by renaming to TDS-C01-P5 (preserves its 60 questions).
-- 2) Tableau Desktop Foundations (Analytics-101): 40q / 70min / 48% pass — 6 P-variants
-- Both families share the same 4 official Tableau domains. Each gets a bundle with
-- 6 PRACTICE items + 1 VOUCHER (anchored on P1).
-- All exam + bundle rows land as INACTIVE for admin review.
-- Idempotent via NOT EXISTS guards; uses Vendor slug lookup so it works across envs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- 1) Tableau Desktop Specialist (TDS-C01) family
-- =====================================================================

-- 1a) Rename existing orphan TDS-P5 → TDS-C01-P5 (preserves the 60 existing questions)
UPDATE "Exam"
   SET code = 'TDS-C01-P5',
       slug = 'tableau-tds-p5',
       title = 'Tableau Desktop Specialist',
       level = 'Foundational',
       "durationMinutes" = 60,
       "passingScore" = 75,
       "questionCount" = 45,
       label = NULL,
       domains = $json$[{"name":"Connecting to and Preparing Data","weight":17},{"name":"Exploring and Analyzing Data","weight":40},{"name":"Sharing Insights","weight":32},{"name":"Understanding Tableau Concepts","weight":11}]$json$::jsonb
 WHERE code = 'TDS-P5';

-- 1b) Create the 5 new TDS-C01 P-variants (P1, P2, P3, P4, P6)
INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDS-C01-P1', 'tableau-tds-p1',
  'Tableau Desktop Specialist',
  'Practice exam for the Tableau Desktop Specialist (TDS-C01) certification. Covers connecting/preparing data, exploring & analyzing, sharing insights, and core Tableau concepts.',
  'Foundational', 60, 75, 45,
  $json$[{"name":"Connecting to and Preparing Data","weight":17},{"name":"Exploring and Analyzing Data","weight":40},{"name":"Sharing Insights","weight":32},{"name":"Understanding Tableau Concepts","weight":11}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDS-C01-P1');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDS-C01-P2', 'tableau-tds-p2',
  'Tableau Desktop Specialist',
  'Practice exam for the Tableau Desktop Specialist (TDS-C01) certification. Covers connecting/preparing data, exploring & analyzing, sharing insights, and core Tableau concepts.',
  'Foundational', 60, 75, 45,
  $json$[{"name":"Connecting to and Preparing Data","weight":17},{"name":"Exploring and Analyzing Data","weight":40},{"name":"Sharing Insights","weight":32},{"name":"Understanding Tableau Concepts","weight":11}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDS-C01-P2');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDS-C01-P3', 'tableau-tds-p3',
  'Tableau Desktop Specialist',
  'Practice exam for the Tableau Desktop Specialist (TDS-C01) certification. Covers connecting/preparing data, exploring & analyzing, sharing insights, and core Tableau concepts.',
  'Foundational', 60, 75, 45,
  $json$[{"name":"Connecting to and Preparing Data","weight":17},{"name":"Exploring and Analyzing Data","weight":40},{"name":"Sharing Insights","weight":32},{"name":"Understanding Tableau Concepts","weight":11}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDS-C01-P3');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDS-C01-P4', 'tableau-tds-p4',
  'Tableau Desktop Specialist',
  'Practice exam for the Tableau Desktop Specialist (TDS-C01) certification. Covers connecting/preparing data, exploring & analyzing, sharing insights, and core Tableau concepts.',
  'Foundational', 60, 75, 45,
  $json$[{"name":"Connecting to and Preparing Data","weight":17},{"name":"Exploring and Analyzing Data","weight":40},{"name":"Sharing Insights","weight":32},{"name":"Understanding Tableau Concepts","weight":11}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDS-C01-P4');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDS-C01-P6', 'tableau-tds-p6',
  'Tableau Desktop Specialist',
  'Practice exam for the Tableau Desktop Specialist (TDS-C01) certification. Covers connecting/preparing data, exploring & analyzing, sharing insights, and core Tableau concepts.',
  'Foundational', 60, 75, 45,
  $json$[{"name":"Connecting to and Preparing Data","weight":17},{"name":"Exploring and Analyzing Data","weight":40},{"name":"Sharing Insights","weight":32},{"name":"Understanding Tableau Concepts","weight":11}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDS-C01-P6');

-- 1c) Bundle for Specialist
INSERT INTO "Bundle" (id, slug, title, description, price, "priceVoucher", published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'tableau-tds',
  'Tableau Desktop Specialist',
  'All 6 Tableau Desktop Specialist (TDS-C01) practice exams in one bundle — covers connecting and preparing data, exploring and analyzing data, sharing insights, and understanding core Tableau concepts.',
  2000, 10000, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Bundle" WHERE slug = 'tableau-tds');

-- 1d) Bundle items: 6 PRACTICE + 1 VOUCHER (on P1)
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 1
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-tds' AND e.code = 'TDS-C01-P1'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 2
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-tds' AND e.code = 'TDS-C01-P2'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 3
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-tds' AND e.code = 'TDS-C01-P3'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 4
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-tds' AND e.code = 'TDS-C01-P4'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 5
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-tds' AND e.code = 'TDS-C01-P5'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 6
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-tds' AND e.code = 'TDS-C01-P6'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'VOUCHER'::"Tier", 7
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-tds' AND e.code = 'TDS-C01-P1'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'VOUCHER');

-- =====================================================================
-- 2) Tableau Desktop Foundations (Analytics-101) family
-- =====================================================================

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'ANALYTICS-101-P1', 'tableau-foundations-p1',
  'Salesforce Certified Tableau Desktop Foundations',
  'Practice exam for the Salesforce Certified Tableau Desktop Foundations (Analytics-101) beginner certification. Introduces connecting & preparing data, exploring & analyzing data, sharing insights, and understanding core Tableau concepts.',
  'Foundational', 70, 48, 40,
  $json$[{"name":"Connecting to and Preparing Data","weight":25},{"name":"Exploring and Analyzing Data","weight":35},{"name":"Sharing Insights","weight":25},{"name":"Understanding Tableau Concepts","weight":15}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'ANALYTICS-101-P1');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'ANALYTICS-101-P2', 'tableau-foundations-p2',
  'Salesforce Certified Tableau Desktop Foundations',
  'Practice exam for the Salesforce Certified Tableau Desktop Foundations (Analytics-101) beginner certification. Introduces connecting & preparing data, exploring & analyzing data, sharing insights, and understanding core Tableau concepts.',
  'Foundational', 70, 48, 40,
  $json$[{"name":"Connecting to and Preparing Data","weight":25},{"name":"Exploring and Analyzing Data","weight":35},{"name":"Sharing Insights","weight":25},{"name":"Understanding Tableau Concepts","weight":15}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'ANALYTICS-101-P2');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'ANALYTICS-101-P3', 'tableau-foundations-p3',
  'Salesforce Certified Tableau Desktop Foundations',
  'Practice exam for the Salesforce Certified Tableau Desktop Foundations (Analytics-101) beginner certification. Introduces connecting & preparing data, exploring & analyzing data, sharing insights, and understanding core Tableau concepts.',
  'Foundational', 70, 48, 40,
  $json$[{"name":"Connecting to and Preparing Data","weight":25},{"name":"Exploring and Analyzing Data","weight":35},{"name":"Sharing Insights","weight":25},{"name":"Understanding Tableau Concepts","weight":15}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'ANALYTICS-101-P3');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'ANALYTICS-101-P4', 'tableau-foundations-p4',
  'Salesforce Certified Tableau Desktop Foundations',
  'Practice exam for the Salesforce Certified Tableau Desktop Foundations (Analytics-101) beginner certification. Introduces connecting & preparing data, exploring & analyzing data, sharing insights, and understanding core Tableau concepts.',
  'Foundational', 70, 48, 40,
  $json$[{"name":"Connecting to and Preparing Data","weight":25},{"name":"Exploring and Analyzing Data","weight":35},{"name":"Sharing Insights","weight":25},{"name":"Understanding Tableau Concepts","weight":15}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'ANALYTICS-101-P4');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'ANALYTICS-101-P5', 'tableau-foundations-p5',
  'Salesforce Certified Tableau Desktop Foundations',
  'Practice exam for the Salesforce Certified Tableau Desktop Foundations (Analytics-101) beginner certification. Introduces connecting & preparing data, exploring & analyzing data, sharing insights, and understanding core Tableau concepts.',
  'Foundational', 70, 48, 40,
  $json$[{"name":"Connecting to and Preparing Data","weight":25},{"name":"Exploring and Analyzing Data","weight":35},{"name":"Sharing Insights","weight":25},{"name":"Understanding Tableau Concepts","weight":15}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'ANALYTICS-101-P5');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'ANALYTICS-101-P6', 'tableau-foundations-p6',
  'Salesforce Certified Tableau Desktop Foundations',
  'Practice exam for the Salesforce Certified Tableau Desktop Foundations (Analytics-101) beginner certification. Introduces connecting & preparing data, exploring & analyzing data, sharing insights, and understanding core Tableau concepts.',
  'Foundational', 70, 48, 40,
  $json$[{"name":"Connecting to and Preparing Data","weight":25},{"name":"Exploring and Analyzing Data","weight":35},{"name":"Sharing Insights","weight":25},{"name":"Understanding Tableau Concepts","weight":15}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau' AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'ANALYTICS-101-P6');

-- 2b) Bundle for Foundations
INSERT INTO "Bundle" (id, slug, title, description, price, "priceVoucher", published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'tableau-foundations',
  'Salesforce Certified Tableau Desktop Foundations',
  'All 6 Salesforce Certified Tableau Desktop Foundations (Analytics-101) practice exams in one bundle — beginner-friendly intro to Tableau Desktop fundamentals across data prep, exploration, sharing, and core concepts.',
  1500, 10000, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Bundle" WHERE slug = 'tableau-foundations');

-- 2c) Bundle items
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 1
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-foundations' AND e.code = 'ANALYTICS-101-P1'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 2
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-foundations' AND e.code = 'ANALYTICS-101-P2'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 3
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-foundations' AND e.code = 'ANALYTICS-101-P3'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 4
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-foundations' AND e.code = 'ANALYTICS-101-P4'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 5
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-foundations' AND e.code = 'ANALYTICS-101-P5'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 6
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-foundations' AND e.code = 'ANALYTICS-101-P6'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'VOUCHER'::"Tier", 7
FROM "Bundle" b, "Exam" e WHERE b.slug = 'tableau-foundations' AND e.code = 'ANALYTICS-101-P1'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'VOUCHER');
