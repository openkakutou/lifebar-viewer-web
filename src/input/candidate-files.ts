// Detects which files gathered from a selected folder are plausible
// lifebar `.def`-style files, by extension. Anything else in the folder
// (fonts, sprite sheets, palettes, …) is not a candidate.
import type { GatheredFile } from "./folder-entries.ts";

export function isCandidateLifebarFile(gathered: GatheredFile): boolean {
  return gathered.file.name.toLowerCase().endsWith(".def");
}

export function findCandidateLifebarFiles(
  files: readonly GatheredFile[],
): GatheredFile[] {
  return files.filter(isCandidateLifebarFile);
}
