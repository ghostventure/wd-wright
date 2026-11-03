# WD Wright Dexterity And Efficiency Pass

Date: 2026-05-06

This pass focuses on interaction efficiency and shared client behavior rather than adding new product surfaces. The goal was to reduce duplicated logic, keep theme/account state synchronized more cleanly, and make the site easier to operate and maintain.

## What Changed

### Shared Theme Runtime

Added `src/wd-wright-theme-sync.js`.

It now provides:

- the canonical WD Wright theme storage key
- shared theme options
- centralized theme application
- shared local-storage persistence
- cross-tab theme synchronization through `storage` and `BroadcastChannel`
- `useWrightThemeMode()` so each shell does not reimplement the same theme state logic

### Shell Cleanup

The following surfaces now use the shared theme runtime instead of their own duplicated theme persistence code:

- `src/WDWrightPublicPage.jsx`
- `src/WDWrightAuthScreen.jsx`
- `src/WDWrightAuthenticatedApp.jsx`
- `app/home/page.jsx`

This removes repeated:

- `localStorage.getItem(...)`
- `localStorage.setItem(...)`
- `document.documentElement.dataset...`
- `document.documentElement.classList.toggle(...)`

from multiple app shells.

### Cross-Tab Auth Signal Cleanup

Updated `src/wd-wright-auth-sync.js` so the auth channel and storage signal keys use WD Wright naming:

- `wd-wright-auth`
- `wd-wright-auth-signal-v1`

This keeps the synchronization layer aligned with the current product naming and reduces leftover legacy naming noise.

### Interaction Efficiency Outcome

The site now has:

- one shared theme-state implementation
- one shared cross-tab theme sync path
- one cleaner auth-sync naming layer
- less repeated shell code across public, sign-in, and account pages

That improves maintainability and reduces unnecessary client-side repetition while keeping the user-facing behavior consistent.

## Verification

The following checks passed after this pass:

- `npm run build`
- `npm run test:backend:smoke`

## Deployment Status

This efficiency pass is included in the latest Hosting deployment to:

- `https://wd-wright-traffic.web.app`
