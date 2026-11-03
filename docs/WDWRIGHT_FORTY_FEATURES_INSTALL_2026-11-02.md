# WD Wright: 40 Feature Installation

Date: 2026-11-02

This source pass adds 40 planned feature surfaces in priority order. Public planning tools are interactive in the current page session. Customer, crew, dispatch, recruiting, and analytics views show empty or disabled states wherever real shared data or secure server actions are required. No sample customers, jobs, crews, applications, invoices, or metrics are presented as live records.

## Public project planning: 1–10

1. Service selector.
2. General permit preparation checklist.
3. Project scope builder.
4. Budget planning guide that lists cost factors without inventing rates.
5. Preliminary layout concept selector; it is not an approved traffic control plan.
6. Site-visit request preparation form; it does not send or book a visit.
7. Coverage question helper; it does not verify coverage.
8. Utility coordination checklist.
9. Preferred work-window planner; it does not check availability.
10. Road-restriction guidance that directs users to confirm current conditions with the responsible authority.

Public entry points: `/project-tools`, the public navigation/footer, and a callout on Services.

## Customer project portal: 11–20

11. Quote status tracker.
12. Quote history and version comparison.
13. Quote approval state.
14. Change requests.
15. Project calendar.
16. Secure file exchange.
17. Project notification preferences.
18. Service-day briefing.
19. Completion records.
20. Invoices and receipts.

These appear in the signed-in **Project tools** area. They currently show empty states; no project, payment, or file data is accepted or saved.

## Crew and field tools: 21–30

21. Shift board.
22. Availability and time-off requests.
23. Job check-in and check-out.
24. Digital timecard.
25. Vehicle inspection prompts.
26. Equipment readiness prompts.
27. Hazard reports.
28. Toolbox talk topics.
29. Credential renewal checklist.
30. Incident and near-miss reporting.

These appear in the manager-gated **Field Operations** area. Preparation checklists are temporary to the open page; a blank field brief can be printed. No employee, location, time, or incident data is saved. Live work and safety records remain unavailable. The module also includes an additional blank completion-record panel, which does not accept submissions.

## Dispatch and operations: 31–36

31. Dispatch assignment board.
32. Map and service-area planning.
33. Crew capacity planning.
34. Equipment allocation.
35. Request response queue.
36. Weather and road-closure risk panel.

These appear in **Field Operations** as manager-gated empty states. No assignments, capacity, equipment, road alerts, or weather feeds are connected.

## Recruiting and insights: 37–40

37. Candidate pipeline.
38. Interview scheduler.
39. New-hire onboarding template.
40. Service performance and customer feedback overview.

These appear in the manager-gated **People & Insights** area. The onboarding panel is a general planning guide, not an employee checklist. The candidate queue and analytics have no connected records or fabricated metrics.

## Activation boundary

- The public tools are usable as temporary planning aids; their inputs are not submitted or persisted.
- Customer portal, shared crew operations, dispatch, recruiting workflow, and reporting need authenticated backend data and role checks.
- The current Firebase project still has Firestore API disabled; default database creation in the selected `nam5` region returned HTTP 403. Authentication setup also reported `CONFIGURATION_NOT_FOUND`.
- Cloud Functions remain off because Blaze was deferred. Do not represent backend-dependent panels as operational until the corresponding services are initialized, rules and role access are verified, and the applicable integrations are deployed.
- `npm run deploy:hosting` completed successfully for `wd-wright-traffic`, releasing the static site to `https://wd-wright-traffic.web.app`. The build compiled and generated `/project-tools`; Google Fonts could not be downloaded during optimization, so Next.js skipped optimizing that stylesheet.
- No automated tests or authenticated/device runtime checks were run. Firestore, Authentication, Cloud Functions, Storage, and payment services were not deployed or activated.
- No GitHub push was performed from this checkout.
