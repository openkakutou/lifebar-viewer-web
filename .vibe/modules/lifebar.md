# Module: lifebar
**Role:** The lifebar `.def`-style format itself — a generic, unevaluated data model and its text parser. Independent from `lifebar-editor`'s own separate parser for the same format (roadmap decision 009).
**Files:** `src/lifebar/document.ts`, `src/lifebar/known-sections.ts`, `src/lifebar/parse.ts`
**Exports:** `LifebarEntry`, `LifebarSection`, `LifebarDocument`, `parseLifebar(text): LifebarParseResult`, `LifebarParseResult`, `isKnownSectionName(name): boolean`
**Depends on:** (none — pure, no I/O)
