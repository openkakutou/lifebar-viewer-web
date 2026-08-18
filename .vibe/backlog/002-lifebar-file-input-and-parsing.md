---
status: todo
depends_on: [001]
---
# Lifebar File Input & Parsing

## Description
Since this is a static site with no backend, the user must supply a lifebar's `.def`-style file directly from their machine. Folder selection is the **only** input path: the user selects or drops an entire folder (e.g. a distributed lifebar pack bundling the `.def`-style file with other assets), rather than a single-file picker — picking one file alone can never grant the browser access to sibling files anyway (see Notes), so folder selection is what an equivalent single-file design would have needed regardless. If the folder contains exactly one candidate lifebar file, it's loaded automatically; if it contains more than one, the user is prompted to pick which one to load. The chosen file is read as text and parsed into an internal parser for the lifebar `.def`-style format — implemented in this app, not a separate library (see `roadmap`'s `.vibe/decisions/009`). The parser must handle both MUGEN and Ikemen GO lifebar files: section-based layout (element positions, fonts, sprite group/index references) plus Ikemen GO's own extensions where they diverge from MUGEN's format.

## Acceptance Criteria
- [ ] User can select a folder via a directory picker, or drag-and-drop a folder
- [ ] If the folder contains exactly one candidate lifebar file, it is loaded automatically
- [ ] If the folder contains multiple candidate files, the user is prompted to pick which one to load, instead of the app silently choosing one
- [ ] The selected file is parsed into a typed in-memory representation of its sections/elements
- [ ] Both MUGEN and Ikemen GO lifebar files parse into the same internal representation
- [ ] A malformed or unreadable file shows a clear error state instead of crashing the page
- [ ] An unrecognized/unsupported section is skipped with a warning rather than aborting the whole parse

## Notes
Web platform constraint driving this design: picking a single file never grants access to sibling files — neither `<input type="file">` nor the File System Access API's `FileSystemFileHandle` exposes a parent directory, by deliberate browser sandboxing. There is no simpler single-file alternative to fall back to on the web; folder selection is the baseline, not an enhancement.

Browser support: `<input webkitdirectory>` (Chrome/Firefox/Safari) with `webkitRelativePath` per `File`, or `DataTransferItem.webkitGetAsEntry()` + `FileSystemDirectoryReader.readEntries()` for drag-and-drop.
