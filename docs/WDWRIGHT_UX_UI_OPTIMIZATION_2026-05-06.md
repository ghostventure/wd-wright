# WD Wright UX/UI Optimization

Date: 2026-05-06

This pass improves the visual system and interaction clarity across the full WD Wright site, not just a single page. The work focuses on the shared public shell, sign-in experience, authenticated dashboard shell, and global UI behavior so the site reads as one coherent product.

## What Changed

### Global Experience

- added shared global polish in `app/layout.jsx`
- normalized body spacing, typography, focus visibility, selection styling, and scroll behavior
- added a skip link for keyboard navigation
- added subtle ambient background lighting so pages do not feel flat

### New Shared UI Components

Added `src/WDWrightUiKit.jsx` with reusable interface components:

- `StatusPill`
- `SegmentedThemeToggle`
- `AmbientSection`
- `QuickActionRail`

These are now used across multiple WD Wright surfaces instead of repeating one-off inline UI patterns.

### Public Site

Updated `src/WDWrightPublicPage.jsx`:

- stronger sticky shell with clearer hierarchy
- current-page and account-state status pills
- collapsible menu layer for the top navigation
- shared segmented theme toggle in the public shell
- added a quick-action rail on the landing page
- improved hero interaction hierarchy with protected-access cues
- wrapped page content in a real main landmark tied to the new skip link

### Sign-In And Account Creation

Updated `src/WDWrightAuthScreen.jsx`:

- replaced ad hoc theme buttons with the shared segmented theme control
- added account-state status pills at the top of the screen
- added a reusable quick-action/value rail to improve the left-side landing content
- upgraded the left hero block into a more deliberate ambient section
- preserved the stronger imagery-led landing structure while making the screen feel more product-grade and less form-only

### Authenticated App Shell

Updated `src/WDWrightAuthenticatedApp.jsx`:

- added a stronger top-level account-shell hero band
- added current-view and account-shell status pills
- replaced the dashboard shell’s theme select with the shared segmented theme control
- added a reusable quick-action rail to the main dashboard
- improved the sense of hierarchy between shell, sidebar, and page content

### Related Copy/State Cleanup

Updated `src/WDWrightWorkspace.jsx`:

- changed the marketing consent version token from `jdwright-v1` to `wd-wright-v1`

## Verification

The following checks passed after the UX/UI pass:

- `npm run build`
- `npm run test:backend:smoke`

Note: `node --check` does not validate `.jsx` files directly, so JSX validation is covered by the successful Next.js build.

## Deployment Status

The UX/UI optimization pass is included in the latest Hosting deployment to:

- `https://wd-wright-traffic.web.app`
