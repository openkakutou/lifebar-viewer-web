---
status: done
---
# Adopt `web-ui-kit` Design System

## Description
This repo has no UI yet beyond a placeholder (`src/main.ts` just writes a version string) — the ideal moment to adopt the org's shared design system (`web-ui-kit`: layout shell, form/input components, canvas/viewport controls, design tokens) before building any real screen, rather than retrofitting it later. `web-ui-kit` is a plain ESM package (native Web Components + CSS custom-property tokens, no framework), matching this app's own framework-free TypeScript/Vite stack. See `roadmap`'s `.vibe/decisions/011`.

## Acceptance Criteria
- [ ] `web-ui-kit` added as a dependency, its layout shell used as this app's root frame
- [ ] Design tokens (color/spacing/typography, including light/dark) applied instead of any ad-hoc CSS
- [ ] No existing functionality (version display) regresses
- [ ] A missing/failed `web-ui-kit` asset load (e.g. tokens stylesheet not found) degrades to a visible error state rather than a blank page

## Notes
Should land before or alongside item 004 (Elements Panel + Preview Renderer) — the first real screen. Cross-repo dependency: `web-ui-kit` repo must exist with at least its layout shell/tokens published (it does, as of this writing).
