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
