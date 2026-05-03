# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

```bash
# Local infra (Postgres + MailHog). Postgres is mapped to host :55432 to avoid
# conflicts with a system Postgres on :5432 — keep this in DATABASE_URL.
docker compose up -d postgres mailhog

# First-time setup
npm install --legacy-peer-deps
cp .env.example .env             # then set DATABASE_URL host port to 55432
npx prisma migrate dev --name init
npm run db:seed                  # admin + AWS SAA-C03 (60q, 30 teaser) + AZ-900 + CompTIA vendor

# Day-to-day
npm run dev -- -p 3040 -H 127.0.0.1   # repo uses port 3040
npm run typecheck
npm run lint
npm run build                          # `prisma generate && next build`
npm run db:studio

# After schema.prisma changes
npx prisma migrate dev --name <change>
```

There is no test runner. Manual verification flows live in [README.md](README.md).

## Architecture

Single Next.js 15 App Router app — server logic (PayPal webhooks, Auth.js, Claude SSE, voucher PDF) lives in route handlers. The brief mentioned Vite as an alternative; we chose Next.js for the unified server.

### Routing surface (key paths)
- `/` — gradient hero + vendor grid + popular exams
- `/practice-exams` (catalog) → `/practice-exams/[vendor]` → `/practice-exams/[vendor]/[slug]` (detail) → `…/teaser` (free 30-question teaser launcher)
- `/login`, `/signup`, `/verify-otp`, `/forgot-password` — two-card layout, dual auth
- `/exam/[attemptId]` — unified runner for Practice and Exam mode (no separate /practice/ route)
- `/results/[attemptId]` — per-domain breakdown + review
- `/checkout/[examId]?tier=PRACTICE|BUNDLE|VOUCHER`
- `/my-content`, `/my-content/{exams,attempts,vouchers,settings}`
- `/admin/{vendors,exams,questions,users,orders}` and `/admin/exams/[id]/generate`

