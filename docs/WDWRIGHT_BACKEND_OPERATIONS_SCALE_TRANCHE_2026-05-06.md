# WD Wright Backend Operations-Scale Tranche

Date: 2026-05-06

This pass installs the next backend tranche after the top-priority and high-value foundation work. The focus here is operational scale: dispatch structure, scheduling and capacity mechanics, billing/invoice primitives, recovery/reconciliation jobs, and third-party safety controls.

## Installed Components

The following items from the ranked backend roadmap are now installed in the repo:

41. Dispatch request model
42. Coverage-area resolver
43. Office routing service
44. Timeline/milestone state machine
45. Escalation queue
46. After-hours routing logic
47. Crew availability service
48. Job scheduling engine
49. Capacity forecasting service
50. Shift-status event feed
51. Customer billing profile service
52. Invoice record model
53. Pricing/quote rules engine
54. Billing notification service
55. Failed-payment recovery flow
56. Refund workflow
57. Revenue event ledger
58. Circuit breaker for third-party APIs
59. Scheduled reconciliation jobs
60. Scheduled cleanup jobs

## File Summary

### `src/wd-wright-operations.js`

Adds the shared WD Wright client-side operations model used by lead intake:

- coverage-area resolution
- office and queue routing
- dispatch request creation
- timeline construction
- crew availability summary
- schedule window generation
- capacity forecasting
- shift-status feed payloads

### `src/wd-wright-backend.js`

Lead intake now stores richer operations metadata for each request:

- dispatch packet
- assignment priority and office hint
- lifecycle timeline
- scheduling window
- crew availability
- capacity forecast
- shift feed summary

### `functions/operations-services.js`

Adds the backend operations/billing service layer:

- dispatch, routing, and timeline helpers
- invoice and billing profile records
- pricing quote rules
- billing notifications
- failed-payment recovery records and queued recovery jobs
- refund records
- revenue ledger writes
- circuit breaker protection for third-party provider calls
- scheduled reconciliation and cleanup job registration

### `functions/index.js`

The live Functions surface now consumes the new operations services:

- session bootstrap includes a WD Wright control-center operations snapshot
- Stripe and Square external calls are guarded with a circuit breaker
- billing customer profiles are mirrored into dedicated billing profile records
- platform-fee, featured-placement, and verified-subscription actions now produce invoice/revenue records
- failed Stripe invoice payments now create recovery records and billing notifications
- refund-style Stripe events now write refund and negative revenue records
- webhook processing now seeds daily reconciliation and cleanup jobs

### `scripts/backend-smoke.mjs`

Smoke checks now assert the full operations-scale tranche.

## Verification

The following checks passed after installation:

- `npm run test:backend:smoke`
- `node --check src/wd-wright-backend.js`
- `npm run build`

## Deployment Status

Hosting-safe updates can be deployed normally and are included in the latest Hosting release.

Functions-side code is installed in the repo, but it is still not live on `wd-wright-traffic` until Blaze is enabled and Functions deployment is re-enabled for that project.
