# WD Wright Manager OneID Email Binding

Date: 2026-05-07

## Scope

This pass tightened Manager's Desk identity handling so manager access is visibly tied to the signed-in account email and follows the same `OneID, all of WD Wright` model used across the protected app shell.

## What Changed

- Expanded the auth-sync payload in `src/wd-wright-auth-sync.js` so sign-in and sign-out events now carry:
  - `uid`
  - `email`
  - `accountType`
  - `oneId`
  - `scope = "one-id-all-wd-wright"`
- Updated sign-in flows in `src/WDWrightAuthScreen.jsx` and `app/signin/page.jsx` so OneID sync announces the signed-in email and account type instead of only the Firebase UID.
- Updated sign-out flow in `app/home/page.jsx` so global sign-out broadcasts the same account identity envelope.
- Tightened manager-capable account detection in `src/WDWrightAuthenticatedApp.jsx`:
  - privileged WD Wright accounts still qualify
  - `agent` accounts still qualify
  - approved `@wdwright.com` work-email accounts now qualify as manager-capable
- Added explicit manager identity surfacing inside `Manager's Desk`:
  - signed-in email
  - access source
  - WD Wright OneID
  - sign-in scope
  - OneID manager-access explainer panel

## Result

- Manager access is now visibly bound to the manager's signed-in email.
- Manager sign-in and sign-out follow the same OneID behavior as the rest of the protected WD Wright shell.
- Company reps using approved WD Wright work-email accounts can reach `Manager's Desk` without relying only on a narrow hard-coded account type.

## Verification

- `npm run build`
- `npm run test:backend:smoke`
- `npm run deploy:hosting`

## Live

- Hosting: `https://wd-wright-traffic.web.app`
