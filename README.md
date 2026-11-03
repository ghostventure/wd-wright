# WD Wright Firebase App

This directory contains the Next.js and Firebase source for the current WD Wright web app. React is the UI library; Next.js provides the application framework and static export.

## Local development

1. Install a current Node.js release and run `npm ci` in this directory.
2. Copy `.env.example` to `.env.local` and fill in the Firebase web app values for a project you control.
3. Configure Authentication and the required Firebase services in that project.
4. Run `npm run dev` to start the local app.

Firebase client configuration is in `src/firebase.js`. Firebase client API keys identify a Firebase app; protect data with Authentication and Security Rules, and keep server credentials in Firebase Secret Manager. Do not commit `.env.local` or service-account keys.

## Backend status

The `wd-wright-traffic` project now has a Standard Firestore Native database in `nam5` with deletion protection, deployed Firestore rules, and Email/Password plus Google sign-in providers. These services are provisioned, but authenticated profile, quote, and Google sign-in flows still need runtime verification. Cloud Functions remain undeployed while Blaze billing is deferred, and Cloud Storage has not been deployed in this pass. See the [backend activation status](docs/WDWRIGHT_BACKEND_ACTIVATION_2026-11-03.md) before treating dispatch, file, recruiting, or payment workflows as live.

## Documentation

- [Firebase backend hardening](docs/WDWRIGHT_BACKEND_HARDENING_2026-11-02.md)
- [Installed UX features and integration limits](docs/WDWRIGHT_UX_FEATURES_2026-11-02.md)
- [40-feature installation and activation limits](docs/WDWRIGHT_FORTY_FEATURES_INSTALL_2026-11-02.md)
- [Hosting-only deployment history and backend prerequisites](docs/WDWRIGHT_HOSTING_ONLY_DEPLOY_2026-05-06.md)
- [Documentation index](docs/README.md)
