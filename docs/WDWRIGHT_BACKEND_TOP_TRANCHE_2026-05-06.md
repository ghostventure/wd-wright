# WD Wright Backend Top Tranche

Date: 2026-05-06

## Scope

This pass installed the first backend tranche from the prioritized list:

1. Request schema validation
2. Shared error envelope
3. Role/permission service
4. Structured logging
5. Lead deduplication engine
6. Lead assignment rules engine
7. Job queue
8. Retry/backoff worker
9. Webhook replay protection
10. Post-deploy smoke test suite

## What Was Installed

### Functions Core

New shared backend primitives were added in `functions/backend-core.js`:

- request context builder
- structured logging
- standardized API error creation
- shared JSON error envelope
- method assertions
- body validation
- role/permission checks
- queue job helper
- retry scheduling helper
- webhook replay guard

### Functions Wiring

`functions/index.js` now uses the shared backend core for:

- consistent request lifecycle logging
- shared endpoint wrapper behavior
- method enforcement
- request-body validation on payment checkout endpoints
- replay protection for Stripe webhooks
- replay protection for Square webhooks
- queued retry records when webhook processing fails

### Intake Robustness

`src/wd-wright-backend.js` now adds:

- lead fingerprinting for duplicate detection
- Firestore duplicate lookup before new intake writes
- assignment hints for queue, region, office, and priority
- WD Wright source normalization on intake records

This means quote/contact intake is less likely to create duplicate lead rows and now carries routing hints from the first write.

### Smoke Coverage

Added `scripts/backend-smoke.mjs` and root script:

- `npm run test:backend:smoke`

It verifies the new backend primitives and their integration points are present, and runs `node --check` against the Functions files.

## Verification

- `npm run test:backend:smoke`
- `npm run build`
- `npm run deploy:hosting`

## Live State

- Hosting URL: `https://wd-wright-traffic.web.app`

## Important Deployment Note

The client-side intake improvements are live on Hosting.

The new server-side Functions primitives are installed in repo but are **not live yet**, because `wd-wright-traffic` is still Hosting-only until Firebase Blaze is enabled for Functions deployment.

## Next Backend Items

The next tranche should continue from the original ordered list after this pass, focusing on:

- central API router consolidation
- deeper endpoint-by-endpoint schema coverage
- broader queue consumption/worker execution
- stronger session/auth event auditing
- additional payment reconciliation coverage
