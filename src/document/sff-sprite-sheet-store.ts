// The in-memory representation of the currently resolved sprite sheet for
// the loaded lifebar: its file name, raw bytes (needed for later on-demand
// pixel decodes), and decoded metadata. `null` before one resolves (no
// candidate found, several found, or an error — see
// sprite-sheet-folder-input.ts). A plain module-level variable with a
// test-only reset, mirroring `lifebar-document-store.ts`'s own shape for
// the same kind of in-process, no-external-effect state.
import type { SpriteGroup } from "../wasm/types.ts";

export interface SffSpriteSheetDocument {
  fileName: string;
  sffBytes: Uint8Array;
  spriteGroups: SpriteGroup[];
}

let current: SffSpriteSheetDocument | null = null;

/** The currently resolved sprite sheet, or `null` before one loads successfully. */
export function getSffSpriteSheet(): SffSpriteSheetDocument | null {
  return current;
}

/** Replaces the currently resolved sprite sheet. Pass `null` to clear it. */
export function setSffSpriteSheet(doc: SffSpriteSheetDocument | null): void {
  current = doc;
}

/** Resets the in-memory sprite sheet to its initial (unresolved) state. Test-only. */
export function resetSffSpriteSheetForTests(): void {
  current = null;
}
