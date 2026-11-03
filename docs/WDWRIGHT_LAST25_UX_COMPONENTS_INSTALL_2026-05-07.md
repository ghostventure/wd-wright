# WD Wright Last 25 UX Components Install

Date: 2026-05-07

## Scope

This pass completed the remaining 25 UX components from the ranked 50-component WD Wright list, focusing on the public shell, services and locations flow, contextual guidance, and the signed-in support and document experience.

## Installed Or Finalized Components

26. Service comparison cards
27. Office and region selector
28. Location availability checker
29. Search and command palette
30. Contextual help drawer
31. Request-intake stepper
32. Saved-draft form state
33. Support ticket and comment thread
34. Admin review queue
35. Audit and activity feed
36. Document status tracker
37. Expiring share-link panel
38. Role-based access banner
39. Status pills and badges
40. Theme toggle
41. FAQ accordion
42. Resource card grid
43. Page-level hero banner
44. Breadcrumb trail
45. Persistent footer CTA strip
46. File preview modal
47. Side-by-side desktop shell
48. Location-based office launcher
49. Quote CTA bar
50. Skip-to-content link

## Main Files

- `src/WDWrightPublicPage.jsx`
- `src/WDWrightAuthenticatedApp.jsx`
- `src/WDWrightUiKit.jsx`
- `src/WDWrightPublicFooter.jsx`
- `app/layout.jsx`

## What Changed

- Added a contextual help drawer to both the public shell and the authenticated shell so page-specific guidance is always close by.
- Expanded the public site with a persistent quote CTA strip, a better locations flow, office and region selection, a coverage checker, and a direct office launcher to Google Maps.
- Strengthened the services section with comparison cards so buyers can understand where each support lane fits before they request work.
- Converted FAQ into an accordion-style interaction instead of a flat text stack.
- Added support ticket, comment-thread, audit-feed, role-banner, admin-queue, and richer document surfaces to the authenticated shell.
- Added file preview modal and share-link state around the document vault so documents are no longer only a raw vault list.

## Notes

- Several items in this tranche already existed in partial form before this pass, including the command palette, request stepper, saved drafts, theme toggle, hero surfaces, breadcrumbs, and skip link.
- This pass brought those items into the WD Wright UX inventory formally and filled the missing ones so the full 50-component set is now represented in the product.
