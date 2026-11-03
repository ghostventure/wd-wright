# WD Wright Profiles and First-Run Setup

Date: 2026-11-02

## What changed

- Sign-up now asks what brings the person to WD Wright: traffic control services, contractor/utility partnership, public agency, job search, or approved WD Wright team access. This is saved as `userDatabase.accountPurpose` for routing and presentation. Existing records default to `unspecified` until the user selects a purpose. Existing `accountType` values and privileged access checks remain unchanged.
- Sign-up collects the preferred contact route. Calls and texts require a callback number. Selecting text records a preference only; it does not enroll the user in text messages. Marketing email is not selected by default.
- The profile editor now groups the primary identity/contact details and Wright purpose, shows the sign-in email as read-only, and adds an optional organization name. Request focus is limited to service/browse choices in this Wright-facing profile editor. Internal stage owner and support tier are no longer self-service controls.
- Dashboard setup progress is computed from profile fields saved in Firestore. It identifies recommended details separately from optional organization/service-area fields, and allows the user to return to Profile at any time. Optional details can be skipped by leaving them blank. The Profile editor's live completeness/checklist is labeled as a draft estimate until the user saves.
- Marketing consent is excluded from profile completeness/readiness. The promotional email choice is explicitly optional and separate from messages about a request. If the canonical profile rejects it because its consent requirements are not configured, the editor reports that no opt-in was saved.
- `ensureUserProfile` accepts an opt-in `throwOnError` option. New email/password sign-up uses it, so a profile write failure is shown to the user rather than being reported as a completed setup. Existing sign-in behavior keeps its fallback for continuity. Runtime profile load status is labeled in the UI and is not persisted as user data.
- Firestore rules validate the small purpose enum (including `unspecified` for existing accounts) and optional organization-name length alongside the profile helper's sanitizer.
- User profile schema version is now 16; publish the matching rules and app together so existing records can be normalized through the existing profile repair path.

## Persistence and activation boundary

Profile writes use the existing signed-in `users/{uid}` path. Setup progress is derived from saved profile fields; it is not stored as an independent checklist or in browser storage. When Firestore is unavailable, the dashboard says it cannot confirm saved progress and profile-save errors remain visible.

The profile/onboarding UI and code are included in the Firebase Hosting deployment. The matching Firestore rules remain local and were not deployed because Firestore is disabled/uninitialized for this project. Profile persistence for the new fields has not been verified against a live database. The deployment does not enable Firestore, Authentication, Functions, team access, SMS delivery, or marketing enrollment.

## Files changed

- `src/WDWrightAuthScreen.jsx`
- `src/WDWrightWorkspace.jsx`
- `src/WDWrightAccountExperience.jsx`
- `src/backend.js`
- `src/wd-wright-account-services.js`
- `firestore.rules`
