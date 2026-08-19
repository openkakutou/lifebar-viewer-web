# Module: document
**Role:** In-memory representation of what's currently loaded, one store per format — for a later screen (the elements panel) to read from. The lifebar store holds the parsed document, its file name, and any parse warnings; the sprite sheet store holds the file name, raw bytes, and decoded metadata of the sprite sheet resolved from the same folder.
**Files:** `src/document/lifebar-document-store.ts`, `src/document/sff-sprite-sheet-store.ts`
**Exports:** `LifebarViewerDocument`, `getLifebarDocument(): LifebarViewerDocument | null`, `setLifebarDocument(doc)`, `resetLifebarDocumentForTests()`, `SffSpriteSheetDocument`, `getSffSpriteSheet(): SffSpriteSheetDocument | null`, `setSffSpriteSheet(doc)`, `resetSffSpriteSheetForTests()`
**Depends on:** `modules/lifebar.md`, `modules/wasm.md`
