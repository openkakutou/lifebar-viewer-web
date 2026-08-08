---
status: todo
depends_on: [001]
---
# Lifebar File Input & Parsing

## Description
Since this is a static site with no backend, the user must supply a lifebar's `.def`-style file directly from their machine. Add a file input (standard file picker and/or drag-and-drop) that lets the user select or drop the lifebar file, reads it as text, and feeds it into an internal parser for the lifebar `.def`-style format — implemented in this app, not a separate library (see `roadmap`'s `.vibe/decisions/009`). The parser must handle both MUGEN and Ikemen GO lifebar files: section-based layout (element positions, fonts, sprite group/index references) plus Ikemen GO's own extensions where they diverge from MUGEN's format.

## Acceptance Criteria
- [ ] User can select the lifebar `.def`-style file via a file picker, or drag-and-drop it onto a drop zone
- [ ] The selected file is parsed into a typed in-memory representation of its sections/elements
- [ ] Both MUGEN and Ikemen GO lifebar files parse into the same internal representation
- [ ] A malformed or unreadable file shows a clear error state instead of crashing the page
- [ ] An unrecognized/unsupported section is skipped with a warning rather than aborting the whole parse

## Notes
None.
