---
status: done
---
# Visual Regression Tests

## Description
Add automated Playwright screenshot-comparison tests covering the elements panel's live composite preview — a real lifebar's rendered layers at rest, and again with the life/power/combo simulation sliders driving specific values (including each value's diagnostic overlay). See roadmap decision `024-visual-regression-testing-via-playwright-screenshots.md` for the shared approach.

## Acceptance Criteria
- [x] The app's Playwright config extends `web-ui-kit`'s shared visual-testing config/fixture
- [x] Baseline screenshots exist for: a real lifebar's composite preview at default/rest values, and after driving life/power/combo simulation to specific non-default values (with diagnostic overlays visible)
- [x] `npm run test:visual` runs these in CI as its own job, separate from `npm test`, and fails the build on a diff
- [x] A real, deliberate compositing regression (verified by temporarily breaking one covered path, then reverting) is caught by this suite

## Notes
Depends on `web-ui-kit` backlog item `013-visual-regression-shared-playwright-config-and-component-snapshots` landing first.
