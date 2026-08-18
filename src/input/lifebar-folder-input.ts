// Combines candidate detection (candidate-files.ts) with reading and
// parsing (../lifebar/parse.ts) into the folder-input pipeline: resolve
// which candidate file to use (auto-pick if there's exactly one, otherwise
// ask), then read and parse it. Mirrors `lifebar-editor`'s own single-file
// `lifebar-file-input.ts` shape, extended with the candidate-resolution
// step this app's folder-only input needs.
import type { LifebarDocument } from "../lifebar/document.ts";
import { parseLifebar } from "../lifebar/parse.ts";
import { findCandidateLifebarFiles } from "./candidate-files.ts";
import type { GatheredFile } from "./folder-entries.ts";

export type CandidateResolution =
  | { status: "no-files" }
  | { status: "no-candidate" }
  | { status: "success"; entry: GatheredFile }
  | { status: "needs-selection"; candidates: GatheredFile[] };

/**
 * Decides what to do with the files gathered from a folder selection: none
 * gathered at all, none matching the `.def` heuristic, exactly one match
 * (auto-load), or several (the caller must ask the user to pick one).
 */
export function resolveCandidates(
  files: readonly GatheredFile[],
): CandidateResolution {
  if (files.length === 0) {
    return { status: "no-files" };
  }
  const candidates = findCandidateLifebarFiles(files);
  if (candidates.length === 0) {
    return { status: "no-candidate" };
  }
  if (candidates.length === 1) {
    return { status: "success", entry: candidates[0] };
  }
  return { status: "needs-selection", candidates };
}

export type LifebarFolderInputResult =
  | {
      status: "success";
      fileName: string;
      relativePath: string;
      document: LifebarDocument;
      warnings: string[];
    }
  | { status: "no-files" }
  | { status: "no-candidate" }
  | { status: "needs-selection"; candidates: GatheredFile[] }
  | { status: "read-error"; fileName: string; message: string }
  | { status: "parse-error"; fileName: string; message: string };

/**
 * Reads a File's text via `FileReader` rather than `Blob#text()` — the
 * pinned jsdom version's `Blob` implementation is incomplete, the same
 * real-browser/jsdom parity reason every other OpenKakutou app's file
 * input uses `FileReader` instead.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("FileReader did not return text"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("failed to read file"));
    };
    reader.readAsText(file);
  });
}

export interface LifebarFolderInputOptions {
  /** Reads a File's text content. Defaults to `readFileAsText`; injectable for testing. */
  readFileText?: (file: File) => Promise<string>;
}

/** Reads and parses a single already-chosen candidate entry. */
export async function loadLifebarFromChosenEntry(
  entry: GatheredFile,
  options: LifebarFolderInputOptions = {},
): Promise<LifebarFolderInputResult> {
  const readFileText = options.readFileText ?? readFileAsText;
  const fileName = entry.file.name;

  let text: string;
  try {
    text = await readFileText(entry.file);
  } catch (err) {
    return {
      status: "read-error",
      fileName,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const parsed = parseLifebar(text);
  if (parsed.status === "error") {
    return { status: "parse-error", fileName, message: parsed.message };
  }
  return {
    status: "success",
    fileName,
    relativePath: entry.relativePath,
    document: parsed.document,
    warnings: parsed.warnings,
  };
}

/**
 * Resolves which candidate to use among the files gathered from a folder
 * selection, then — only once a single candidate is settled — reads and
 * parses it. `no-files`/`no-candidate`/`needs-selection` short-circuit
 * without reading anything.
 */
export async function loadLifebarFromFolderFiles(
  files: readonly GatheredFile[],
  options: LifebarFolderInputOptions = {},
): Promise<LifebarFolderInputResult> {
  const resolution = resolveCandidates(files);
  if (resolution.status !== "success") {
    return resolution;
  }
  return loadLifebarFromChosenEntry(resolution.entry, options);
}
