---
status: todo
depends_on: [010]
---
# Split Shared Ikemen GO Sections Into Per-Player Elements

## Description
Even once a modern Ikemen GO section name like `[Lifebar]` is recognized (item 010), it doesn't map cleanly onto this app's current element model: the app currently treats one recognized section as one visual element, reading its layout directly from that section's own `pos`/`N.spr`/`N.offset` entries. A real `[Lifebar]` section instead holds **both players' data at once**, distinguished only by a `p1.`/`p2.` key prefix inside the same section (e.g. `p1.pos`, `p2.pos`, `p1.bg0.anim`, `p2.bg0.anim`). Without handling this, the elements panel and preview can recognize the section exists but still can't correctly render two separate per-player elements from it.

## Acceptance Criteria
- [ ] A recognized section whose entries use `p1.`/`p2.` key prefixes is split into two elements (one per player) in the elements panel and preview, each using only its own player's prefixed entries
- [ ] A recognized section with no `p1.`/`p2.` prefixing (the old MUGEN one-section-per-player style, e.g. `[P1 Life Bar]` itself) continues to render as a single element exactly as today — no regression
- [ ] The real "VHD" pack's `[Lifebar]`/`[Powerbar]`/`[Face]`/`[Name]` sections each render as two distinct, independently positioned/highlighted elements (P1 and P2) in the elements panel
- [ ] A section that mixes prefixed and unprefixed entries, or uses only one player's prefix, degrades to a clear state rather than a crash or silently-wrong layout (mirrors this app's existing "diagnostic, not silent" precedent — see `.vibe/decisions/004`)

## Notes
Concrete real-file evidence (2026-08-31), from `/home/neolao/workspace/ikemen-quick-versus/lifebars/VHD/fight.def`'s `[Lifebar]` section:

```
[Lifebar]
p1.pos    		= 0,0
p1.bg0.anim 		= 170
p1.bg0.offset 		= 640,78;75
p1.bg0.layerno 		= 0
...
p2.pos    		= ...
p2.bg0.anim 		= ...
```

This is a real, structural rework of `element-layout.ts`'s current "one section = one element, read `pos`/`N.spr` directly off it" assumption — bigger than a parser/pattern change, expect it to touch the elements panel's rendering too. Depends on item 010 (section names must be recognized before there's anything here to split).
