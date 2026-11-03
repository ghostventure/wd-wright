# WD Wright Backend Hardening

Date: 2026-11-02

This source-only backend pass covers origin trust and retry safety. It does not change the web, desktop, Android, or iOS UI, and it does not deploy Firebase resources.

## Level 1: origin and redirect controls

- Cloud Functions CORS now returns `Access-Control-Allow-Origin` only for the configured app origin, the WD Wright Firebase Hosting origins, the Capacitor localhost origins, and explicitly configured `CORS_ALLOWED_ORIGINS` entries.
- Local HTTP origins are enabled only when running the Firebase Functions emulator.
- Preflight responses include the request headers used by the app, including `X-Idempotency-Key` and `X-Request-Id`.
- Stripe and Square return URLs use the request origin only when it is in the same allowlist; other origins fall back to `APP_URL`.

For an approved custom web domain, configure `APP_URL` and/or the comma-separated `CORS_ALLOWED_ORIGINS` environment variable with its exact origin. Do not include URL paths in the origin list.

## Level 2: duplicate request and webhook safety

- API idempotency records use a SHA-256 document ID derived from the signed-in user, route scope, and request key. User data and responses are no longer shared across users that reuse a key.
- Idempotency keys are bounded and restricted to visible ASCII. The request method, path, and body are bound to the key; reuse for a different request returns HTTP 409.
- A Firestore transaction claims an idempotency key before running the handler. Concurrent requests receive HTTP 409 while the first is processing, and completed responses are replayed. Failed handlers release their claim for retry.
- Webhook replay claims are acquired transactionally, so concurrent deliveries cannot both claim the same event. A successful handler marks the event processed; a failed handler releases its claim so provider retries can run.
- Existing webhook event IDs keep their prior Firestore document IDs when safe, preserving deduplication across this source update.
- Document registration now refuses to overwrite a document owned by another account, and refuses duplicate version IDs. Share links require an existing document version and owner (or an allowed privileged override).
- Lead comments accept only `internal` or `requester` visibility. Internal comments require privilege; requester-visible comments require lead ownership.
- MFA state is read from Firebase Authentication's enrolled factors; callers can no longer assert enrollment by posting a boolean.
- Deal reads are scoped to the buyer, seller, or privileged staff. Message reads are scoped to the sender, explicitly listed participants, or privileged staff. The current UI does not write participant lists, so legacy messages remain sender-only until that data is migrated.
- Storage writes are limited to the user's own upload path, 25 MB, and an explicit set of document/image MIME types.
- Share-link tokens now use cryptographically secure random bytes.

## Deployment boundary

These changes are repository source only and have not been deployed. The current deploy configuration still disables Cloud Functions, the Firebase project previously reported no deployed Functions, and its Firestore API/database access was unavailable. Enabling or deploying this backend requires resolving the Firebase billing/API prerequisites first. Do not treat these source changes as live behavior until Functions, Firestore, and the applicable secrets are provisioned and deployed.

## Files changed

- `functions/index.js`
- `functions/api-router.js`
- `functions/backend-core.js`
- `functions/auth-services.js`
- `functions/data-document-services.js`
- `firestore.rules`
- `storage.rules`
- `docs/README.md`
- `README.md`
