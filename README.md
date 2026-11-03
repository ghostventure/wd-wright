# WD Wright Firebase App

This directory contains the Next.js and Firebase source for the current WD Wright web app. React is the UI library; Next.js provides the application framework and static export.

## Local development

1. Install a current Node.js release and run `npm ci` in this directory.
2. Copy `.env.example` to `.env.local` and fill in the Firebase web app values for a project you control.
3. Configure Authentication and the required Firebase services in that project.
4. Run `npm run dev` to start the local app.

Firebase client configuration is in `src/firebase.js`. Firebase client API keys identify a Firebase app; protect data with Authentication and Security Rules, and keep server credentials in Firebase Secret Manager. Do not commit `.env.local` or service-account keys.

## Backend status

The repository includes Cloud Functions, Firestore rules, and Storage rules. Cloud Functions are intentionally left off while Blaze is deferred. The latest Firestore API check returned 403, default database creation in `nam5` did not complete, and Firebase Authentication setup reported `CONFIGURATION_NOT_FOUND`. A code push does not activate these services. See the backend activation checklist before enabling live account, dispatch, file, recruiting, or billing workflows.

## Documentation

- [Firebase backend hardening](docs/WDWRIGHT_BACKEND_HARDENING_2026-11-02.md)
- [Installed UX features and integration limits](docs/WDWRIGHT_UX_FEATURES_2026-11-02.md)
- [40-feature installation and activation limits](docs/WDWRIGHT_FORTY_FEATURES_INSTALL_2026-11-02.md)
- [Hosting-only deployment history and backend prerequisites](docs/WDWRIGHT_HOSTING_ONLY_DEPLOY_2026-05-06.md)
- [Documentation index](docs/README.md)
