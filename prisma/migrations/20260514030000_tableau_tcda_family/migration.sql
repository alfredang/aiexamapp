-- Targeted migration: create Tableau Certified Data Analyst (TCDA) exam family.
-- Official spec: 65 questions (60 scored + 5 unscored) / 105 minutes / 65% passing.
-- 4-domain blueprint (weights estimated; admin can adjust later in UI).
-- Adds 6 P-variants (TDA-C01-P1..P6), one Bundle, and 7 BundleItems (6 PRACTICE + 1 VOUCHER).
-- All exams + bundle land as INACTIVE (published=false) for admin review before going live.
-- Idempotent via WHERE NOT EXISTS guards on every INSERT.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create the 6 P-variant Exam rows (idempotent)
INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDA-C01-P1', 'tableau-tcda-p1',
  'Tableau Certified Data Analyst',
  'Practice exam for the Tableau Certified Data Analyst (TDA-C01) certification. Covers connecting and transforming data, exploring and analyzing data, creating visualizations, and publishing & managing content in Tableau.',
  'Associate', 105, 65, 65,
  $json$[{"name":"Connect to and Transform Data","weight":24},{"name":"Explore and Analyze Data","weight":41},{"name":"Create Content","weight":26},{"name":"Publish and Manage Content","weight":9}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau'
AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDA-C01-P1');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDA-C01-P2', 'tableau-tcda-p2',
  'Tableau Certified Data Analyst',
  'Practice exam for the Tableau Certified Data Analyst (TDA-C01) certification. Covers connecting and transforming data, exploring and analyzing data, creating visualizations, and publishing & managing content in Tableau.',
  'Associate', 105, 65, 65,
  $json$[{"name":"Connect to and Transform Data","weight":24},{"name":"Explore and Analyze Data","weight":41},{"name":"Create Content","weight":26},{"name":"Publish and Manage Content","weight":9}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau'
AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDA-C01-P2');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDA-C01-P3', 'tableau-tcda-p3',
  'Tableau Certified Data Analyst',
  'Practice exam for the Tableau Certified Data Analyst (TDA-C01) certification. Covers connecting and transforming data, exploring and analyzing data, creating visualizations, and publishing & managing content in Tableau.',
  'Associate', 105, 65, 65,
  $json$[{"name":"Connect to and Transform Data","weight":24},{"name":"Explore and Analyze Data","weight":41},{"name":"Create Content","weight":26},{"name":"Publish and Manage Content","weight":9}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau'
AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDA-C01-P3');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDA-C01-P4', 'tableau-tcda-p4',
  'Tableau Certified Data Analyst',
  'Practice exam for the Tableau Certified Data Analyst (TDA-C01) certification. Covers connecting and transforming data, exploring and analyzing data, creating visualizations, and publishing & managing content in Tableau.',
  'Associate', 105, 65, 65,
  $json$[{"name":"Connect to and Transform Data","weight":24},{"name":"Explore and Analyze Data","weight":41},{"name":"Create Content","weight":26},{"name":"Publish and Manage Content","weight":9}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau'
AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDA-C01-P4');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDA-C01-P5', 'tableau-tcda-p5',
  'Tableau Certified Data Analyst',
  'Practice exam for the Tableau Certified Data Analyst (TDA-C01) certification. Covers connecting and transforming data, exploring and analyzing data, creating visualizations, and publishing & managing content in Tableau.',
  'Associate', 105, 65, 65,
  $json$[{"name":"Connect to and Transform Data","weight":24},{"name":"Explore and Analyze Data","weight":41},{"name":"Create Content","weight":26},{"name":"Publish and Manage Content","weight":9}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau'
AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDA-C01-P5');

INSERT INTO "Exam" (id, "vendorId", code, slug, title, description, level, "durationMinutes", "passingScore", "questionCount", domains, published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.id, 'TDA-C01-P6', 'tableau-tcda-p6',
  'Tableau Certified Data Analyst',
  'Practice exam for the Tableau Certified Data Analyst (TDA-C01) certification. Covers connecting and transforming data, exploring and analyzing data, creating visualizations, and publishing & managing content in Tableau.',
  'Associate', 105, 65, 65,
  $json$[{"name":"Connect to and Transform Data","weight":24},{"name":"Explore and Analyze Data","weight":41},{"name":"Create Content","weight":26},{"name":"Publish and Manage Content","weight":9}]$json$::jsonb,
  false, NOW(), NOW()
FROM "Vendor" v WHERE v.slug = 'tableau'
AND NOT EXISTS (SELECT 1 FROM "Exam" WHERE code = 'TDA-C01-P6');

-- 2) Create the Bundle (idempotent)
INSERT INTO "Bundle" (id, slug, title, description, price, "priceVoucher", published, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'tableau-tcda',
  'Tableau Certified Data Analyst',
  'All 6 Tableau Certified Data Analyst (TDA-C01) practice exams in one bundle — covers connecting and transforming data, exploring and analyzing data, creating visualizations, and publishing & managing content.',
  2000, 15000, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Bundle" WHERE slug = 'tableau-tcda');

-- 3) Bundle items: 6 PRACTICE tier entries (one per P-variant) + 1 VOUCHER tier on P1
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 1
FROM "Bundle" b, "Exam" e
WHERE b.slug = 'tableau-tcda' AND e.code = 'TDA-C01-P1'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');

INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 2
FROM "Bundle" b, "Exam" e
WHERE b.slug = 'tableau-tcda' AND e.code = 'TDA-C01-P2'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');

INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 3
FROM "Bundle" b, "Exam" e
WHERE b.slug = 'tableau-tcda' AND e.code = 'TDA-C01-P3'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');

INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 4
FROM "Bundle" b, "Exam" e
WHERE b.slug = 'tableau-tcda' AND e.code = 'TDA-C01-P4'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');

INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 5
FROM "Bundle" b, "Exam" e
WHERE b.slug = 'tableau-tcda' AND e.code = 'TDA-C01-P5'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');

INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'PRACTICE'::"Tier", 6
FROM "Bundle" b, "Exam" e
WHERE b.slug = 'tableau-tcda' AND e.code = 'TDA-C01-P6'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'PRACTICE');

-- VOUCHER tier on P1 (anchor exam for the voucher purchase path)
INSERT INTO "BundleItem" (id, "bundleId", "examId", tier, position)
SELECT gen_random_uuid()::text, b.id, e.id, 'VOUCHER'::"Tier", 7
FROM "Bundle" b, "Exam" e
WHERE b.slug = 'tableau-tcda' AND e.code = 'TDA-C01-P1'
AND NOT EXISTS (SELECT 1 FROM "BundleItem" bi WHERE bi."bundleId" = b.id AND bi."examId" = e.id AND bi.tier = 'VOUCHER');
