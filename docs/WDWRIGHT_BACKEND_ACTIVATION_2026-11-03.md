# WD Wright Backend Activation

Date: 2026-11-03

## Activated

- Enabled `firestore.googleapis.com` for project `wd-wright-traffic`.
- Created the default Standard Firestore Native database in the previously selected `nam5` multi-region with deletion protection enabled.
- Fixed the reserved `service` field access in `firestore.rules`; Firebase compiled and deployed the rules successfully with `firebase deploy --only firestore:rules`.
- Enabled Firebase Authentication Email/Password and Google sign-in providers through the Firebase CLI. The configured authorized domains are `wd-wright-traffic.firebaseapp.com` and `wd-wright-traffic.web.app`.
- Confirmed the project lists the database and Firebase reports both sign-in providers enabled.
- Updated the Cloud Functions source runtime and lockfile metadata from Node 20 to Node 22, and renamed the Functions package to `wd-wright-functions`.

## Still offline or unverified

- No Functions are deployed. The project remains off Blaze, as previously requested. Cloud Functions deployment requires changing the project to pay-as-you-go; no billing setting was changed.
- The Functions API client remains disabled unless `NEXT_PUBLIC_BLAZE_BACKEND_ENABLED=true` is set during the static build. Do not enable that flag until the corresponding Functions are deployed and reachable.
- Email/Password and Google providers are configured, but no real sign-up, sign-in, profile-save, or quote-submission session was run after activation.
- Storage rules were not deployed in this pass. No Storage bucket or file-transfer path was activated.
- The 40 feature surfaces remain a mix of temporary planning tools and backend-dependent empty states; they are not all operational because the relevant Functions and integrations are absent.
- The Firestore lead duplicate-detection query may require a composite index. The current code falls back to creating the lead when that lookup fails; create the index before relying on duplicate prevention.
- App Check is not configured or enforced.
- Payment Functions remain unavailable and require provider account setup and their Secret Manager values. Do not place those secrets in source or client environment files.

## Next activation steps

1. Verify real Email/Password sign-up, Google sign-in, profile persistence, and quote submission against this project's database.
2. Add the needed Firestore composite index for the lead deduplication query and verify it.
3. Decide separately whether to enable Blaze, which changes the project to pay-as-you-go and can incur charges. If approved, deploy only the non-payment Functions first, then enable the Functions client flag and verify the API routes.
4. Configure Storage and payment providers only when their business, security, and cost requirements are ready.

Google's Functions runtime schedule lists Node 20 as decommissioned on 2026-10-30. The source is now prepared for Node 22; no Functions deployment was attempted. See [Google Cloud Functions runtime support](https://docs.cloud.google.com/functions/docs/runtime-support) and [Firebase Functions runtime configuration](https://firebase.google.com/docs/functions/manage-functions).
