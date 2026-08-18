import { describe, expect, it } from "vitest";
import { findCandidateLifebarFiles } from "./candidate-files.ts";
import type { GatheredFile } from "./folder-entries.ts";

function entry(relativePath: string): GatheredFile {
  return {
    file: new File(["x"], relativePath.split("/").pop() ?? relativePath),
    relativePath,
  };
}

describe("findCandidateLifebarFiles", () => {
  it("keeps only files with a .def extension", () => {
    const files = [
      entry("pack/fight.def"),
      entry("pack/font.fnt"),
      entry("pack/p1.sff"),
    ];

    expect(findCandidateLifebarFiles(files)).toEqual([files[0]]);
  });

  it("matches the extension case-insensitively", () => {
    const files = [entry("pack/FIGHT.DEF")];

    expect(findCandidateLifebarFiles(files)).toEqual(files);
  });

  it("finds multiple candidates across nested folders", () => {
    const files = [
      entry("pack/fight.def"),
      entry("pack/alt/fight2.def"),
      entry("pack/font.fnt"),
    ];

    expect(findCandidateLifebarFiles(files)).toEqual([files[0], files[1]]);
  });

  it("returns an empty list when no file matches", () => {
    expect(findCandidateLifebarFiles([entry("pack/font.fnt")])).toEqual([]);
  });

  it("returns an empty list for an empty input", () => {
    expect(findCandidateLifebarFiles([])).toEqual([]);
  });
});
