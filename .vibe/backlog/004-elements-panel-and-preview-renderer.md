---
status: in_progress
depends_on: [003]
---
# Elements Panel + Preview Renderer

## Description
Add an elements panel that lists every configured element found in the parsed lifebar (life bar, power bar, combo counter, round display, etc.), and a preview renderer that draws a live visual composite of those elements using the sprites resolved by the `sff` WASM bridge (item 003). This is the first screen where a lifebar becomes actually visible rather than just parsed data.

## Acceptance Criteria
- [ ] Every top-level element defined in the lifebar file (life bar, power bar, combo counter, round display, and any others present) is listed in the panel
- [ ] Selecting/viewing an element highlights or focuses its corresponding region in the preview renderer
- [ ] The preview renders each element at its configured position using its resolved sprite(s)
- [ ] An element whose sprite failed to resolve (item 003 error case) renders a clear placeholder in the preview instead of a broken image or crash
- [ ] A lifebar with zero recognized elements shows an empty-state message instead of a blank panel

## Notes
None.
