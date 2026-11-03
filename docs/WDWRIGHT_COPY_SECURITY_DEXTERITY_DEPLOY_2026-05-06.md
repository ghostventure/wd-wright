# WD Wright Copy, Security, And Dexterity Deploy

Date: 2026-05-06

## Scope

This pass cleaned visible leftover product jargon from the active WD Wright site, tightened the signed-in dashboard copy around account use and security, fixed the Hosting deploy guard after the folder rename, and deployed the updated site.

## What Changed

- Rewrote public-site copy in `src/WDWrightPublicPage.jsx` so the site speaks directly to WD Wright’s traffic control business instead of inherited build/system language.
- Reworked shared text in `src/wd-wright-data.js` so resources, FAQs, trust points, careers, and roadmap items stay company-focused.
- Updated the sign-in experience in `src/WDWrightAuthScreen.jsx` so account value is explained as quotes, scheduling, documents, help, and dashboard access rather than backend or identity jargon.
- Reframed the member workspace in `src/WDWrightWorkspace.jsx` around account benefits, saved request details, and faster return visits.
- Cleaned footer copy in `src/WDWrightPublicFooter.jsx` so both the auth footer and the public footer stay direct and business-relevant.
- Polished the signed-in shell in `src/WDWrightAuthenticatedApp.jsx` with clearer feature labels, stronger security wording, a visible security-status block, and more direct account-control language.
- Changed the signup `leadSource` seed from `jdwright-site` to `wd-wright-site`.
- Fixed `scripts/guard-deploy.mjs` to use `fileURLToPath(import.meta.url)` so Hosting deploys still work after the repo path was renamed to `WD Wright`.

## Verification

- `npm run build`
- `npm run deploy:hosting`

## Live State

- Hosting URL: `https://wd-wright-traffic.web.app`

## Notes

- This was a Hosting deploy only.
- Blaze-dependent Functions and API routes remain intentionally offline until the Firebase project is upgraded.
