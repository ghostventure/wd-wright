# WD Wright Manager's Desk Install

Date: 2026-05-07

## Scope

This pass added a dedicated `Manager's Desk` profile to the authenticated WD Wright shell for manager-capable accounts.

## Main File

- `src/WDWrightAuthenticatedApp.jsx`

## What Changed

- Added a manager-only `Manager's Desk` navigation destination in the protected account shell.
- Added desk-level metrics for office routing, market focus, capacity forecast, and crew readiness.
- Added desk profile records for desk owner, office hint, market, support tier, and stage ownership.
- Added dispatch posture, timeline review, and shift-feed surfaces using the existing WD Wright operations helpers.
- Added manager quick actions to move into jobs, booking, documents, and admin review when available.

## Access Logic

- `Manager's Desk` is available to privileged WD Wright users and `agent` account types.
- It stays hidden from standard end-user accounts.

## Result

WD Wright now has a dedicated operations-facing manager profile instead of forcing managerial posture to live only inside admin or general dashboard panels.
