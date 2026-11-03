# WD Wright Contact, FAQ, and Legal Footer Wiring

Date: 2026-05-07

## Scope

This pass aligned WD Wright contact information with the currently published company site and made FAQ and legal-page links explicit across the site footers.

## Main Files

- `src/wd-wright-data.js`
- `src/WDWrightPublicFooter.jsx`
- `src/WDWrightPublicPage.jsx`

## What Changed

- Updated the main WD Wright contact source of truth to use the currently published company phone number and corporate email.
- Wired FAQ, Help, Terms, Privacy, Accessibility, and DMCA links into footer navigation instead of leaving those routes partially discoverable.
- Expanded the public legal page copy so privacy, terms, accessibility, and DMCA pages point to real WD Wright contact details instead of generic placeholder wording.

## Contact Values Used

- Phone: `1 (724) 847-0234`
- Email: `wdwrightinc@wdwright.com`

## Result

The public and auth-adjacent footer surfaces now expose the FAQ and legal pages clearly, and the visible contact details are aligned to the current live WD Wright company site.
