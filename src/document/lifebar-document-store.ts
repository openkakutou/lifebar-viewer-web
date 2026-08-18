// The in-memory representation of the currently loaded lifebar file: the
// parsed document, the file name it came from, and any parse warnings
// (unrecognized sections skipped) — the single place a later screen (the
// elements panel, item 004) reads from. A plain module-level variable with
// a test-only reset, mirroring `lifebar-editor`'s own
// `lifebar-document-store.ts` for the same kind of in-process,
// no-external-effect state.
import type { LifebarDocument } from "../lifebar/document.ts";

export interface LifebarViewerDocument {
  fileName: string;
  document: LifebarDocument;
  warnings: string[];
}

let current: LifebarViewerDocument | null = null;

/** The currently loaded lifebar file, or `null` before any file loads successfully. */
export function getLifebarDocument(): LifebarViewerDocument | null {
  return current;
}

/** Replaces the currently loaded lifebar document. Pass `null` to clear it. */
export function setLifebarDocument(doc: LifebarViewerDocument | null): void {
  current = doc;
}

/** Resets the in-memory document to its initial (unloaded) state. Test-only. */
export function resetLifebarDocumentForTests(): void {
  current = null;
}
