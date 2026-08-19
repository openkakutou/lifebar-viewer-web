// Detects which files gathered from a selected folder are plausible
// lifebar `.def`-style files, or sprite sheet `.sff` files (both bundled
// together in the same lifebar pack — see
// .vibe/decisions/003-sprite-sheet-resolved-from-the-same-folder-no-separate-picker.md),
// by extension. Anything else in the folder (fonts, palettes, …) is not a
// candidate for either.
import type { GatheredFile } from "./folder-entries.ts";

export function isCandidateLifebarFile(gathered: GatheredFile): boolean {
  return gathered.file.name.toLowerCase().endsWith(".def");
}

export function findCandidateLifebarFiles(
  files: readonly GatheredFile[],
): GatheredFile[] {
  return files.filter(isCandidateLifebarFile);
}

export function isCandidateSpriteSheetFile(gathered: GatheredFile): boolean {
  return gathered.file.name.toLowerCase().endsWith(".sff");
}

export function findCandidateSpriteSheetFiles(
  files: readonly GatheredFile[],
): GatheredFile[] {
  return files.filter(isCandidateSpriteSheetFile);
}