### Auth & RBAC (subtle)
- **Two NextAuth Credentials providers** in [src/lib/auth.ts](src/lib/auth.ts): id `password` and id `otp`. The OTP provider verifies a code from `OtpCode` (no FK to user) and creates the user if needed.
- **Edge-safe split**: middleware imports [src/lib/auth.config.ts](src/lib/auth.config.ts) (no providers, no Prisma, no argon2) — argon2 has `node:crypto` imports that webpack edge cannot bundle. The full config in [src/lib/auth.ts](src/lib/auth.ts) extends it with the heavy providers.
- **OTP table has no FK** ([prisma/schema.prisma](prisma/schema.prisma) `OtpCode`) so codes can be issued before the user exists — required for the teaser→signup flow. Purposes: `LOGIN | REGISTER | RESET | TEASER_GATE`.
- [src/middleware.ts](src/middleware.ts) gates `/admin/*`, `/api/admin/*`, `/my-content/*`. Admin routes also re-check `role === 'ADMIN'` server-side.
- **In-memory rate limiter** ([src/lib/ratelimit.ts](src/lib/ratelimit.ts)) does NOT survive restarts and does not work across replicas. Replace with Redis/Upstash before scaling out.
- Password hashing uses **argon2id** (deviates from spec's bcrypt — argon2id is OWASP-recommended).

### Exam runtime — the most subtle part
- [components/exam-runner.tsx](src/components/exam-runner.tsx) is one client component for both modes. Mode is a prop. Differences: PRACTICE reveals correctness/explanation immediately; EXAM auto-saves every 15s and auto-submits at timer 0.
- **Question types**: schema reserves `SINGLE | MULTI | TRUE_FALSE | ORDERING | HOTSPOT`, but the runner currently only renders SINGLE/MULTI/TRUE_FALSE. ORDERING and HOTSPOT are deferred — admins can still seed them but users can't take them yet.
- `Attempt.responses` is `Json` shaped as `Record<questionId, { answer: string[]; flagged?: boolean; timeSpent?: number }>` (see [src/lib/attempts.ts](src/lib/attempts.ts) `Responses` type). There is **no AttemptAnswer table** — flags, answers, and per-question timing all live in this JSON blob.
- Server-side timing for Exam mode comes from `Attempt.expiresAt` set at start. The page recomputes remaining seconds from `expiresAt - now()`. Submit also recomputes the score from responses + question definitions in [src/lib/attempts.ts](src/lib/attempts.ts) `scoreAttempt()` — never trust client-reported correctness.
- **Autosave** flushes the in-memory responses every 15s through `/api/attempts/autosave` if the runner has dirty state. There is also a `beforeunload` warning. Resume is automatic — visiting `/exam/:id` for an unsubmitted attempt rehydrates from `attempt.responses`.
- **Teaser flow**: anonymous users get an httpOnly `gt` cookie (random `g_<uuid>`); the Attempt is created with `guestToken = gt` and `userId = null`. After answering 20 or 30, [components/teaser-gate.tsx](src/components/teaser-gate.tsx) modal asks for email → OTP (`TEASER_GATE`) → user upserted → `Attempt.userId` reassigned in the OTP-verify endpoint via cookie match. Don't break this path: the migration is in [src/app/api/otp/verify/route.ts](src/app/api/otp/verify/route.ts).

### Payments / fulfillment
- All money paths converge on [src/lib/fulfill.ts](src/lib/fulfill.ts) `fulfillOrder()`. Idempotent (checks `status === 'PAID'`, upserts `paypalCaptureId`).
- **Tier model** (no more ExamProduct table): `Order` has `examId + tier`. Prices are inline on `Exam` (`pricePractice`, `priceBundle`, `priceVoucher`). `Entitlement(userId, examId, tier)` is the unique key — `BUNDLE` purchases write **two** entitlement rows: `PRACTICE` and `VOUCHER`.
- **Voucher** code lives on `Entitlement.voucher` (no separate Voucher table). Generated by [src/lib/utils.ts](src/lib/utils.ts) `genVoucherCode()`. PDF is rendered by [src/lib/voucher-pdf.ts](src/lib/voucher-pdf.ts) using `pdf-lib`, attached to the purchase email and downloadable from `/api/vouchers/[id]/pdf`.
- [api/paypal/capture](src/app/api/paypal/capture/route.ts) is the inline happy path; [api/paypal/webhook](src/app/api/paypal/webhook/route.ts) is the safety net for closed tabs — both call `fulfillOrder`.

### AI generation (admin)
- **Tool use, not JSON-from-text**: [src/lib/claude.ts](src/lib/claude.ts) defines a `submit_question` tool and emits each tool call as a question event. Schema enforced with Zod (`QuestionSchema`).
- **SSE streaming** to admin: [api/admin/generate-questions](src/app/api/admin/generate-questions/route.ts) writes each generated question to the DB as DRAFT then emits an SSE `question` event so the UI in [admin/exams/[id]/generate/generator-client.tsx](src/app/admin/exams/[id]/generate/generator-client.tsx) shows them as they arrive with per-row Approve/Discard.
- System prompt explicitly forbids real-exam claims and requires reference URLs. Preserve that wording when editing.
- Domain weighting is forwarded from `Exam.domains` so generation distribution can match the published blueprint.

### Data model invariants
- `Entitlement` unique on `(userId, examId, tier)` — same exam can have multiple tiers granted.
- `Question.status` is `DRAFT | PUBLISHED | ARCHIVED`. Public reads filter by `PUBLISHED`. Drafts are admin-only.
- `Question.isTeaser` flags the 30-question free preview set per exam (the spec dropped this column but the teaser still needs a defined subset; we kept the boolean).
- `Question.options` is `Json` shaped as `[{id, text}]`. `Question.correct` is `Json` shaped as `string[]` of option ids. There is **no AnswerOption table** — keep these JSON shapes consistent across seed, generator, and runner.
- `AdminLog` is written by the AI generator. Add entries when adding admin mutations.

## Things to watch out for

- **Postgres host port 55432**, not 5432 (system Postgres collision). Keep `docker-compose.yml` and `.env` in sync.
- **`--legacy-peer-deps`** is required for `npm install` because `next-auth@5.0.0-beta.25` and a few Radix peers don't yet declare React 19. Don't drop the flag.
- **Edge runtime**: never import `argon2`, `pdf-lib`, `@anthropic-ai/claude-agent-sdk`, `nodemailer`, or `@prisma/client` from middleware or any file middleware imports. Use `auth.config.ts` for the edge-safe shape.
- **Prisma schema** must use multi-line block syntax — Prisma rejects `enum X { A B }` on one line.
- **`(session.user as any).{id,role}`** casts are intentional — NextAuth's default `User` type doesn't include them. Add a module augmentation if you want to remove the casts.
- **`useSearchParams()` requires a `<Suspense>` boundary** at the page level for Next 15 build to succeed (see [src/app/login/page.tsx](src/app/login/page.tsx) for the pattern).
- **MailHog** catches OTP and purchase emails in dev — http://127.0.0.1:8025. SMTP failures are swallowed, so registration won't error if mail is down but the user also won't see the code.

## Deployment

Coolify-ready via [Dockerfile](Dockerfile) (multi-stage, Next standalone). Container runs `prisma migrate deploy` before `node server.js` on boot. See [README.md](README.md) for env var checklist.
