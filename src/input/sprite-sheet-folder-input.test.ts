import { describe, expect, it } from "vitest";
import type { LifebarDocument } from "../lifebar/document.ts";
import type { GatheredFile } from "./folder-entries.ts";
import { loadSpriteSheetFromFolderFiles } from "./sprite-sheet-folder-input.ts";

function entry(relativePath: string, contents = "x"): GatheredFile {
  return {
    file: new File([contents], relativePath.split("/").pop() ?? relativePath),
    relativePath,
  };
}

/** A `[Files]` section declaring `sff = <fileName>`, the way a real lifebar `.def` does. */
function documentDeclaringSff(fileName: string): LifebarDocument {
  return {
    sections: [
      {
        name: "Files",
        line: 1,
        entries: [{ key: "sff", value: fileName, line: 2 }],
      },
    ],
  };
}

describe("loadSpriteSheetFromFolderFiles", () => {
  it("reports none-found when the folder has no .sff candidate", async () => {
    const result = await loadSpriteSheetFromFolderFiles(
      [entry("pack/fight.def")],
      null,
      {
        readFileBytes: async () => {
          throw new Error("should not be called");
        },
      },
    );

    expect(result).toEqual({ status: "none-found" });
  });

  it("reports multiple-found without reading anything when several .sff candidates exist and none is declared", async () => {
    const first = entry("pack/p1.sff");
    const second = entry("pack/p2.sff");

    const result = await loadSpriteSheetFromFolderFiles([first, second], null, {
      readFileBytes: async () => {
        throw new Error("should not be called");
      },
    });

    expect(result).toEqual({
      status: "multiple-found",
      candidates: [first, second],
    });
  });

  it("reports multiple-found when the declared sff file matches none of the candidates", async () => {
    const first = entry("pack/p1.sff");
    const second = entry("pack/p2.sff");

    const result = await loadSpriteSheetFromFolderFiles(
      [first, second],
      documentDeclaringSff("other.sff"),
      {
        readFileBytes: async () => {
          throw new Error("should not be called");
        },
      },
    );

    expect(result).toEqual({
      status: "multiple-found",
      candidates: [first, second],
    });
  });

  it("auto-resolves the candidate matching the lifebar's declared [Files] sff entry when several .sff candidates exist — the real 'VHD' lifebar pack shape (fightHD.sff + fightfx.sff)", async () => {
    const main = entry("pack/fightHD.sff");
    const effects = entry("pack/fightfx.sff");
    const spriteGroups = [{ index: 0, sprites: [] }];

    const result = await loadSpriteSheetFromFolderFiles(
      [effects, main],
      documentDeclaringSff("fightHD.sff"),
      {
        readFileBytes: async (file) => {
          expect(file.name).toBe("fightHD.sff");
          return new Uint8Array([1, 2, 3]);
        },
        loadSpriteSheet: async () => ({ ok: true, spriteGroups }),
      },
    );

    expect(result).toEqual({
      status: "success",
      fileName: "fightHD.sff",
      relativePath: "pack/fightHD.sff",
      sffBytes: new Uint8Array([1, 2, 3]),
      spriteGroups,
    });
  });

  it("matches the declared sff file name case-insensitively", async () => {
    const main = entry("pack/fightHD.sff");
    const effects = entry("pack/fightfx.sff");
    const spriteGroups = [{ index: 0, sprites: [] }];

    const result = await loadSpriteSheetFromFolderFiles(
      [effects, main],
      documentDeclaringSff("FIGHTHD.SFF"),
      {
        readFileBytes: async () => new Uint8Array([1, 2, 3]),
        loadSpriteSheet: async () => ({ ok: true, spriteGroups }),
      },
    );

    expect(result.status).toBe("success");
  });

  it("reads and loads the sole candidate on success", async () => {
    const sheet = entry("pack/p1.sff");
    const spriteGroups = [{ index: 0, sprites: [] }];

    const result = await loadSpriteSheetFromFolderFiles([sheet], null, {
      readFileBytes: async () => new Uint8Array([1, 2, 3]),
      loadSpriteSheet: async () => ({ ok: true, spriteGroups }),
    });

    expect(result).toEqual({
      status: "success",
      fileName: "p1.sff",
      relativePath: "pack/p1.sff",
      sffBytes: new Uint8Array([1, 2, 3]),
      spriteGroups,
    });
  });

  it("reports a read-error naming the file when reading its bytes fails", async () => {
    const result = await loadSpriteSheetFromFolderFiles(
      [entry("pack/p1.sff")],
      null,
      {
        readFileBytes: async () => {
          throw new Error("disk gremlin");
        },
      },
    );

    expect(result).toEqual({
      status: "read-error",
      fileName: "p1.sff",
      message: "disk gremlin",
    });
  });

  it("reports a setup-error when the WASM module itself fails to start", async () => {
    const result = await loadSpriteSheetFromFolderFiles(
      [entry("pack/p1.sff")],
      null,
      {
        readFileBytes: async () => new Uint8Array([1]),
        loadSpriteSheet: async () => {
          throw new Error("failed to fetch ./wasm/sff.wasm: 404 Not Found");
        },
      },
    );

    expect(result).toEqual({
      status: "setup-error",
      fileName: "p1.sff",
      message: "failed to fetch ./wasm/sff.wasm: 404 Not Found",
    });
  });

  it("reports a parse-error when the WASM module reports a malformed sheet", async () => {
    const result = await loadSpriteSheetFromFolderFiles(
      [entry("pack/p1.sff")],
      null,
      {
        readFileBytes: async () => new Uint8Array([1]),
        loadSpriteSheet: async () => ({
          ok: false,
          error: "sff: not a .sff file: unexpected signature",
        }),
      },
    );

    expect(result).toEqual({
      status: "parse-error",
      fileName: "p1.sff",
      message: "sff: not a .sff file: unexpected signature",
    });
  });
});
