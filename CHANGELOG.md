# Changelog

All notable changes to **AI Exams** are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The section matching the
`MARKETING_VERSION` being submitted is published verbatim as the App Store
**What's New** by the `ios-auto-release` CI pipeline (`scripts/ci_submit.py`); edits
land here, not in App Store Connect.

## [Unreleased]

## [1.3] - 2026-10-25

### Added
- Sign in with a 6-digit code sent to your email — no password needed. Creating an
  account takes just your full name and email. Password sign-in is still available.
- History tab: best, average and latest score for each certification, the exam
  domains to focus on, and every attempt you've taken.
- Full score report after every attempt: correct/total with PASS or FAIL, results by
  exam domain (weakest first), and a review of every question against the answer key,
  filterable by All, Missed and Flagged. Retake in one tap.
- Exam mode now works like the live test: countdown timer, Flag for review, a Review
  Screen (Completed / Flagged / Incomplete) and automatic submission when time runs out.
- Practice mode: check each answer to see whether it's right, the explanation and its
  exam domain; jump to any question from the question grid.
- Multiple-select ("Select TWO answers") and sequencing questions.
- Resume an unfinished attempt straight from My Exams.

### Changed
- The app now focuses on taking the practice exams linked to your account. The catalog
  and free teasers were removed.
- Your session is stored in the iOS Keychain.

### Removed
- The role-gated staff features (expense/medical claims with camera receipt capture,
  timesheet clock in/out) shipped in 1.1 — they were built for the wrong app and belong
  in the separate **Tertiary HRMS** app. This app is exam practice only.

## [1.1] - 2026-07-03

### Added
- Staff tab (visible to staff, intern, and contractor accounts): submit expense and
  medical claims by photographing the receipt with the camera.
- Timesheet clock in/out for part-time contractors and interns, with live shift timer,
  weekly hours, and recent shifts.

## [1.0.1] - 2026-06-20

### Changed
- Renamed the app on the App Store to **Certificate Practice Exams** for clearer discovery.

## [1.0] - 2026-06-20

### Added
- Sign in / register and take practice exams against entitlements owned on the website.
- Browse the exam catalog and your purchased library.
- Practice mode with answer explanations; timed Exam mode.
- Free teaser attempts for previewing an exam.
- In-app account deletion (Account tab).
