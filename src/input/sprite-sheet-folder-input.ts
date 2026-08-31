// Resolves and loads a lifebar's sprite sheet from the exact same folder
// listing already gathered for the lifebar file itself — not a second,
// separate picker — since a lifebar pack bundles the `.def`-style file
// together with the sprite sheet(s) it references. See
// .vibe/decisions/003-sprite-sheet-resolved-from-the-same-folder-no-separate-picker.md.
import type { LifebarDocument } from "../lifebar/document.ts";
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
 * The `.sff` file name a lifebar's own `[Files]` section declares as its
 * sprite sheet (the `sff = ...` entry), or `null` if the document has no
 * such section/entry. A real `.def` file can list the same key more than
 * once (`document.ts`'s ordered, never-collapsed sections) — the last one
 * wins, matching how MUGEN/Ikemen GO itself evaluates repeated keys.
 */
function findDeclaredSpriteSheetFileName(
  document: LifebarDocument,
): string | null {
  const filesSection = document.sections.find(
    (section) => section.name.trim().toLowerCase() === "files",
  );
  if (!filesSection) {
    return null;
  }
  const sffEntries = filesSection.entries.filter(
    (entry) => entry.key.trim().toLowerCase() === "sff",
  );
  if (sffEntries.length === 0) {
    return null;
  }
  return sffEntries[sffEntries.length - 1].value.trim();
}

/**
 * Filters `files` (the same folder listing already gathered for the
 * lifebar file) down to `.sff` candidates: none found leaves the sprite
 * sheet unresolved (not an error — the lifebar itself still loaded fine).
 * Exactly one auto-loads. Several found is disambiguated against
 * `document`'s own declared `[Files]`/`sff` entry — a real lifebar pack can
 * legitimately bundle more than one `.sff` (e.g. a main sheet plus a
 * separate effects sheet declared under its own key, as in the "VHD" pack)
 * — and only left unresolved (no second selection prompt, see the ADR
 * above) if no candidate matches that declared name.
 */
export async function loadSpriteSheetFromFolderFiles(
  files: readonly GatheredFile[],
  document: LifebarDocument | null,
  options: SpriteSheetFolderInputOptions = {},
): Promise<SpriteSheetFolderResult> {
  const candidates = findCandidateSpriteSheetFiles(files);
  if (candidates.length === 0) {
    return { status: "none-found" };
  }

  let entry: GatheredFile;
  if (candidates.length === 1) {
    entry = candidates[0];
  } else {
    const declaredFileName = document
      ? findDeclaredSpriteSheetFileName(document)
      : null;
    const matched = declaredFileName
      ? candidates.find(
          (candidate) =>
            candidate.file.name.toLowerCase() ===
            declaredFileName.toLowerCase(),
        )
      : undefined;
    if (!matched) {
      return { status: "multiple-found", candidates };
    }
    entry = matched;
  }

  const readFileBytes = options.readFileBytes ?? readFileAsBytes;
  const loadSpriteSheet = options.loadSpriteSheet ?? defaultLoadSpriteSheet;
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
