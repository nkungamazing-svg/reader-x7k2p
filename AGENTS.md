# AGENTS — คลังบทแปล (mobile novel reader PWA)

Static Thai reading PWA: `index.html`, `app.js`, `style.css`, `manifest.webmanifest`, `service-worker.js`, `icons/`, `fonts/`.
No build step, no package manager, no dependencies, no secrets. Data lives in the browser's IndexedDB.

## Versioning (required on every change)

* Every change — feature, fix, copy edit, style tweak — bumps the version before committing.
* The patch number runs `0`–`9`; the tenth bump rolls into the minor number: `1.4.0 … 1.4.9 → 1.5.0`.
* Never bump by hand in one file only. Run `python3 tools/bump-version.py patch` (or `minor` / `major`); it updates `APP_VERSION` in `app.js` and `CACHE_NAME` in `service-worker.js` together.
* The version is shown on the launch splash and at the bottom of the settings sheet, so readers can confirm what they are running.

## Checks before committing

* `node --check app.js` and `node --check service-worker.js`.
* Every `byId("…")` / `document.getElementById("…")` target exists in `index.html`.
* Serve the repo root (`python3 -m http.server 3000 --bind 0.0.0.0`) and confirm `index.html`, `app.js`, `style.css`, `service-worker.js` return 200.
* There is no browser in the cloud worktree; interactive behaviour must be confirmed on a phone. Say so instead of claiming it was tested.

## Commit and push

* Commit with a short "why" subject, then push to `main` on the connected repo. Pushing after a completed change is pre-authorized.
* Never force push, never commit `.freebuff/`, never commit secrets or user data (chapter backups must stay out of the repo).

## Conventions

* UI copy is Thai; keep new strings Thai and match the existing tone.
* Mobile-first: minimum 44px touch targets, `env(safe-area-inset-*)` for notches, `prefers-reduced-motion` respected.
* Accessibility: interactive elements need `aria-label`/`aria-pressed`; state changes go through `aria-*` where one exists.
