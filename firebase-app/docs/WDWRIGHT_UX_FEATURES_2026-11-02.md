# WD Wright UX Features

Date: 2026-11-02

This source update installs a guided public request path, improved discovery and help, useful customer and field tools, searchable careers, and accessibility preferences. It does not deploy Firebase services.

## Public request and discovery

- Four-step contact and quote intake with validation, review, schedule/project fields, date checks, city/state suggestions, and same-device draft save/resume/clear.
- Signed-in submission distinguishes a Firestore receipt from a browser-only saved copy. If only the local fallback succeeds, the page tells the customer WD Wright has not received the request and provides direct contact information.
- ZIP code entry helps identify a market but does not claim to verify service coverage. Plan/permit uploads are explicitly described as unavailable in the form, with contact details for sharing them.
- Service details and coverage guidance are surfaced alongside intake. The locations page avoids claiming ZIP-level crew availability without confirmation.
- FAQ search filters questions and answers.

## Customer and field account tools

- Dashboard panels for local request history, account setup, project contacts, saved locations, and notification preferences.
- Field job brief with print action, local readiness/closeout checklist, safety reminders, emergency contact links, and document preparation checklist.
- Each device-only feature states that its data is not synced to the WD Wright account.
- Billing, receipts, feedback, dispatch, crew, and message areas show connected or empty states instead of example customer records.

## Careers and accessibility

- Careers filters for role, team, and location; browser-only application preparation checklist; and clear interest-request status.
- Site-wide skip link, focus-visible behavior, larger text, higher contrast, and reduced-motion preferences. Accessibility preferences and checklists stay in the current browser.

## Backend-dependent follow-up

Account request history, project contacts, saved locations, preferences, field notes, and accessibility settings currently use this browser only. Live customer request status, shared contacts, file uploads, dispatch schedules, notifications, billing, and application tracking require active Firebase/Functions integrations. No unsupported workflow is presented as live.
