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

These changes are local source only. The current deploy configuration still disables Cloud Functions, the Firebase project previously reported no deployed Functions, and its Firestore API/database access was unavailable. Enabling or deploying this backend requires resolving the Firebase billing/API prerequisites first. Do not treat these source changes as live behavior until Functions, Firestore, and the applicable secrets are provisioned and deployed.

## Performance pass (2026-11-02)

- The Stripe SDK is imported on first Stripe request and reused by the Stripe handlers, rather than loaded during initialization of every Functions module. Non-payment endpoints can avoid loading that dependency. This is a source-level cold-start optimization; Functions are not deployed, so no production latency measurement is available.
- Mobile viewport updates are coalesced to one animation frame, viewport-scroll events no longer trigger device-state recalculation, and unchanged root attributes/CSS variables are not rewritten.
- Below-the-fold public and authentication card images use lazy loading and asynchronous decoding. The public home hero image remains eager and receives high fetch priority.
- The external Google Fonts stylesheet was removed because the project contains no local Poppins font files and the previous production build had failed to fetch it. The app uses one system-font stack across the shared Wright theme to avoid blocking on that third-party font request.
- Public copy now leads with traffic control work, project requirements, market coverage, and quote next steps. Self-referential interface text was removed where it distracted from customer tasks.
- `npm run build` completed on 2026-11-02. The Next.js report lists 87.4 kB shared first-load JavaScript and 279 kB first-load JavaScript for `/home`. This is a build report, not a browser performance measurement.
- `node --check functions/index.js` and `git diff --check` completed without errors. Automated tests were not run.

The Functions performance edits remain source-only and were not deployed. Static Hosting was later redeployed with the user-requested profile, quote, services, FAQ, and legal changes; that Hosting release does not activate Functions or Firestore. Firestore remains unavailable until an administrator enables `firestore.googleapis.com`; Cloud Functions still require the separately deferred Blaze billing change.

## Live activation check (2026-11-02)

The Firebase CLI was rechecked against `wd-wright-traffic`:

- Project exists and Hosting is configured.
- `functions:list` returns no deployed Functions.
- Firestore database listing and location listing return HTTP 403 because `firestore.googleapis.com` is disabled or has never been initialized for the project.
- Firebase Authentication account export returns `CONFIGURATION_NOT_FOUND`; initialize Authentication before expecting the app's email/password and Google sign-in screens to work.
- The source exports five Functions in `us-central1`. Firebase requires the Blaze billing plan to deploy Cloud Functions. Linking billing changes the project to pay-as-you-go and can permit charges beyond no-cost quotas.
- The owner selected the `nam5` multi-region for the default Firestore database and asked to leave Blaze unchanged for now. A create attempt returned the same 403 because `firestore.googleapis.com` is disabled, so no database was created.
- Firestore documents that the database location cannot be changed after provisioning. `nam5` is the selected multi-region; the existing Functions are in `us-central1`, so Functions will remain offline for now and would have cross-region access if enabled later.
- The payment Functions additionally depend on eight Stripe/Square Secret Manager values. Set those directly in Firebase/Google Cloud; do not put provider secrets in the web client or source repository.

Source preparation now projects lead writes onto the Firestore allowlist, scopes duplicate lookup to the signed-in requester's own leads, and permits lead reads only to that requester or privileged staff. A failed profile audit/consent-ledger write no longer makes the already-saved profile appear to have failed; those append-only records remain server-only until a trusted endpoint is deployed. Keep payment workflows disabled until their provider secrets and webhooks are configured.

To continue the Firestore-only activation, an administrator must enable the Firestore API for project `wd-wright-traffic` in [Google Cloud API Library](https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=wd-wright-traffic). Then retry default database creation in `nam5`, deploy the production Firestore rules, and initialize Authentication. No Blaze or Functions changes are part of this step.

### Activation sequence

1. Choose the default Firestore database location and create the database with the production rules, not test mode.
2. Initialize Firebase Authentication and enable the providers the app uses: email/password and Google.
3. Reconcile the Firestore client/rules contracts, then deploy and verify Firestore and Storage rules.
4. If Cloud Functions are required, link a billing account to move the project to Blaze, configure cost alerts/controls, restore Functions deployment and Hosting rewrites, and deploy the non-payment APIs first.
5. Configure payment secrets and provider webhook endpoints before deploying Stripe/Square functions or enabling payment UI.
6. Build the site with backend calls enabled only after the endpoints and security rules are live, then verify authenticated profile, lead, and listing flows end to end.

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
- `src/WDWrightMobileOptimizer.jsx`
- `src/WDWrightPublicPage.jsx`
- `src/WDWrightAuthScreen.jsx`
- `src/wd-wright-theme.js`
- `src/WDWrightCareersAccessSuite.jsx`
- `app/layout.jsx`
