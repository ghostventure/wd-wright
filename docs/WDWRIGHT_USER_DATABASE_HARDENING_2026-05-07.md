# WD Wright User Database Hardening

Date: 2026-05-07

## Scope

This pass hardened the WD Wright user model so the database can capture standard users, company reps, managers, and privileged staff more consistently.

## What Changed

- Bumped the profile schema to `15` in `src/backend.js`.
- Added a WD Wright-native identity field:
  - `oneWrightId`
  - kept `oneEstateHatId` mirrored for backward compatibility
- Added a structured `employeeProfile` block to user records:
  - `employeeId`
  - `department`
  - `office`
  - `title`
  - `employmentStatus`
  - `managerLevel`
  - `permissions`
  - `companyEmail`
- Fixed account-type handling for approved WD Wright work-email accounts so company reps can persist as `agent` accounts instead of being silently downgraded to a retail-style role.
- Aligned Firestore account-type validation with the application account-type enum:
  - `gov_municipality`
  - `gov_territory`
  - removed the stale `gov_city` mismatch from the active validation path
- Extended profile change tracking in `src/wd-wright-account-services.js` to include employee fields.
- Updated OneID handling to prefer `oneWrightId` while preserving compatibility with existing records.
- Improved local lead resiliency in `src/wd-wright-backend.js`:
  - local fallback entries now keep retry metadata
  - added automatic retry flushing back to Firestore when an authenticated user is available

## Result

- User records now support both public/customer and internal/company identity more cleanly.
- Manager-capable accounts have a structured company profile instead of relying only on ad hoc email logic.
- The Firestore rules contract now matches the app-side role contract more closely.
- Legacy identity naming remains readable by the app, but the active path now prefers a WD Wright-native field.

## Files

- `src/backend.js`
- `src/wd-wright-account-services.js`
- `src/wd-wright-backend.js`
- `src/WDWrightAuthenticatedApp.jsx`
- `src/WDWrightAuthScreen.jsx`
- `app/signin/page.jsx`
- `app/home/page.jsx`
- `functions/auth-services.js`
- `functions/index.js`
- `firestore.rules`

## Verification

- `npm run test:backend:smoke`
- `npm run build`

Note:
- `npx firebase-tools firestore:rules:test` is not available in the installed Firebase CLI here, so a rules-test command could not be run in this environment.

## Live

- Hosting: `https://wd-wright-traffic.web.app`
