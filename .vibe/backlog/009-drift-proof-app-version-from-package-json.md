---
status: todo
---
# Drift-Proof App Version From package.json

## Description
`src/version.ts` hardcodes `appVersion` as a separate string literal from `package.json`'s own `"version"` field. The two have already drifted: `package.json` is at `0.5.0` while `src/version.ts` still reads `"0.2.0"`, so the app's own displayed version (toolbar title) has been stale for at least two prior releases. Read the real version from `package.json` at build time instead (e.g. via a Vite-injected define, or importing the JSON directly with `resolveJsonModule`) so the two can never diverge again.

## Acceptance Criteria
- [ ] The toolbar's displayed version always matches `package.json`'s `"version"` field, with no manual sync step
- [ ] A version bump in `package.json` alone (no other file edit) is reflected in the built app
- [ ] Existing tests asserting the toolbar title's version text still pass, updated to reflect the new source of truth

## Notes
The sibling `lifebar-editor` repo has the exact same drift (its own `.vibe/backlog/010-drift-proof-app-version-from-package-json.md`) — a reasonable reference implementation once either repo resolves it, though each app keeps its own independent code per roadmap decision `009`.
