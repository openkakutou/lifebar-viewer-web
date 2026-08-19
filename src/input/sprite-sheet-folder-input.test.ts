import { describe, expect, it } from "vitest";
import type { GatheredFile } from "./folder-entries.ts";
import { loadSpriteSheetFromFolderFiles } from "./sprite-sheet-folder-input.ts";

function entry(relativePath: string, contents = "x"): GatheredFile {
  return {
    file: new File([contents], relativePath.split("/").pop() ?? relativePath),
    relativePath,
  };
}

describe("loadSpriteSheetFromFolderFiles", () => {
  it("reports none-found when the folder has no .sff candidate", async () => {
    const result = await loadSpriteSheetFromFolderFiles(
      [entry("pack/fight.def")],
      {
        readFileBytes: async () => {
          throw new Error("should not be called");
        },
      },
    );

    expect(result).toEqual({ status: "none-found" });
  });

  it("reports multiple-found without reading anything when several .sff candidates exist", async () => {
    const first = entry("pack/p1.sff");
    const second = entry("pack/p2.sff");

    const result = await loadSpriteSheetFromFolderFiles([first, second], {
      readFileBytes: async () => {
        throw new Error("should not be called");
      },
    });

    expect(result).toEqual({
      status: "multiple-found",
      candidates: [first, second],
    });
  });

  it("reads and loads the sole candidate on success", async () => {
    const sheet = entry("pack/p1.sff");
    const spriteGroups = [{ index: 0, sprites: [] }];

    const result = await loadSpriteSheetFromFolderFiles([sheet], {
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
