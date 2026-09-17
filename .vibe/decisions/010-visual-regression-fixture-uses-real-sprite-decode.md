---
date: 2026-09-17
status: accepted
---
# Visual regression fixture pairs a synthetic `.def` with the real `.sff` fixture

**Context:** Backlog item 012 needs baseline screenshots of the elements panel's composite preview, rendered from a real lifebar loaded through the app's real folder input and decoded through the real `sff` WASM bridge, not mocked drawing.

**Decision:** The visual spec loads a small, purpose-authored lifebar `.def` fixture (a handful of classic-named sections — `[Files]`, `[P1 Life Bar]`, `[P2 Life Bar]`, `[P1 Power Bar]`, `[P2 Power Bar]`, `[Combo]` — each with plain `pos`/`0.spr`/`0.offset` entries), packaged into its own folder (`tests/visual/fixtures/lifebar-pack/`) alongside a byte-for-byte copy of the project's existing real, downloaded-pack-derived `.sff` fixture (`src/wasm/testdata/v1-basic.sff`, one real decoded sprite), rather than vendoring a full real community lifebar pack's binary `.sff`. The copy (not a reference to the original path) exists because Playwright's directory-upload support — required by the real `<input webkitdirectory>` picker this app exposes — uploads one real folder as-is; the two files must physically live together.

**Reason:** The repo's real community `.def` fixtures (`src/lifebar/testdata/`) were deliberately trimmed to plain text only — no binary sprite/font/sound assets were ever vendored from those packs (license status), so none of them can drive a real sprite decode end to end. `v1-basic.sff` is the only real `.sff` binary already in the repository. Authoring a small `.def` that references that fixture's one real sprite (group 0, image 0) at several positions still exercises the full real pipeline (parsing → layout → WASM decode → canvas draw) for both bar-with-sprite and no-sprite-layer element states, which is what this backlog item's acceptance criteria actually require — real compositing, not a specific pack's content.

**Rejected alternatives:** Vendoring a new real community pack's `.sff` binary purely for this test — rejected as a new, unreviewed binary asset with the same informal-freeware licensing caveat already flagged for the existing trimmed `.def` fixtures, for no behavioral gain over reusing the one already accepted into the repo.
