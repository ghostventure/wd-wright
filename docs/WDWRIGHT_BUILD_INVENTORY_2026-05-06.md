# WD Wright Build Inventory

Date: 2026-05-06

## Purpose

This document records what currently exists in `/home/sniper-lion-main/Documents/WD Wright` as built application surface, support code, native wrappers, backend wiring, generated artifacts, and known inherited EstateHat carryovers.

## High-Level Summary

WD Wright is a Wright Traffic Control rebuild staged as a Next.js application with:

- Wright-branded public marketing routes
- Wright-branded sign-in and account-access flow
- a Wright workspace route for profile editing, user records, and intake review
- Firestore-backed Wright lead intake with local fallback
- Firebase Hosting + Functions deployment scaffolding
- Android, iOS, and Electron wrapper scaffolding
- generated static export output in `out/`
- generated desktop output in `release/`

The repo is partly Wright-native and partly inherited from EstateHat. The visual/public experience is Wright-focused, but several backend, Firebase, document, asset, and naming surfaces still reference the shared EstateHat project and scaffolding.

## Current Runtime And Entry Points

- Local Next dev server command: `npm run dev`
- Current verified local dev URL on 2026-05-06: `http://localhost:3000`
- Static export output directory: `out/`
- Electron dev shell waits on: `http://127.0.0.1:3000`
- Capacitor web bundle source: `out`

## Main App Structure

### Next App Router

Primary route files live under `app/`.

Implemented route entries:

- `/` via `app/page.jsx` -> `app/_routes/LandingPage.jsx`
- `/about`
- `/services`
- `/technology`
- `/locations`
- `/resources`
- `/careers`
- `/contact`
- `/quote`
- `/signin`
- `/home`
- `/faq`
- `/help`
- `/press`
- `/invest`
- `/terms`
- `/privacy`
- `/accessibility`
- `/dmca`
- compatibility routes:
  - `/start`
  - `/public`
  - `/demo`
  - `/demo-video`

### Shared Layout

`app/layout.jsx` currently defines Wright metadata:

- title: `Wright Traffic Control`
- Wright favicon: `/icons/wd-wright-icon.svg`
- Wright manifest: `/manifest.webmanifest`

## Wright-Native Public Experience

The primary Wright public experience is implemented through:

- `src/WDWrightPublicPage.jsx`
- `src/WDWrightPublicFooter.jsx`
- `src/wd-wright-data.js`
- `src/wd-wright-theme.js`

Built public content areas include:

- Wright landing page
- services overview
- technology overview
- regional locations coverage
- resources library surface
- careers/recruiting surface
- contact surface
- quote intake surface
- help/FAQ surface
- press surface
- corporate/invest page
- legal/policy pages

Current Wright content/data model in `src/wd-wright-data.js` includes:

- brand identity values
- nav items
- hero metrics
- hero imagery panels
- Wright services catalog
- technology items and visuals
- industries served
- trust and credentials bands
- resources summaries
- FAQs
- open roles and recruiting data
- location groups and map queries
- roadmap phases

## Wright Auth And Workspace

The Wright account-access and workspace layer is implemented through:

- `app/signin/page.jsx`
- `src/WDWrightAuthScreen.jsx`
- `app/home/page.jsx`
- `src/WDWrightWorkspace.jsx`
- `src/wd-wright-auth-sync.js`

Built behavior includes:

- Wright-branded sign-in / account-creation presentation
- Firebase Auth session boot
- redirect into `/home`
- workspace boot/loading/error states
- profile editing for account/contact fields
- workspace summary cards
- public-site shortcut actions
- sign-out flow
- cross-tab auth signal propagation via:
  - `localStorage`
  - `BroadcastChannel`

## Wright Intake And Firestore Helpers

Wright-specific intake and operator helpers live in:

- `src/wd-wright-backend.js`
- `src/wd-wright-leads.js`

Implemented Wright-specific data behavior:

- lead intake writes to Firestore collection `jdwrightLeads`
- local fallback queue if Firestore write fails
- privileged Wright user detection
- Wright platform ID formatting
- Wright account-type formatting
- live subscriptions for:
  - Wright leads
  - copied `users` records

Workspace operator behavior already built:

- privileged users can subscribe to Wright leads
- privileged users can subscribe to copied/shared user records
- local fallback lead count is surfaced
- account record updates persist back through shared profile save logic

## Shared / Inherited Application Surfaces Still Present

The repo still contains large inherited EstateHat/shared surfaces, including:

- `src/backend.js`
- `src/backend-api.js`
- `src/firebase.js`
- `src/estatehat-platform-alpha.jsx`
- `src/PublicBoilerplatePage.jsx`
- `src/MarketingLanding.jsx`
- `src/EstateHatPublicFooter.jsx`
- multiple `EstateHat*` component files

These are not all dead code. Some Wright routes still rely on shared Firebase/profile infrastructure and some inherited helper/components remain part of the codebase.

Important inherited/shared realities as of 2026-05-06:

- Firebase web config still targets project `estatehat`
- deployment scripts still target Firebase project `estatehat`
- Cloud Functions base URL fallback in `src/backend-api.js` still points to `us-central1-estatehat.cloudfunctions.net`
- some public assets and investor materials still use `estatehat` names
- some docs still describe the repo as EstateHat

## Firebase And Backend Wiring

