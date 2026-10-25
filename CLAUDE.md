# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**AI Exams** — a pure-native iOS (SwiftUI) client for the Tertiary Exams practice-exam
platform. There is **no backend code in this repo**. The app is a thin client that talks
to the production REST API at `https://exams.tertiaryinfotech.com` over the
`/api/mobile/*` endpoints. The web app / backend lives in a separate repository.

**Scope (intentionally limited):** customers sign in and take the **practice exams they
already own** (bought or granted on the website) in Exam mode and Practice mode, then
review their performance. There is **no catalog, no free teasers, no checkout / payment /
purchase flow and no admin features** — and no copy or links that steer users to buy on
the website (App Store 3.1.1/3.1.3). An empty library says "Practice exams linked to your
account appear here". **Do not add internal staff/HR features** (expense claims,
timesheets, etc.) here either — those belong in the separate **Tertiary HRMS app**
(`~/projects/mobile/iOS/hrmsapp`); they were mistakenly shipped in v1.1 and removed in v1.2.

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
- [AIExams/AIExamsApp.swift](AIExams/AIExamsApp.swift) — `@main`; injects `SessionStore`
  and `ExamLauncher` and owns the full-screen attempt cover (`AttemptFlowView`).
- [AIExams/Views/RootView.swift](AIExams/Views/RootView.swift) — signed out → `AuthView`;
  signed in → `MainTabView` with **My Exams** ([LibraryView](AIExams/Views/LibraryView.swift)),
  **History** ([HistoryView](AIExams/Views/HistoryView.swift)), **Account**
  ([AccountView](AIExams/Views/AccountView.swift)).
- [AIExams/Services/ExamLauncher.swift](AIExams/Services/ExamLauncher.swift) — opens an
  attempt from any tab (resume the newest unfinished attempt in that mode, else start one)
  and bumps `refreshCount` when the cover closes so lists reload scores.

### Networking
- [AIExams/Services/APIClient.swift](AIExams/Services/APIClient.swift) — `URLSession`
  wrapper; `Authorization: Bearer <token>`; non-2xx → `APIError.server(error)`, 401 →
  `APIError.unauthorized` (the session store signs out). Endpoints: `auth/code/request`,
  `auth/code/verify` (primary email-code sign-in), `auth/login` (password — kept for the App
  Review demo account), `library`, `attempts` (history), `attempts/start`, `attempts/{id}`,
  `attempts/answer`, `attempts/mark`, `attempts/submit`, `account` (DELETE).
- [AIExams/Models/APIModels.swift](AIExams/Models/APIModels.swift) — Codable DTOs. Keep in
  sync with the website repo's `src/app/api/mobile/*` (no schema sharing). `references`
  are decoded leniently (URL strings or `{url,label}`).

### State / auth
- [AIExams/Services/SessionStore.swift](AIExams/Services/SessionStore.swift) — token in
  the **Keychain** ([Keychain.swift](AIExams/Services/Keychain.swift)), user profile in
  UserDefaults; tokens from ≤1.2 (UserDefaults) are migrated on launch. Mobile tokens last
  30 days; there is no refresh flow — a 401 signs the user out.

### Exam runtime
- [AIExams/Views/ExamRunnerView.swift](AIExams/Views/ExamRunnerView.swift) — mirrors the
  web runner rules: **Exam mode** counts down from the server's `remainingSec`, saves each
  answer via `attempts/answer`, hides the domain, shows the Review Screen (Completed /
  Flagged / Incomplete, Review All / Flagged / Incomplete, Submit Exam — disabled until all
  answered) once the candidate reaches the end, and auto-submits at 0 ("Time's up").
  **Practice mode** reveals correctness, explanation and exam domain on Check and can
  finish anytime. MULTI uses `selectCount`; ORDERING shows `steps` as Step 1…N and the
  answer is the tapped sequence of ids. Scoring is always server-side.
- [AIExams/Views/ResultsView.swift](AIExams/Views/ResultsView.swift) — score report from
  `attempts/{id}` after submit (correct/explanation/references only come back then).
- [AIExams/Services/ScreenshotAutomation.swift](AIExams/Services/ScreenshotAutomation.swift)
  — **DEBUG only**: `SIMCTL_CHILD_SHOT_EMAIL/SHOT_PASSWORD/SHOT_ROUTE` (exam, review,
  practice, results, history, account) sign in and open a screen for App Store screenshots,
  since synthetic Simulator taps are unreliable.

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
