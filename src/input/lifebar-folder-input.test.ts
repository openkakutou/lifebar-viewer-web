import { describe, expect, it } from "vitest";
import type { GatheredFile } from "./folder-entries.ts";
import {
  loadLifebarFromChosenEntry,
  loadLifebarFromFolderFiles,
  resolveCandidates,
} from "./lifebar-folder-input.ts";

function entry(relativePath: string, contents = "x"): GatheredFile {
  return {
    file: new File([contents], relativePath.split("/").pop() ?? relativePath),
    relativePath,
  };
}

describe("resolveCandidates", () => {
  it("reports no-files when the folder yielded nothing at all", () => {
    expect(resolveCandidates([])).toEqual({ status: "no-files" });
  });

  it("reports no-candidate when files exist but none is a .def file", () => {
    expect(resolveCandidates([entry("pack/font.fnt")])).toEqual({
      status: "no-candidate",
    });
  });

  it("resolves automatically when exactly one candidate is found", () => {
    const fightDef = entry("pack/fight.def");
    expect(resolveCandidates([fightDef, entry("pack/font.fnt")])).toEqual({
      status: "success",
      entry: fightDef,
    });
  });

  it("asks for a selection when multiple candidates are found", () => {
    const first = entry("pack/fight.def");
    const second = entry("pack/alt/fight2.def");
    expect(resolveCandidates([first, second])).toEqual({
      status: "needs-selection",
      candidates: [first, second],
    });
  });
});

describe("loadLifebarFromFolderFiles", () => {
  it("reads and parses the sole candidate on success", async () => {
    const fightDef = entry("pack/fight.def", "[Files]\nfont1 = font.def");

    const result = await loadLifebarFromFolderFiles([fightDef], {
      readFileText: async () => "[Files]\nfont1 = font.def",
    });

    expect(result).toEqual({
      status: "success",
      fileName: "fight.def",
      relativePath: "pack/fight.def",
      document: {
        sections: [
          {
            name: "Files",
            entries: [{ key: "font1", value: "font.def", line: 2 }],
            line: 1,
          },
        ],
      },
      warnings: [],
    });
  });

  it("passes through no-files without attempting to read anything", async () => {
    const result = await loadLifebarFromFolderFiles([], {
      readFileText: async () => {
        throw new Error("should not be called");
      },
    });

    expect(result).toEqual({ status: "no-files" });
  });

  it("passes through no-candidate without attempting to read anything", async () => {
    const result = await loadLifebarFromFolderFiles([entry("pack/font.fnt")], {
      readFileText: async () => {
        throw new Error("should not be called");
      },
    });

    expect(result).toEqual({ status: "no-candidate" });
  });

  it("passes through needs-selection without reading any candidate yet", async () => {
    const first = entry("pack/fight.def");
    const second = entry("pack/alt/fight2.def");

    const result = await loadLifebarFromFolderFiles([first, second], {
      readFileText: async () => {
        throw new Error("should not be called");
      },
    });

    expect(result).toEqual({
      status: "needs-selection",
      candidates: [first, second],
    });
  });

  it("reports a read-error naming the file that failed to read", async () => {
    const fightDef = entry("pack/fight.def");

    const result = await loadLifebarFromFolderFiles([fightDef], {
      readFileText: async () => {
        throw new Error("disk gremlin");
      },
    });

    expect(result).toEqual({
      status: "read-error",
      fileName: "fight.def",
      message: "disk gremlin",
    });
  });

  it("reports a parse-error naming the file that failed to parse", async () => {
    const fightDef = entry("pack/fight.def");

    const result = await loadLifebarFromFolderFiles([fightDef], {
      readFileText: async () => "not a valid line",
    });

    expect(result).toEqual({
      status: "parse-error",
      fileName: "fight.def",
      message:
        'line 1: expected a "[Section Name]" header or a "key = value" pair, found "not a valid line".',
    });
  });
});

describe("loadLifebarFromChosenEntry", () => {
  it("reads and parses a specific entry directly, e.g. after a multi-candidate pick", async () => {
    const chosen = entry("pack/alt/fight2.def");

    const result = await loadLifebarFromChosenEntry(chosen, {
      readFileText: async () => "[Round Time]\nvalue = 99",
    });

    expect(result).toEqual({
      status: "success",
      fileName: "fight2.def",
      relativePath: "pack/alt/fight2.def",
      document: {
        sections: [
          {
            name: "Round Time",
            entries: [{ key: "value", value: "99", line: 2 }],
            line: 1,
          },
        ],
      },
      warnings: [],
    });
  });
});