### Frontend Firebase

`src/firebase.js` currently initializes Firebase against:

- project: `estatehat`
- auth domain: `estatehat.firebaseapp.com`

Implemented client-side Firebase behavior:

- Auth persistence via `browserLocalPersistence`
- Firestore local cache with `persistentMultipleTabManager`
- optional App Check initialization

### Functions

Server code lives in:

- `functions/index.js`

Currently staged function exports include:

- `stripeApi`
- `squareApi`
- `apiHealth`
- `apiSessionBootstrap`
- `apiListingOps`

Current function scope is still mostly inherited from EstateHat marketplace/backend work:

- listing review queue operations
- Stripe billing / checkout actions
- Square billing / subscription actions
- session bootstrap
- health endpoint

Wright-related corrections already present as of 2026-05-06:

- `squareApi` path parsing bug was fixed
- Hosting rewrite for `/api/square/**` was added
- privileged Wright email set was expanded in `functions/index.js`
- backend health service label now reports `wd-wright-backend`

### Hosting

Firebase Hosting config is in `firebase.json`.

Built rewrite coverage includes:

- `/api/health` -> `apiHealth`
- `/api/session/bootstrap` -> `apiSessionBootstrap`
- `/api/listings/**` -> `apiListingOps`
- `/api/stripe/**` -> `stripeApi`
- `/api/square/**` -> `squareApi`
- compatibility redirects for:
  - `/start`
  - `/landing`
  - `/welcome`
  - `/login`
  - `/auth`
  - `/public`

## Native And Desktop Wrappers

### Android

Android wrapper scaffold exists under:

- `android/`

This project is configured to refresh Android web assets from the Next build through:

- `npm run sync:android`

### iOS

iOS wrapper scaffold exists under:

- `ios/`

This project is configured to refresh iOS web assets through:

- `npm run sync:ios`

### Electron / Windows

Electron desktop shell lives in:

- `electron/main.cjs`

Built Electron behavior:

- dev mode loads `http://127.0.0.1:3000`
- production mode loads `out/index.html`
- external links open in the system browser
- packaged app title is `WD Wright`

Windows packaging configuration exists in `package.json` and outputs to:

- `release/`

## Public Assets And Generated Media

### Wright-Specific Assets

- `public/icons/wd-wright-icon.svg`
- Wright metadata and manifest wiring

### Inherited / Shared Assets Still In Use

- `public/icons/estatehat-icon.svg`
- `public/landing/estatehat-intro-workflow.png`
- `public/landing/estatehat-intro-closing.png`
- `public/landing/video/estatehat-explainer.mp4`
- `public/landing/video/estatehat-demo-walkthrough.mp4`
- `public/investor/estatehat-investor-brochure.*`
- `public/investor/estatehat-business-plan.*`
- `public/investor/estatehat-financial-goals-model.*`

This means the repo currently contains a Wright UI over a still-partial EstateHat asset/document base.

## Generated Output Already Present In Folder

Generated or build-output directories currently present:

- `.next/` -> local Next build output
- `out/` -> static export / Hosting artifact
- `release/` -> desktop packaging output
- `.firebase/` -> Firebase local deploy state/logs
- `.tmp/` -> temporary recording/render artifacts

These are outputs, not canonical source of truth.

## Testing And Automation

Implemented scripts in `package.json`:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run test`
- `npm run deploy:functions`
- `npm run deploy:backend`
- `npm run deploy:hosting`
- `npm run sync:android`
- `npm run sync:ios`
- `npm run dev:desktop`
- `npm run build:windows`
- `npm run dist:win`

Current test file:

- `tests/compliance-mechanics.test.mjs`

Current support scripts:

- `scripts/check-demo.mjs`
- `scripts/smoke-local.mjs`
- `scripts/record-demo-video.mjs`
- `scripts/guard-deploy.mjs`
- `scripts/render-estatehat-explainer.sh`

## Documentation Already In Folder

The `docs/` folder already contains:

- release notes
- foundation notes
- platform and operations notes
- backend deploy recovery notes
- Android/iOS/Windows setup notes
- compliance and security notes
- handoff docs
- failsafe / rollback material

This new inventory document is intended to complement those files by answering one specific question:

- what is physically built in this folder right now

## Current Known Gaps / Mixed-State Areas

As of 2026-05-06, the most important mixed-state issues are:

- the repo is Wright-branded in the user-facing Next app, but still partially EstateHat in backend wiring and docs
- Firebase project targeting is still `estatehat`
- many docs still describe the repo as EstateHat
- investor PDFs and some marketing assets are still EstateHat-named
- Cloud Functions are still largely inherited from EstateHat backend work rather than a clean Wright-specific server layer
- root README still lists `127.0.0.1:3001`, but the active dev server on 2026-05-06 starts on `http://localhost:3000`

## Recommended Documentation Follow-Up

If this folder is going to continue as the active Wright repo, the next cleanup pass should update:

1. `README.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/OPERATIONS.md`
4. Firebase project and environment naming notes
5. asset/document names that still use `estatehat`

## Canonical References

For the Wright-specific foundation/build note, see:

- `docs/WDWRIGHT_FOUNDATION_2026-05-05.md`

For current repo status before this inventory, see:

- `docs/PROJECT_STATUS.md`

For deployment and run commands, see:

- `docs/OPERATIONS.md`
