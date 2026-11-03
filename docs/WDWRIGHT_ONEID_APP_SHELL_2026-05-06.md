# WD Wright OneID App Shell Install

Date: 2026-05-06

## Scope

This pass intentionally did **not** bring over EstateHat marketplace areas that were explicitly excluded:

- matching service
- browse/listing
- watchlist
- move kit

This pass **did** install the missing authenticated product structure that makes WD Wright behave like a full signed-in app instead of a single standalone workspace page.

## What Was Added

### 1. GTM and Theme Bootstrap

`app/layout.jsx` now includes:

- Google Tag Manager bootstrap using `GTM-TWW3MG8S`
- `<noscript>` GTM iframe fallback
- Wright theme bootstrap using `localStorage["wd-wright-theme"]`
- root theme state on `document.documentElement.dataset.wdWrightTheme`

### 2. Full Authenticated Shell

`src/WDWrightAuthenticatedApp.jsx` is now the main `/home` shell and includes:

- persistent left navigation
- authenticated overview/dashboard
- OneID / One Wright passport view
- profile/account workspace
- document vault view
- transaction timeline view
- notification center
- admin workbench for privileged users
- quick-jump command palette
- toast and confirm UI host
- Wright theme switcher

### 3. One Account / OneID Session Behavior

Auth state is now treated as one Wright account across active surfaces:

- sign-in still broadcasts `sign_in`
- home logout now broadcasts `sign_out`
- home subscribes to `sign_out` and closes the local workspace session
- sign-in subscribes to `sign_out`
- public pages subscribe to both `sign_in` and `sign_out`

This is layered on top of the shared Firebase auth persistence that already syncs session state.

### 4. Inactivity Logout

`src/useInactivityLogout.js` was added to bring over the EstateHat-style inactivity timeout pattern for the authenticated home shell.

### 5. Further Account Enrichment

The authenticated shell now gives the account stronger product value:

- reusable account passport / OneID surface
- shell-level overview of protected account coverage
- faster quick actions into quote, documents, help, and profile
- theme persistence inside the authenticated app
- command palette navigation for higher operating dexterity

## Files Added

- `src/WDWrightAuthenticatedApp.jsx`
- `src/useInactivityLogout.js`
- `docs/WDWRIGHT_ONEID_APP_SHELL_2026-05-06.md`

## Files Updated

- `app/layout.jsx`
- `app/home/page.jsx`
- `app/signin/page.jsx`
- `src/WDWrightPublicPage.jsx`
- `src/WDWrightWorkspace.jsx`
- `src/WDWrightAuthScreen.jsx`
- `README.md`
- `docs/README.md`

## Result

WD Wright now has:

- a Wright-specific public site
- a Wright-specific authenticated shell
- one shared account identity layer across protected Wright surfaces
- GTM and Wright theme bootstrap at the app root

It is still **not** a full EstateHat marketplace clone, by design, because the excluded property-marketplace features were left out.
