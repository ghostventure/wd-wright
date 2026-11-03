# WD Wright Backend Data And Document Strengthening

Date: 2026-05-06

This pass installs the next backend tranche after operations scale. The focus here is document governance, lead-data quality, intake export/comment flows, profile completeness, account lifecycle controls, and data/security observability.

## Installed Components

The following items from the ranked backend roadmap are now installed in the repo:

61. Secure document metadata service
62. File type verification
63. Virus-scan hook
64. Versioned document records
65. Retention policy engine
66. Document access policy service
67. Expiring share links
68. OCR/metadata extraction pipeline
69. Lead normalization pipeline
70. Lead-source attribution service
71. Lead comment thread model
72. Intake export endpoint
73. Profile completeness scorer
74. Contact-preference service
75. Account merge service
76. Account archival flow
77. Soft-delete recovery flow
78. Account merge conflict review
79. Firestore write/read monitoring
80. Security incident playbook hooks

## File Summary

### `functions/data-document-services.js`

Adds the shared document/data governance layer:

- secure document metadata builder
- MIME/extension verification
- retention-policy shaping
- access-policy shaping
- versioned document registration
- virus scan and OCR queue hooks
- expiring document share links
- lead normalization and source attribution
- lead comment persistence
- intake export assembly
- profile completeness scoring
- contact preference shaping
- account merge preview/conflict review
- account archive/restore helpers
- Firestore access metrics
- security incident hook creation

### `functions/index.js`

Wires the new governance services into the authenticated session surface:

- session bootstrap now includes profile completeness and contact-preference insights
- session bootstrap records a Firestore access metric
- new `/api/session/*` routes are installed for:
  - `GET /api/session/intake/export`
  - `POST /api/session/document/register`
  - `POST /api/session/document/share-link`
  - `POST /api/session/lead/comment`
  - `POST /api/session/account/archive`
  - `POST /api/session/account/recover`
  - `POST /api/session/account/merge-preview`

### `src/wd-wright-account-services.js`

The shared profile save path now includes:

- computed profile completeness score
- normalized contact-preference state
- merge preview/conflict helpers for WD Wright account records

### `src/wd-wright-backend.js`

Lead intake now stores stronger data quality payloads:

- normalized intake fields
- source attribution
- initial comment-thread seed
- derived contact-preference/profile-depth enrichment on subscribed user records

### `src/WDWrightWorkspace.jsx`

Workspace consent writes now use the `wd-wright-v1` marketing consent version key.

### `scripts/backend-smoke.mjs`

The backend smoke suite now asserts the full data/document-strengthening tranche.

## Verification

The following checks passed after installation:

- `npm run test:backend:smoke`
- `node --check src/wd-wright-backend.js`
- `node --check src/wd-wright-account-services.js`
- `npm run build`

Note: `node --check` does not support `.jsx` files directly, so JSX syntax validation continues to be covered by the successful Next.js build.

## Deployment Status

Hosting-safe updates are included in the latest Hosting release.

Functions-side code is installed in the repo, but it is still not live on `wd-wright-traffic` until Blaze is enabled and Firebase Functions deployment is re-enabled for that project.
