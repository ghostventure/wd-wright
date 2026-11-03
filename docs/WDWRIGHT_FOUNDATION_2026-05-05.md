# WD Wright Foundation

Date: 2026-05-05

## Summary

Created a WD Wright rebuild scaffold inside `Documents/WD Wright` using the same general implementation style used for EstateHat:

- Next.js route surface
- reusable public page shell
- shared navigation and footer
- structured content/data layer
- Wright-branded auth and workspace routes on top of the copied Firebase profile model
- Firestore-backed intake helper with local fallback
- Wright-native visual theme based on a traffic-control palette
- on-page maps and stronger public presentation components
- Android and Windows build paths retained from the scaffold

## Implemented Routes

- `/`
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

## New Core Files

- `src/WDWrightPublicPage.jsx`
- `src/WDWrightPublicFooter.jsx`
- `src/wd-wright-data.js`
- `src/wd-wright-leads.js`
- `app/_routes/LandingPage.jsx`
- `app/services/page.jsx`
- `app/technology/page.jsx`
- `app/locations/page.jsx`
- `app/resources/page.jsx`
- `app/careers/page.jsx`
- `app/contact/page.jsx`
- `app/quote/page.jsx`
- `app/signin/page.jsx`
- `app/home/page.jsx`
- `src/WDWrightAuthScreen.jsx`
- `src/WDWrightWorkspace.jsx`
- `src/wd-wright-backend.js`
- `src/wd-wright-auth-sync.js`
- `public/icons/wd-wright-icon.svg`

## Active Local Review

- Primary clean local review server: `http://127.0.0.1:3001`
- Main pages checked locally:
  - `/`
  - `/locations`
  - `/signin`
  - `/home`

## Intent

This is not a pixel-for-pixel Squarespace clone. It is a Wright-focused rebuild that preserves the business shape of the source site while moving it into a more scalable codebase:

- service-led marketing structure
- multi-location coverage presentation
- quote and contact intake scaffolding
- careers and recruiting surfaces
- resources/content foundation
- room for future CRM, dispatch, and admin workflows

## Backend / Database Status

- Wright public intake now writes to a dedicated `jdwrightLeads` collection through `src/wd-wright-backend.js` when Firestore access is available.
- A browser-local fallback queue remains in place so quote, contact, and career intake is not lost if the live write path is unavailable.
- `/home` is now a Wright-native workspace over the copied `users` collection instead of the inherited EstateHat marketplace shell.
- Firestore rules were extended so privileged Wright emails can read the copied user database and the Wright intake queue.
- An explicit Wright auth signal helper has been added for cross-surface sign-in / sign-out propagation work.

## UX / Theme Status

- Public pages now use a Wright-style black / white / safety-yellow palette instead of the earlier generic green platform styling.
- The home and technology pages include Wright-themed visual support panels.
- The locations page now includes a Google Maps embed plus per-region Google Maps launch links.
- Credential and trust presentation has been strengthened with a dedicated metrics / credentials band.
- Native wrapper identity has been re-labeled toward Wright for Electron, Capacitor, Android, iOS, manifest, and icon surfaces.

## Recommended Next Steps

1. Replace placeholder contact details with Wright-approved production values.
2. Finish the “One ID, One Wright” pass across all active identity labels and cross-surface auth handling.
3. Confirm the final privileged Wright admin emails and replace the seeded placeholders if needed.
4. Add location-detail pages for each market if needed.
5. Replace generated illustrations with Wright-approved real photography, certifications, and recruiting imagery.
6. Decide whether the inherited EstateHat Cloud Functions surface should be renamed or wrapped behind Wright-specific endpoints before deployment.
