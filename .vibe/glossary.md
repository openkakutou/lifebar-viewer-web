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
