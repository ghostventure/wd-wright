# WD Wright Firebase App

This directory contains the Next.js and Firebase source for the current WD Wright web app. React is the UI library; Next.js provides the application framework and static export.

## Local development

1. Install a current Node.js release and run `npm ci` in this directory.
2. Copy `.env.example` to `.env.local` and fill in the Firebase web app values for a project you control.
3. Configure Authentication and the required Firebase services in that project.
4. Run `npm run dev` to start the local app.

Firebase client configuration is in `src/firebase.js`. Firebase client API keys identify a Firebase app; protect data with Authentication and Security Rules, and keep server credentials in Firebase Secret Manager. Do not commit `.env.local` or service-account keys.

## Backend status

The repository includes Cloud Functions, Firestore rules, and Storage rules. The Functions deploy script is intentionally disabled in this copy. The source project previously reported Functions unavailable and Firestore disabled, so a code push does not deploy or activate those services. Configure billing, Firestore, Functions, required secrets, and your own project target before deployment.

## Documentation

- [Firebase backend hardening](docs/WDWRIGHT_BACKEND_HARDENING_2026-11-02.md)
- [Hosting-only deployment history and backend prerequisites](docs/WDWRIGHT_HOSTING_ONLY_DEPLOY_2026-05-06.md)
- [Documentation index](docs/README.md)
