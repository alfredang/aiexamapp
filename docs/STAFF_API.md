# Staff API contract — claims & timesheet (app v1.1)

The iOS app (v1.1+) adds two staff-only features: **receipt-photo expense/medical
claims** and a **timesheet clock in/out**. The app stays a thin client — it only calls
the endpoints below on `https://exams.tertiaryinfotech.com`. The **backend (the
`alfredang/ai-exams` website repo, deployed on Coolify)** must implement them:

- Claims: receive the photo and upload it to Google Drive (service account or stored
  OAuth grant) into per-person folders: `Expense Claim/<staff name>/…` and
  `Medical Claim/<staff name>/…`.
- Timesheet: log clock in/out events to the central Postgres database on Coolify
  (the same database the website uses via Prisma).

All endpoints require the standard `Authorization: Bearer <token>` header and must
**reject users whose role is not staff-like**. Errors follow the existing convention:
non-2xx with JSON body `{ "error": "message" }`.

## Role gating (drives UI visibility)

The app shows the **Staff** tab only when `user.role` (from `auth/login` /
`auth/register`) is one of, case-insensitively:

```
staff | admin | intern | contractor
```

Regular customers keep the current 3-tab app and never see staff features. To enable a
staff member/intern/part-time contractor, set their `role` accordingly in the database.
(They must sign out/in on the phone once for the cached user to refresh.)

## POST /api/mobile/staff/claims

Submit a claim with a receipt photo (JPEG, resized client-side to ≤1600px, base64).

```jsonc
// request
{
  "type": "EXPENSE",            // or "MEDICAL"
  "title": "Taxi to client site",
  "amount": 23.50,               // optional
  "currency": "SGD",
  "note": "optional",
  "photoBase64": "<base64 jpeg>",
  "filename": "receipt-1751500000.jpg",
  "contentType": "image/jpeg"
}
// response
{ "claim": { "id": "…", "type": "EXPENSE", "title": "…", "amount": 23.5,
             "currency": "SGD", "note": null, "status": "SUBMITTED",
             "createdAt": "2026-07-03T04:20:00.000Z",
             "driveFileUrl": "https://drive.google.com/…" } }
```

Backend responsibilities: decode the photo, upload to Google Drive under
`<Expense Claim|Medical Claim>/<staff name>/<filename>`, store a `Claim` row
(user, type, title, amount, currency, note, status, driveFileId/Url, createdAt).
`status` values the app renders: `SUBMITTED` (amber), `APPROVED` (green),
`REJECTED` (red) — anything else renders amber.

## GET /api/mobile/staff/claims

```jsonc
{ "claims": [ /* same claim objects, newest first, ~20 is plenty */ ] }
```

## GET /api/mobile/staff/timesheet

```jsonc
{
  "active": { "id": "…", "clockInAt": "2026-07-03T01:05:00.000Z",
              "clockOutAt": null, "minutes": null, "note": null },  // or null
  "entries": [ /* recent entries, newest first, completed ones have clockOutAt + minutes */ ],
  "weekMinutes": 1240                                                // optional, this ISO week
}
```

## POST /api/mobile/staff/timesheet/clock-in
## POST /api/mobile/staff/timesheet/clock-out

Request: `{ "note": null }` (note optional). Response: `{ "entry": { …entry } }`.

Rules: clock-in with an open entry → `409 { "error": "Already clocked in." }`;
clock-out with no open entry → `409 { "error": "Not clocked in." }`. Server timestamps
are authoritative (the app never sends times). Store entries in a `TimesheetEntry`
table (user, clockInAt, clockOutAt, minutes, note) in the Coolify Postgres.

## Dates

ISO-8601 UTC strings, with or without fractional seconds — the app parses both.
