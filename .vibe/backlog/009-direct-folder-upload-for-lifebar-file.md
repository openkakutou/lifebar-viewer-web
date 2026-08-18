---
status: todo
depends_on: [002]
---
# Direct Folder Upload for Lifebar File

## Description
Add a folder-selection option alongside the single-file picker/drag-and-drop from item 002: let the user select or drop an entire folder (e.g. a distributed lifebar pack bundling the `.def`-style file with other assets) and have the viewer locate and load the correct file by extension automatically, without needing to drill down to the exact file manually. The file is matched by extension within the folder (recursing into subfolders as needed) and fed into the same parser item 002 already uses.

## Acceptance Criteria
- [ ] User can select a folder via a directory picker, or drag-and-drop a folder, and have the lifebar file load successfully once found inside it
- [ ] The file is matched by extension regardless of subfolder depth within the dropped/selected folder
- [ ] A folder containing no matching file shows a clear error state, same UX as item 002's malformed/unreadable-file case
- [ ] A folder containing multiple candidate files shows a clear error or a disambiguation choice instead of silently picking one

## Notes
Browser support: click-to-browse folder selection uses the non-standard but widely supported `<input webkitdirectory>` attribute; drag-and-drop of a folder requires walking `DataTransferItem.webkitGetAsEntry()` / `FileSystemDirectoryReader` instead of the flat `FileList` used by item 002. Matching/parsing logic should share the same path item 002 already established, not duplicate it.
