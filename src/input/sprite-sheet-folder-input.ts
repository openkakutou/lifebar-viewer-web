// Resolves and loads a lifebar's sprite sheet from the exact same folder
// listing already gathered for the lifebar file itself — not a second,
// separate picker — since a lifebar pack bundles the `.def`-style file
// together with the sprite sheet(s) it references. See
// .vibe/decisions/003-sprite-sheet-resolved-from-the-same-folder-no-separate-picker.md.
import {
  type SpriteSheetResult,
  type WasmBridgeOptions,
  loadSpriteSheet as defaultLoadSpriteSheet,
} from "../wasm/bridge.ts";
import type { SpriteGroup } from "../wasm/types.ts";
import { findCandidateSpriteSheetFiles } from "./candidate-files.ts";
import type { GatheredFile } from "./folder-entries.ts";

export type SpriteSheetFolderResult =
  | {
      status: "success";
      fileName: string;
      relativePath: string;
      sffBytes: Uint8Array;
      spriteGroups: SpriteGroup[];
    }
  | { status: "none-found" }
  | { status: "multiple-found"; candidates: GatheredFile[] }
  | { status: "read-error"; fileName: string; message: string }
  | { status: "setup-error"; fileName: string; message: string }
  | { status: "parse-error"; fileName: string; message: string };

/**
 * Reads a File's bytes via `FileReader` rather than `Blob#arrayBuffer()` —
 * the pinned jsdom version's `Blob` implementation is incomplete, the same
 * real-browser/jsdom parity reason every other OpenKakutou app's file
 * input uses `FileReader` instead.
 */
export function readFileAsBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (result instanceof ArrayBuffer) {
        resolve(new Uint8Array(result));
      } else {
        reject(new Error("FileReader did not return an ArrayBuffer"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("failed to read file"));
    };
    reader.readAsArrayBuffer(file);
  });
}

export interface SpriteSheetFolderInputOptions {
  /** Reads a File's bytes. Defaults to `readFileAsBytes`; injectable for testing. */
  readFileBytes?: (file: File) => Promise<Uint8Array>;
  /** Loads a sprite sheet via the WASM bridge. Defaults to the real bridge; injectable for testing. */
  loadSpriteSheet?: (
    sffBytes: Uint8Array,
    options?: WasmBridgeOptions,
  ) => Promise<SpriteSheetResult>;
  /** Forwarded to the default loadSpriteSheet; ignored if loadSpriteSheet is overridden. */
  bridgeOptions?: WasmBridgeOptions;
}

/**
 * Filters `files` (the same folder listing already gathered for the
 * lifebar file) down to `.sff` candidates: none found leaves the sprite
 * sheet unresolved (not an error — the lifebar itself still loaded fine),
 * several found also leaves it unresolved rather than adding a second
 * selection prompt (see the ADR above), and exactly one auto-loads.
 */
export async function loadSpriteSheetFromFolderFiles(
  files: readonly GatheredFile[],
  options: SpriteSheetFolderInputOptions = {},
): Promise<SpriteSheetFolderResult> {
  const candidates = findCandidateSpriteSheetFiles(files);
  if (candidates.length === 0) {
    return { status: "none-found" };
  }
  if (candidates.length > 1) {
    return { status: "multiple-found", candidates };
  }

  const readFileBytes = options.readFileBytes ?? readFileAsBytes;
  const loadSpriteSheet = options.loadSpriteSheet ?? defaultLoadSpriteSheet;
  const entry = candidates[0];
  const fileName = entry.file.name;

  let sffBytes: Uint8Array;
  try {
    sffBytes = await readFileBytes(entry.file);
  } catch (err) {
    return {
      status: "read-error",
      fileName,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  let result: SpriteSheetResult;
  try {
    result = await loadSpriteSheet(sffBytes, options.bridgeOptions);
  } catch (err) {
    return {
      status: "setup-error",
      fileName,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  if (!result.ok) {
    return { status: "parse-error", fileName, message: result.error };
  }
  return {
    status: "success",
    fileName,
    relativePath: entry.relativePath,
    sffBytes,
    spriteGroups: result.spriteGroups,
  };
}
