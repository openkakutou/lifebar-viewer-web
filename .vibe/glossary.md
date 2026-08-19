# Ubiquitous Language

## Lifebar
The health bar, power bar, combo counter, and round display UI a MUGEN/Ikemen GO match uses. Defined by a single `.def`-style text file this app parses and previews, without running a real match.
**Do not confuse with:** Section — a lifebar is the whole file; a section is one block within it.
_Sources: `src/lifebar/document.ts`, `src/lifebar/parse.ts`_

## Section
A `[Section Name]` block within a lifebar's `.def`-style file, holding an ordered list of `key = value` entries. This app only builds a typed representation for sections it recognizes (life bar, power bar, face, name, win icons, match wins, round time, combo); any other syntactically valid section is skipped with a warning rather than blocking the load.
_Sources: `src/lifebar/document.ts`, `src/lifebar/parse.ts`, `src/lifebar/known-sections.ts`_

## Lifebar pack
A folder distributed as a unit, bundling a lifebar's `.def`-style file together with the other assets it references (fonts, sprite sheets). This app's input is folder-only for exactly this reason: a single picked file can never reach its sibling assets in the browser.
_Sources: `src/input/folder-entries.ts`, `src/input/candidate-files.ts`, `src/input/lifebar-folder-input.ts`_

## Sprite sheet
A MUGEN/Ikemen GO `.sff` file: a collection of Sprites, organized into Sprite groups, that a Lifebar's elements reference for their visuals (the life bar/power bar fill graphics, the combo counter digits, and so on). Always distributed inside the same Lifebar pack as the lifebar itself, so this app resolves it automatically from the same folder rather than asking the user for it separately. Decoded via the sibling `sff` library's WebAssembly build, not reimplemented in this app.
**Do not confuse with:** Lifebar, which is the separate `.def`-style file that *references* a sprite sheet's sprites — this app parses each with its own independent logic.
_Sources: `src/wasm/types.ts`, `src/wasm/bridge.ts`, `src/input/sprite-sheet-folder-input.ts`_

## Sprite
One image within a Sprite sheet, identified by its group and image index (e.g. group 0, image 3), with its own pixel dimensions, pivot (axis) point, and palette reference.
_Sources: `src/wasm/types.ts`_
