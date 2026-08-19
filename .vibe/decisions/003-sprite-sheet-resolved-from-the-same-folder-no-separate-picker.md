---
date: 2026-08-19
status: accepted
---
# Sprite sheet is resolved from the already-gathered lifebar folder, not a second file picker

**Context:** Backlog item 003 needs a `sff` WASM bridge and "the matching `.sff` file bytes" to decode sprites a loaded lifebar references. Item 002 already established folder-only input specifically because a lifebar is distributed as a **pack** — the `.def`-style file bundled together with its referenced assets, including sprite sheets — in one folder (`.vibe/decisions/002-folder-only-input-and-warn-on-unrecognized-sections.md`). A separate, second file picker for the `.sff` file would ask the user to select something already sitting in the folder they just picked.

**Decision:**
- The sprite sheet is resolved from the exact same `GatheredFile[]` the folder input already gathered for the lifebar file itself — filtered to `.sff` candidates the same way item 002 filters to `.def` candidates — not a new, separate input control.
- Resolution only runs after the lifebar file itself has loaded successfully (auto-picked or user-selected via item 002's own multi-candidate prompt), using that same file list.
- Exactly one `.sff` candidate auto-resolves silently, mirroring item 002's own "auto-pick if there's exactly one" rule for the lifebar file. **Zero or multiple candidates do not block the lifebar load or add a second selection prompt** — the sprite sheet stays unresolved (reported in the status text, not as an error) and later screens (item 004, the elements panel) that actually need specific sprites can surface a targeted message when a real reference can't be resolved. Acceptance criteria here only require a bridge that returns decoded data given sprite references and file bytes, and a clear error for a missing/corrupt file — not a UI for picking among several sprite sheets, which nothing in this item asks for and no real fixture evidence yet justifies designing for.

**Reason:** Reusing the folder's own contents keeps the interaction model the acceptance criteria and item 002 already established (folder-only, because a single-file picker can't reach sibling assets in a browser) instead of contradicting it with a second, separate upload step for a file that's already been read. Deferring the "several sprite sheets" case avoids speculatively designing a second selection UI with no acceptance criteria or real-file evidence calling for it — the "unrecognized section" precedent (item 002) already established that this app prefers reporting what it can't resolve over blocking on it.

**Rejected alternatives:**
- **A second, independent file picker for the `.sff` file** (`lifebar-editor`'s own item 003 shape, where sprite-sheet browsing is genuinely a separate user action from loading the lifebar): rejected here — that app's own sprite input exists because a user browses *any* sheet to assign sprites during editing; this app only ever needs the sheet(s) its own already-loaded lifebar references, always sitting in the same already-gathered folder.
- **A second "which sprite sheet?" prompt mirroring item 002's multi-candidate UI**: rejected for now — no acceptance criteria ask for it, and no real lifebar pack has been observed yet to know whether "multiple `.sff` files in one pack" is a real, common case worth a dedicated flow (deferred to item 006's fixture-driven hardening, same precedent as item 002's known-section list).
