# WD Wright Public Legal Risk Triage

Date: 2026-11-02

This is a source and public-copy triage, not a legal opinion or counsel approval. It records items to verify with the company and its attorney before publishing substantive policy language. Review covered the public Privacy, Terms, Accessibility, and DMCA pages; profile/quote/careers paths; analytics bootstrap; and the current profile and Firestore boundary.

## Highest-priority items

### 1. DMCA page names an incomplete process

`src/WDWrightPublicPage.jsx` labels the page “DMCA Policy,” invites written notices to the general company email, and says Wright is still finalizing a separate legal-review channel. The page does not identify a designated agent, agent address, or a Copyright Office registration. The product also has signed-in document and file-sharing surfaces in source, although those backend flows are not live in the current project.

The U.S. Copyright Office says service providers seeking the relevant Section 512 safe-harbor protection must publish designated-agent information and register the same information in its online directory. Whether Wright and each product surface qualify, and whether a current designation exists outside this repository, require company/counsel confirmation. Do not describe this page as an operative DMCA policy or publish guessed agent details. [Copyright Office designated-agent directory](https://www.copyright.gov/dmca-directory/), [Section 512 resources](https://www.copyright.gov/512/)

**Release decision:** Attorney/company facts required. First check the Copyright Office directory for the exact legal entity, trade names, and site domains; confirm the service-provider analysis; then either publish verified registered-agent details and an operational notice process or have counsel approve a narrower copyright-contact page.

### 2. Privacy notice does not describe observed collection and third parties in enough detail

The public Privacy page only lists broad information categories, use purposes, and a general contact. In code:

- `app/layout.jsx` loads a Google Tag Manager container (`GTM-TWW3MG8S`). Source does not reveal which tags are enabled or which identifiers, vendors, or data they use.
- `src/WDWrightPublicPage.jsx` saves multi-field quote/contact drafts in browser `localStorage`, including contact information, work location, schedule, service type, and project details. The request page gives a useful local-device warning, but the Privacy page does not describe this behavior.
- Firebase Auth/Firestore profile code processes account identity, phone, contact preferences, market, timing, notes, and account purpose. Firebase/Firestore are not currently active for this Firebase project, so source behavior and live data processing must be distinguished.
- Careers interest and future submissions may contain applicant contact and work-interest information. Existing career prep checklists are stored only in the browser; they are explicitly not applications.

The FTC advises businesses to honor privacy/security promises and accurately describe actual practices. A complete notice requires checking the actual GTM container and Firebase settings, data recipients, retention/deletion procedures, and applicable state-law scope; repository code cannot establish those facts. [FTC privacy and security guidance](https://www.ftc.gov/business-guidance/privacy-security)

**Release decision:** A precise statement about browser-local quote drafts is source-verifiable and could be added after a quick final code check. A detailed privacy policy, vendor inventory, retention schedule, and rights process require company operations facts and attorney review. Recommend disabling the unverified GTM loader until its tags, consent behavior, and disclosure are reviewed; this would stop third-party tag loading but may remove site measurement.

### 3. Terms page is a narrow informational disclaimer, not operating terms

The current Terms page correctly says public information is not a service agreement/work order and that final scope, coverage, schedule, and billing must be confirmed through actual service and dispatch processes. It does not establish account use rules, submissions/uploads, applicant submissions, payment/fee behavior, dispute channels, or other operating terms. Several of those product flows are only source scaffolding and Firebase is not live.

**Release decision:** Keep the existing narrow scope statement if company-approved. Do not add boilerplate liability waivers, arbitration, warranty, indemnity, governing-law, fee, or dispute clauses without counsel and business instructions. The site should not imply incomplete payment or document features are operational.

### 4. Accessibility page is aspirational and has no tested conformance statement

The page says the site “should provide” clear navigation and that accessibility may improve after content and forms are approved/tested. This reads as internal planning language. The site includes text-size, contrast, reduced-motion, and skip-link controls, but no repository evidence establishes complete keyboard/screen-reader coverage or conformance to a technical standard. DOJ guidance explains that ADA Title III can apply to businesses open to the public and discusses barriers such as keyboard access and text alternatives. [ADA.gov web accessibility guidance](https://www.ada.gov/resources/web-guidance/)

**Release decision:** A factual page can identify existing preference controls and give a real route to report an access barrier or request another format. Do not claim ADA/WCAG conformance, “fully accessible” status, or promise remediation timing without an audit and company-approved response process. Schedule keyboard and assistive-technology review before making conformance claims.

### 5. Recruiting surfaces need current-listing and accommodation process review

`src/wd-wright-data.js` currently hard-codes four role/location listings. `src/WDWrightCareersAccessSuite.jsx` explains that the local prep checklist is not an application, but its “Express interest” action can submit an interest request. No job descriptions, pay/shift details, posting dates, equal-opportunity statement, or accommodation contact are visible in the reviewed path. EEOC guidance says job advertisements should not express protected-trait preferences or discourage applicants; application procedures also matter for disability access. [EEOC prohibited employment practices](https://www.eeoc.gov/prohibited-employment-policiespractices), [EEOC recruiting and hiring guidance](https://www.eeoc.gov/employers/small-business/3-im-recruiting-hiring-or-promoting-employees)

**Release decision:** Company recruiting must confirm every role is currently open, location/service requirements, and whether interest submissions are received and handled. Counsel/HR should approve the equal-opportunity and accommodation language and applicant-data notice. Avoid collecting extra applicant details before there is an approved process.

## Additional fact checks before public release

- `src/wd-wright-data.js` previously made high-specificity claims including “24/7 dispatch-ready field response,” “47+ years,” “40+ offices,” “ISO 9001,” and “certified traffic control support.” These were removed from the public-facing components pending confirmation of evidence, dates, scope, and current certification status. Restore any only after the business supplies substantiation. Objective advertising claims should have a reasonable basis before publication. [FTC advertising substantiation policy](https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation)
- The profile preference allows phone/text contact, while the current setup copy correctly says text is not enabled and selecting a preference does not enroll someone in text messages. Keep it that way until a specific sender, purpose, consent language, consent records, opt-out process, and message operations are configured. The FCC treats SMS texts as covered “calls” under TCPA rules and has specific written-consent and revocation guidance for marketing contexts. [FCC TCPA consent FAQ](https://docs.fcc.gov/public/attachments/DOC-408396A1.pdf), [FCC revocation rules](https://docs.fcc.gov/public/attachments/FCC-24-24A1.pdf)
- If promotional email is ever sent, confirm the sending/opt-out workflow and message footer. FTC’s CAN-SPAM guide describes required opt-out handling and a valid physical postal address for commercial email. The public footer currently has a company address, but no sending system was verified in this review. [FTC CAN-SPAM compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- The privacy/contact pages list `W.D. Wright Contracting Inc.`, `wdwrightinc@wdwright.com`, and a phone number. Confirm the legal entity, privacy/copyright/recruiting contact ownership, postal address, and monitored inbox with the company.

## Scope and deployment boundary

Low-risk source corrections were made in `LegalView` and related public copy. The misleading “ready for final company-approved language” placeholder was removed. Privacy now describes the browser-local request draft and warns that a locally queued request is not proof Wright received it, while explicitly identifying the page as an incomplete privacy summary. Accessibility copy identifies controls present in the app and invites reports without claiming conformance. The `/dmca` route is labeled Copyright Contact Information and explicitly says it does not name a designated agent or define a formal notice process. Careers copy says listed roles may not be current and that an interest request is not a formal application. The GTM loader, including its no-script iframe, was removed pending review of the configured tags and consent behavior. Specific office-count, years-in-business, availability, and certification claims were replaced by project-scope guidance. No substantive legal terms or unverified compliance claims were added.

Company facts still required before a fuller policy can be supported: actual tag-manager tags/vendors/cookies and consent settings; Firebase/Auth/Firestore/Storage deployment and data processors; categories of collected information, purposes, retention/deletion and rights response; monitored privacy/recruiting/copyright contacts and legal entity/address; job status, requirements and applicant handling; site upload/comment features in production; current service area, staffing and certification evidence; commercial fees, cancellation, dispute and service-contract terms; and any registered DMCA agent. Counsel must determine applicable state/federal scope and approve policy/terms language.

The source changes were deployed to Firebase Hosting at `https://wd-wright-traffic.web.app`. The production build passed, and `/`, `/quote`, `/services`, `/faq`, `/privacy`, `/accessibility`, `/dmca`, and `/home` returned HTTP 200 with the expected content markers. The final hero-typography update was redeployed and verified. Only Hosting was deployed; Firestore rules and Functions were not deployed.

These corrections do not replace a full privacy notice, operating terms, verified designated-agent process, recruiting review, accessibility audit, or claims substantiation. Firestore, Authentication, Functions, SMS, and payment services remain unverified or offline in the current Firebase project; source code must not be presented as live processing.
