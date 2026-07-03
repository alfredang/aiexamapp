# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**AI Exams** — a pure-native iOS (SwiftUI) client for the Tertiary Exams practice-exam
platform. There is **no backend code in this repo**. The app is a thin client that talks
to the production REST API at `https://exams.tertiaryinfotech.com` over the
`/api/mobile/*` endpoints. The web app / backend lives in a separate repository.

**Scope (intentionally limited):** users sign in, browse the catalog, and take
**practice exams** (including free teasers) against entitlements they already own. There
is **no checkout / payment / purchase flow** in this app — buying is done on the website.
Do not add in-app purchase or checkout UI here.

- Bundle id: `com.tertiaryinfotech.aiexams`
- Team: `GU9WTSTX9M` · Deployment target: iOS 17.0 · Device family: iPhone + iPad (1,2)
- Portrait-only on iPhone; all orientations on iPad.

## Repositories (do not mix these up)

- **This iOS app → <https://github.com/alfredang/aiexamapp>** (git `origin`). All pushes,
  PRs, and the **CI/CD auto-release** (`ios-auto-release` skill / GitHub Actions) target
  **`alfredang/aiexamapp`**.
- **The website → <https://github.com/alfredang/ai-exams>** serves
  <https://exams.tertiaryinfotech.com/> (separate Next.js/Prisma repo). **Never push to,
  force-push, or otherwise overwrite `ai-exams` from this project** — it is a different
  codebase that only shares early git history. If `origin` ever points at `ai-exams`,
  repoint it to `aiexamapp` before pushing.

## Common commands

The Xcode project is generated from [project.yml](project.yml) with **XcodeGen** — edit
`project.yml`, not the `.xcodeproj`, for target/setting changes, then regenerate.

```bash
# Regenerate the Xcode project after editing project.yml
xcodegen generate

# Build for the simulator (no signing)
xcodebuild -project AIExams.xcodeproj -scheme AIExams \
  -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO

# List connected devices / UDIDs
xcrun devicectl list devices

# Build + install on a connected iPhone (Debug, auto-signed)
xcodebuild -project AIExams.xcodeproj -scheme AIExams -configuration Debug \
  -destination 'id=<device-udid>' -allowProvisioningUpdates -derivedDataPath build
xcrun devicectl device install app --device <device-udid> \
  build/Build/Products/Debug-iphoneos/AIExams.app
```

App Store archive / upload is handled by the `app-store-submission` skill in
[.claude/skills/app-store-submission/](.claude/skills/app-store-submission/) plus
[ExportOptions.plist](ExportOptions.plist) (manual signing, `Apple Distribution`,
profile `AI Exams App Store`). Bump `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION` in
[project.yml](project.yml) per release.

## Architecture

Single-target SwiftUI app under [AIExams/](AIExams/). No third-party packages — only
Foundation, SwiftUI, and `URLSession`.

### Entry & navigation
- [AIExams/AIExamsApp.swift](AIExams/AIExamsApp.swift) — `@main`; injects a single
  `SessionStore` as an `@EnvironmentObject`.
- [AIExams/Views/RootView.swift](AIExams/Views/RootView.swift) — `MainTabView` with three
  tabs: **My Exams** ([LibraryView](AIExams/Views/LibraryView.swift)), **Catalog**
  ([CatalogView](AIExams/Views/CatalogView.swift)), **Account**
  ([AccountView](AIExams/Views/AccountView.swift)).

### Networking
- [AIExams/Services/APIClient.swift](AIExams/Services/APIClient.swift) — a value type
  wrapping `URLSession`. All calls go through two private generic `send(...)` helpers that
  attach `Authorization: Bearer <token>` when `authorized` (the default). Non-2xx
  responses are decoded into `ServerError { error }` and surfaced as `APIError.server`.
  Endpoints used: `auth/login`, `auth/register`, `catalog`, `library`,
  `attempts/start`, `attempts/{id}`, `attempts/answer`, `attempts/submit`,
  `account` (DELETE), plus the staff endpoints `staff/claims` (GET/POST) and
  `staff/timesheet` (+ `/clock-in`, `/clock-out`) documented in
  [docs/STAFF_API.md](docs/STAFF_API.md). The base URL is hardcoded here — change it in
  one place to point at a staging server.
- [AIExams/Models/APIModels.swift](AIExams/Models/APIModels.swift) — all Codable
  request/response DTOs (`AuthResponse`, `User`, `CatalogResponse`, `LibraryResponse`,
  attempt/answer/score types, `ExamMode`). Keep these in sync with the backend's
  `/api/mobile/*` JSON shapes — there is no schema sharing.

### State / auth
- [AIExams/Services/SessionStore.swift](AIExams/Services/SessionStore.swift) —
  `@MainActor ObservableObject`, the single source of auth truth. Persists `token` and
  `user` in **`UserDefaults`** (keys `ai-exams-token`, `ai-exams-user`) — note: not the
  Keychain. Exposes `api: APIClient` whose `tokenProvider` reads the current token.
  `errorMessage` drives auth error UI. On 401-style failures the user must re-auth (there
  is no refresh-token flow).

### Exam runtime
- [AIExams/Views/StartExamView.swift](AIExams/Views/StartExamView.swift) starts an
  attempt (Practice or Exam mode, or a free teaser);
  [AIExams/Views/ExamRunnerView.swift](AIExams/Views/ExamRunnerView.swift) drives the
  question flow. Scoring is computed server-side via `attempts/submit` — never trust
  client-side correctness. Practice mode reveals explanations; Exam mode is timed.

### Staff features (role-gated)
- [AIExams/Views/StaffView.swift](AIExams/Views/StaffView.swift) — a **Staff** tab shown
  only when `user.role` is staff/admin/intern/contractor (`User.isStaffMember` in
  [StaffModels.swift](AIExams/Models/StaffModels.swift)). Timesheet clock in/out plus
  expense/medical claims with camera receipt capture
  ([NewClaimView](AIExams/Views/NewClaimView.swift),
  [CameraPicker](AIExams/Views/CameraPicker.swift)). Google Drive upload and timesheet
  persistence happen **server-side**; the backend contract is
  [docs/STAFF_API.md](docs/STAFF_API.md). Regular customers never see this tab.

### Theme
- [AIExams/Theme.swift](AIExams/Theme.swift) — brand colors (`primary` blue, `secondary`
  teal, `highlight` amber) and the `.appCard()` view modifier. Use these instead of
  hardcoding colors so the look stays consistent.

## Conventions & gotchas

- **Edit `project.yml`, then `xcodegen generate`.** Don't hand-edit `project.pbxproj`;
  it's regenerated and not the source of truth.
- **App icon**: `Assets.xcassets/AppIcon.appiconset` holds `AppIcon-1024.png` (+ an SVG
  source). The submission skill has `scripts/make_app_icon.swift` for regeneration.
- **Privacy**: [AIExams/PrivacyInfo.xcprivacy](AIExams/PrivacyInfo.xcprivacy) must stay
  accurate for App Review. `ITSAppUsesNonExemptEncryption` is set false in `project.yml`.
- **Account deletion** is implemented (`APIClient.deleteAccount` → `DELETE
  /api/mobile/account`) because App Review requires in-app account deletion. Keep it.
- The only project-level Claude tooling kept is the **app-store-submission** skill; see
  its [AGENTS.md](.claude/skills/app-store-submission/AGENTS.md) for the submission flow.
