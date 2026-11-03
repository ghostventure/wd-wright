# WD Wright Final Handoff

Date: 2026-05-07

## Current Live State

- Hosting URL: `https://wd-wright-traffic.web.app`
- Platform: `Next.js 14` static export on Firebase Hosting
- Firebase Hosting project: `wd-wright-traffic`
- Backend status:
  - Hosting is live
  - Functions-side mechanics are installed in repo
  - Blaze-dependent Functions deployment remains separate from the current Hosting-only live baseline

## Core Product Surface

- Public site:
  - `/`
  - `/about`
  - `/services`
  - `/technology`
  - `/locations`
  - `/resources`
  - `/careers`
  - `/contact`
  - `/quote`
- Legal/help routes:
  - `/faq`
  - `/help`
  - `/terms`
  - `/privacy`
  - `/accessibility`
  - `/dmca`
  - `/press`
  - `/invest`
- Auth route:
  - `/signin`
- Protected app shell:
  - `/home`

## Installed Account And Dashboard Surface

- Dashboard landing after sign-in
- OneID sync across protected WD Wright pages
- Theme-aware public shell, sign-in, and authenticated shell
- Booking
- Scheduling
- Profile
- Account
- Security
- Payment Information
- Receipts
- Jobs
- Messages
- Documents
- Notifications
- Settings
- Resources
- Feedback
- Admin workbench for privileged users
- Manager's Desk for manager-capable accounts

## Manager And Company Identity

- Manager-capable access now resolves from:
  - privileged accounts
  - `agent` accounts
  - approved `@wdwright.com` work-email accounts
- Manager's Desk is explicitly tied to:
  - signed-in email
  - WD Wright OneID
  - access source
  - company profile fields
- Company-user records now support structured employee identity fields:
  - `employeeId`
  - `department`
  - `office`
  - `title`
  - `employmentStatus`
  - `managerLevel`
  - `permissions`
  - `companyEmail`

## User Database State

- Active schema version: `15`
- WD Wright-native identity field:
  - `oneWrightId`
- Backward-compatible legacy mirror retained:
  - `oneEstateHatId`
- Profile model currently captures:
  - identity/contact
  - account type
  - employee profile
  - security
  - verification
  - trust
  - reputation
  - legal
  - compliance
  - user database / customer record state
  - payout framework
  - verified billing
- Profile change history and consent ledger are installed
- Local lead fallback now includes retry metadata and retry-flush logic back to Firestore

## UX/UI State

- Full 50-component UX pass installed across public and protected surfaces
- Day / Night / Safety theme modes available across the site
- Legacy WD Wright brand lockup installed and theme-aware
- Sign-in page upgraded into a branded landing surface
- Shared footer streamlined and linked across the site
- FAQ and legal links are present in footers
- Contact information aligned to the published WD Wright values in the app data source

## Key Constraints

- The live deployment is Hosting-only
- Blaze-dependent Firebase Functions are not part of the current live release
- Payments, Stripe, Square, and `/api/*` function-backed routes remain dependent on the separate Functions deployment path
- The installed Firebase CLI in this environment does not provide `firestore:rules:test`

## Verification Baseline

Latest validation for the final hardening state:

- `npm run test:backend:smoke`
- `npm run build`
- `npm run deploy:hosting`

## Main Reference Docs

- `docs/WDWRIGHT_BUILD_INVENTORY_2026-05-06.md`
- `docs/WDWRIGHT_ONEID_APP_SHELL_2026-05-06.md`
- `docs/WDWRIGHT_MANAGERS_DESK_INSTALL_2026-05-07.md`
- `docs/WDWRIGHT_MANAGER_ONEID_EMAIL_BINDING_2026-05-07.md`
- `docs/WDWRIGHT_USER_DATABASE_HARDENING_2026-05-07.md`
- `docs/WDWRIGHT_TOP25_UX_COMPONENTS_INSTALL_2026-05-07.md`
- `docs/WDWRIGHT_LAST25_UX_COMPONENTS_INSTALL_2026-05-07.md`
- `docs/WDWRIGHT_ACCOUNT_AREAS_INSTALL_2026-05-07.md`
- `docs/WDWRIGHT_CONTACT_LEGAL_FOOTER_WIRING_2026-05-07.md`
- `docs/WDWRIGHT_HOSTING_ONLY_DEPLOY_2026-05-06.md`

## Archive Note

A packaged project archive was generated after this final documentation pass so the current WD Wright repo state can be moved or reviewed as a single bundle.
