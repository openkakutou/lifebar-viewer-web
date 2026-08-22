# Data models

## LifebarEntry
| Field | Type | Notes |
|---|---|---|
| key | string | original casing, unevaluated |
| value | string | original casing, unevaluated |
| line | number | 1-indexed source line |
Defined in: `src/lifebar/document.ts`

## LifebarSection
| Field | Type | Notes |
|---|---|---|
| name | string | original casing |
| entries | LifebarEntry[] | ordered, duplicates kept |
| line | number | 1-indexed source line of the section header |
Defined in: `src/lifebar/document.ts`

## LifebarDocument
| Field | Type | Notes |
|---|---|---|
| sections | LifebarSection[] | only *recognized* sections (see `isKnownSectionName`) — an unrecognized one is excluded here and reported as a parse warning instead |
Defined in: `src/lifebar/document.ts`

## GatheredFile
| Field | Type | Notes |
|---|---|---|
| file | File | |
| relativePath | string | relative to the selected folder |
Defined in: `src/input/folder-entries.ts`

## LifebarViewerDocument
| Field | Type | Notes |
|---|---|---|
| fileName | string | |
| document | LifebarDocument | |
| warnings | string[] | line-numbered, one per skipped unrecognized section |
Defined in: `src/document/lifebar-document-store.ts`

## Sprite / SpriteGroup
Mirrors the `sff` WASM module's JSON contract field-for-field: sprite metadata only, never decoded pixel data.

| Type | Field | Type | Notes |
|---|---|---|---|
| SpriteGroup | index | number | |
| SpriteGroup | sprites | Sprite[] | In file order |
| Sprite | group / image | number | Together identify the sprite within the sheet |
| Sprite | width / height | number | Pixel dimensions |
| Sprite | axisX / axisY | number | Pivot point offset from the top-left corner |
| Sprite | palette | number | Reference to the palette this sprite is drawn with |
Defined in: `src/wasm/types.ts`

## SpriteSheetResult / SpritePixelResult
Discriminated-union results from the WASM bridge. `SpriteSheetResult` is `{ok: true, spriteGroups} | {ok: false, error}` for a whole-sheet load. `SpritePixelResult` is `{ok: true, pixels, width, height} | {ok: false, error}`, one per requested sprite in a batched decode call.
Defined in: `src/wasm/bridge.ts`

## SpriteSheetFolderResult
Resolves and loads the sprite sheet from the same folder listing gathered for the lifebar file: `{status: "success", fileName, relativePath, sffBytes, spriteGroups} | {status: "none-found"} | {status: "multiple-found", candidates} | {status: "read-error", fileName, message} | {status: "setup-error", fileName, message} | {status: "parse-error", fileName, message}`.
Defined in: `src/input/sprite-sheet-folder-input.ts`

## SffSpriteSheetDocument
| Field | Type | Notes |
|---|---|---|
| fileName | string | |
| sffBytes | Uint8Array | |
| spriteGroups | SpriteGroup[] | |
Defined in: `src/document/sff-sprite-sheet-store.ts`

## ElementLayout / ElementLayer / Point / Box
A recognized section's computed layout, read from its own raw entries. `ElementLayout` is `{name, origin: Point, layers: ElementLayer[]}`. `ElementLayer` is `{index, offset: Point, spriteRef: {group, image} | null}` (`spriteRef` null when its `N.spr` value is malformed). `Point` is `{x, y}`; `Box` is `{x, y, width, height}`.
Defined in: `src/elements/element-layout.ts`

## LayerResolution / ElementBoxResult
`LayerResolution` is a layer's resolution against a (possibly not-yet-loaded) sprite sheet: `{kind: "no-sheet"} | {kind: "invalid", raw} | {kind: "resolved", sprite: Sprite}` — three distinct states, not one generic "unresolved" (see `.vibe/decisions/004`). `ElementBoxResult` is `{box: Box, layerResolutions: LayerResolution[]}`, one resolution per layer in `ElementLayout.layers` order.
Defined in: `src/elements/element-layout.ts`
