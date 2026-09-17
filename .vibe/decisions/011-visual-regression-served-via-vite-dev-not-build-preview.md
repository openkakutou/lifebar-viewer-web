---
date: 2026-09-17
status: accepted
---
# Visual regression tests serve the app via `vite`'s dev server, not a build+preview step

**Context:** Playwright's `webServer` needs a running instance of the app to screenshot. The obvious option mirrors production: `npm run build` then `vite preview`.

**Decision:** `playwright.config.ts`'s `webServer.command` runs the plain dev server (`vite`, the existing `npm run dev` script) instead of building first and running `vite preview`.

**Reason:** `public/wasm/` (the downloaded `sff` WASM build the composite preview depends on at runtime) is served as static content by Vite's dev server exactly the same way it would be after a build — no build step changes how those two files are reached (both are fetched from `./wasm/...`, relative to the page). Skipping the build removes an entire ordering hazard for no loss of fidelity: a `wasm:download` step accidentally sequenced after `build` would silently ship a working dev server but a broken built bundle, producing a passing visual suite over a broken deployed app — the opposite of what this suite exists to catch. This also mirrors `web-ui-kit`'s own precedent (`tests/visual/dev-preview.visual.spec.ts` serves `dev-preview/` via its own dev server, never a build).

**Rejected alternatives:** Build + `vite preview`, matching the real GitHub Pages deployment path exactly — rejected because this app has no build-time-only rendering logic (no SSR, no bundler-conditional code paths) for a build to meaningfully exercise here, and the ordering hazard above is a real, previously-flagged risk (this app's own `deploy-pages.yml` already carries a comment about `wasm:download` needing to precede `Test`/`Build` for the same reason).
