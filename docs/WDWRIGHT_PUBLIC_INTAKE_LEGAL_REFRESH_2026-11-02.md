# WD Wright Public Intake and Legal Risk Refresh

Date: 2026-11-02

## User-facing changes

- Quote page redesign: stronger service-specific hierarchy, four steps from contact through review, job-scope prompts, clearer sign-in and local-draft behavior, and prominent quote submission guidance. Submitting an inquiry does not book a crew or confirm availability, scope, or price.
- Services page redesign: traffic-control project-fit guidance, six service comparison cards, a field-details checklist, and quote/location actions. Wording asks customers to confirm current market availability and project scope.
- FAQ expansion: 37 searchable answers across services, quotes, coverage and scheduling, plans and field work, accounts and privacy, and careers and access.
- Hero typography on the public home, quote, services, and FAQ pages is capped at 3.5rem for a more even visual hierarchy.
- Privacy page now describes browser-local request drafts and distinguishes a local intake queue from proof that Wright received a request. It says the page is not a complete privacy notice.
- Accessibility page describes the controls found in the app without claiming standards conformance. Copyright contact copy no longer presents `/dmca` as an operative DMCA policy or registered-agent notice process.
- The site no longer loads the unreviewed Google Tag Manager container or its no-script iframe. High-specificity claims about around-the-clock response, years, office counts, and certification were removed pending company substantiation.
- The site-wide skip link now targets a real, focusable content wrapper.

## Deployment and limits

- `npm run deploy:hosting` completed successfully for Firebase project `wd-wright-traffic`. The latest release is at `https://wd-wright-traffic.web.app`.
- Live HTTP checks returned 200 for `/`, `/quote`, `/services`, `/faq`, `/privacy`, `/accessibility`, `/dmca`, and `/home`; the agent also confirmed expected content markers.
- Deployment included Firebase Hosting only. Firestore rules and Cloud Functions were not deployed. New profile fields are visible in the deployed UI, but their Firestore persistence still needs an active database and matching rules deployment.
- No automated test suite was run. The production build and deploy guard passed as part of the deploy command.
- This release is not a counsel-approved policy package. A complete privacy notice, operating terms, designated copyright agent/process, current hiring status and accommodation workflow, accessibility audit, business identity/contact confirmation, and claim substantiation still need company and attorney review. See [WDWRIGHT_LEGAL_RISK_TRIAGE_2026-11-02.md](WDWRIGHT_LEGAL_RISK_TRIAGE_2026-11-02.md).
