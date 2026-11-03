# WD Wright Hosting-Only Deploy

Date: 2026-05-06

## Summary

WD Wright was prepared for a Hosting-only Firebase deploy on project `wd-wright-traffic`.

This pass intentionally disables Firebase features that currently require the Blaze plan so the public site and authenticated shell can ship on Spark without broken function rewrites.

## What Was Deactivated

- Firebase Hosting rewrites to Cloud Functions were removed from `firebase.json`.
- Firebase Functions deployment is treated as offline for now.
- `src/backend-api.js` now hard-disables Blaze-only backend requests unless explicitly re-enabled by environment variable.
- `npm run deploy:functions` now reports that Functions are disabled until Blaze is enabled.
- `npm run deploy:backend` now resolves to the Hosting deploy path.

## What Still Works

- Firebase Hosting
- Firebase Auth
- Firestore-backed profile access
- public routes
- authenticated `/home` shell
- auth-gated public routes like `/quote`, `/contact`, `/resources`, and `/help`
- local/site-level account enrichment
- local fallback lead queue behavior

## What Is Offline Until Blaze

- Cloud Functions
- same-origin `/api/*` backend routes
- Stripe function-backed flows
- Square function-backed flows
- any function-backed listing review endpoints

## Current Project Wiring

- Firebase project: `wd-wright-traffic`
- Firebase web app id: `1:995395759437:web:4fd2d571e3a80337cc9b04`
- Hosting URL target: `https://wd-wright-traffic.web.app`

## Re-enable Path Later

Once `wd-wright-traffic` is upgraded to Blaze:

1. restore or reintroduce the Functions rewrites in `firebase.json`
2. re-enable backend-api calls through environment or code
3. rerun `npm run deploy:functions` or the combined backend deploy flow

## Files Changed For This Pass

- `firebase.json`
- `src/backend-api.js`
- `package.json`
- `README.md`
- `docs/README.md`
- `docs/WDWRIGHT_HOSTING_ONLY_DEPLOY_2026-05-06.md`
