---
date: 2026-09-08
status: accepted
---
# App version read via a `resolveJsonModule` import, not a Vite `define`

**Context:** `src/version.ts` hardcoded `appVersion` as a string literal separate from `package.json`'s own `"version"` field, and the two had already drifted across releases.

**Decision:** Enable `resolveJsonModule` in `tsconfig.json` and have `src/version.ts` import the `version` named export straight from `../package.json`, re-exporting it as `appVersion`.

**Reason:** This app's `tsc` typecheck, Vite dev/build, and Vitest are all Vite-based and resolve JSON imports identically with no extra config beyond the one `tsconfig.json` flag — unlike a Vite `define`, which only Vite's own bundler understands, leaving `tsc --noEmit` and Vitest needing a second, separately-maintained wiring for the same value. Importing only the `version` named export (not the whole object as a default import) keeps the rest of `package.json` (scripts, dependency names/versions) out of the shipped bundle.

**Rejected alternatives:** A Vite `define` (`import.meta.env`-style constant injected at build time) — works for the production build but needs its own equivalent setup for `tsc` and for Vitest, doubling the places the wiring can drift or be forgotten, which is the exact class of problem this change exists to close.
