-- Microsoft blueprint refresh — single-touch (AZ-900 / DP-300 / DP-900).
--
-- Why: drift audit on 2026-05-20 (memory: project_microsoft_drift_audit_2026_05_20)
-- found three certs whose Exam.domains JSON has weights outside the current
-- MS Learn study-guide ranges. This migration realigns only the JSON blob;
-- no question rows are touched, no Exam rows are added/removed/published.
--
-- SAFE BY CONSTRUCTION:
--   - Slug-keyed (codes diverge between local and prod per
--     feedback_topup_key_by_slug.md).
--   - Only updates the `domains` column on three specific Exam rows.
--   - Never touches published / deletedAt / questionCount.
--   - Idempotent — re-running rewrites the same JSON.
--   - DP-300 affects every -P\d variant (slug LIKE 'microsoft-dp-300-p%')
--     because all variants of a cert share the same blueprint. Same for
--     the other two.

-- AZ-900 (single exam row, slug 'microsoft-az-900').
-- Old: 25 / 35 / 40 (D3 5pp above MS Learn upper bound 35).
-- New: 28 / 40 / 32  (all inside 25–30 / 35–40 / 30–35).
UPDATE "Exam"
SET "domains" = '[
  {"name":"Cloud concepts","weight":28},
  {"name":"Azure architecture and services","weight":40},
  {"name":"Azure management and governance","weight":32}
]'::jsonb
WHERE slug = 'microsoft-az-900';

-- DP-300 (all -P\d variants share the same blueprint).
-- Old: 18 / 18 / 28 / 14 / 22 (D2 and D4 below range; D3 above range).
-- New: 18 / 22 / 23 / 17 / 20 (all inside 15–20 / 20–25 / 20–25 / 15–20 / 20–25).
UPDATE "Exam"
SET "domains" = '[
  {"name":"Plan and implement data platform resources","weight":18},
  {"name":"Implement a secure environment","weight":22},
  {"name":"Monitor, configure, and optimize database resources","weight":23},
  {"name":"Configure and manage automation of tasks","weight":17},
  {"name":"Plan and configure a high availability and disaster recovery (HADR) environment","weight":20}
]'::jsonb
WHERE slug LIKE 'microsoft-dp-300-p%' OR slug = 'microsoft-dp-300';

-- DP-900 (all -P\d variants share the same blueprint).
-- Old: 28 / 22 / 18 / 32 (D4 2pp above range + name "Analytics workloads on
-- Azure" was renamed by MS to "Describe an analytics workload").
-- New: 28 / 22 / 20 / 30 with renamed D4.
UPDATE "Exam"
SET "domains" = '[
  {"name":"Describe core data concepts","weight":28},
  {"name":"Identify considerations for relational data on Azure","weight":22},
  {"name":"Describe considerations for non-relational data on Azure","weight":20},
  {"name":"Describe an analytics workload","weight":30}
]'::jsonb
WHERE slug LIKE 'microsoft-dp-900-p%' OR slug = 'microsoft-dp-900';
