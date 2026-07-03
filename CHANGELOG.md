# Changelog

All notable changes to **AI Exams** are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The section matching the
`MARKETING_VERSION` being submitted is published verbatim as the App Store
**What's New** by the `ios-auto-release` CI pipeline (`scripts/ci_submit.py`); edits
land here, not in App Store Connect.

## [Unreleased]

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
