# WD Wright Backend High-Value Tranche

Date: 2026-05-06

This pass installs the next backend tranche after the top-priority foundation work. It adds the shared routing, session-security, profile-governance, and intake-lifecycle pieces that make the WD Wright backend more structured and easier to extend.

## Installed Components

The following high-value items from the ranked backend roadmap are now installed in the repo:

1. Central API router
2. Idempotency middleware
3. Request timeout handling
4. API versioning
5. Token freshness checks for sensitive actions
6. Session revocation service
7. Cross-device sign-out tracker
8. Custom claims sync job
9. Privileged account approval workflow
10. Trusted-device registry
11. Login anomaly detection
12. MFA enrollment state store
13. Canonical account profile service
14. Profile field-level validation rules
15. Profile change history
16. Account status lifecycle engine
17. Consent/preference ledger
18. Intake priority scoring
19. SLA timer for inbound requests
20. Reopen/close lead state machine

## File Summary

### `functions/api-router.js`

Adds shared API mechanics for backend endpoints:

- `createApiRouter(...)` route dispatch
- `withIdempotency(...)` request replay protection for mutation routes
- `withTimeout(...)` request deadline protection
- `API_VERSION` and `X-WD-Wright-API-Version` response header support

### `functions/auth-services.js`

Adds WD Wright account/session helpers:

- fresh-auth enforcement for sensitive actions
- trusted-device recording
- login anomaly detection for new devices
- self-session revocation support
- session event publishing
- custom claim sync
- MFA state storage
- privileged access request and review workflow

### `functions/index.js`

Wires the new backend services into the live Functions surface:

- session bootstrap now returns device/anomaly/MFA session context
- `/api/session/bootstrap` now runs through the shared router
- new authenticated mutation endpoints are installed for:
  - `/api/session/revoke-self`
  - `/api/session/trusted-device`
  - `/api/session/mfa-state`
  - `/api/session/sync-claims`
  - `/api/session/privileged-access/request`
  - `/api/session/privileged-access/review`

### `src/wd-wright-account-services.js`

Adds the shared account/profile governance layer:

- canonical profile builder
- editable profile validation
- account status derivation
- profile change diffing/history
- consent ledger writes
- lead SLA builder
- lead reopen/close transition helper

### `app/home/page.jsx`

Profile saves now use the canonical WD Wright account service instead of writing raw profile data directly.

### `src/wd-wright-backend.js`

Lead intake now includes stronger lifecycle metadata:

- assignment priority scoring
- SLA payload generation
- reopen/close local lead helpers

### `src/backend-api.js`

Adds authenticated backend POST support for session actions with an idempotency key header.

### `scripts/backend-smoke.mjs`

Extends the backend smoke check so this tranche is asserted in CI/local verification.

## Verification

The following checks passed after installation:

- `npm run test:backend:smoke`
- `node --check functions/index.js`
- `npm run build`

## Deployment Status

Hosting-safe app changes can be deployed normally.

Functions-side code is installed in the repo but is still not live on `wd-wright-traffic` until that Firebase project is upgraded to Blaze and Functions deployment is re-enabled.
