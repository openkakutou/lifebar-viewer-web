import { afterEach, describe, expect, it, vi } from "vitest";
import { renderLifebarFolderInput } from "./lifebar-folder-input-view.ts";

function makeFile(name: string, contents = "x"): File {
  return new File([contents], name);
}

function withRelativePath(file: File, relativePath: string): File {
  Object.defineProperty(file, "webkitRelativePath", { value: relativePath });
  return file;
}

function fakeFileEntry(fullPath: string, file: File) {
  return {
    isFile: true,
    isDirectory: false,
    fullPath,
    file: (success: (file: File) => void) => success(file),
  };
}

/** jsdom's DragEvent does not implement DataTransfer, so it is stubbed directly. */
function dispatchDrop(target: Element, entries: unknown[]): void {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      items: entries.map((entry) => ({ webkitGetAsEntry: () => entry })),
    },
  });
  target.dispatchEvent(event);
}

function picker(root: HTMLElement): HTMLInputElement {
  return root.querySelector('input[type="file"]') as HTMLInputElement;
}

function status(root: HTMLElement): HTMLElement {
  return root.querySelector('[role="status"]') as HTMLElement;
}

function dropZone(root: HTMLElement): HTMLElement {
  return root.querySelector(".lifebar-folder-input__dropzone") as HTMLElement;
}

async function selectViaPicker(
  root: HTMLElement,
  files: File[],
): Promise<void> {
  const input = picker(root);
  Object.defineProperty(input, "files", { value: files, configurable: true });
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await vi.waitFor(() => {
    if (status(root).textContent === "Reading…")
      throw new Error("still loading");
  });
}

describe("renderLifebarFolderInput", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows a folder-specific prompt in the idle state, not a generic file prompt", () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, { onLoaded: vi.fn() });

    expect(root.textContent?.toLowerCase()).toContain("folder");
    expect(picker(root).getAttribute("webkitdirectory")).not.toBeNull();
  });

  it("auto-loads and reports success when exactly one candidate is picked", async () => {
    const onLoaded = vi.fn();
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded,
      fileOptions: { readFileText: async () => "[Files]\nfont1 = font.def" },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
    ]);

    expect(onLoaded).toHaveBeenCalledWith({
      document: {
        sections: [
          {
            name: "Files",
            entries: [{ key: "font1", value: "font.def", line: 2 }],
            line: 1,
          },
        ],
      },
      fileName: "fight.def",
      warnings: [],
    });
    expect(status(root).textContent).toContain("fight.def");
    expect(status(root).textContent).toContain("1 section");
  });

  it("mentions skipped sections in the success message when there are warnings", async () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded: vi.fn(),
      fileOptions: {
        readFileText: async () => "[Debug Overlay]\nenabled = 1",
      },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
    ]);

    expect(status(root).textContent).toContain("1 unrecognized section");
  });

  it("shows a distinct error when the selected folder is empty", async () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, { onLoaded: vi.fn() });

    await selectViaPicker(root, []);

    expect(status(root).textContent?.toLowerCase()).toContain("empty");
  });

  it("shows a distinct error when the folder has no candidate lifebar file", async () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, { onLoaded: vi.fn() });

    await selectViaPicker(root, [
      withRelativePath(makeFile("font.fnt"), "pack/font.fnt"),
    ]);

    expect(status(root).textContent?.toLowerCase()).toContain("no");
    expect(status(root).textContent?.toLowerCase()).toContain(".def");
  });

  it("prompts with a keyboard-navigable choice when multiple candidates exist, and does not auto-load", async () => {
    const onLoaded = vi.fn();
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded,
      fileOptions: { readFileText: async () => "[Round Time]\nvalue = 1" },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
      withRelativePath(makeFile("fight2.def"), "pack/alt/fight2.def"),
    ]);

    const options = root.querySelectorAll('input[type="radio"]');
    expect(options).toHaveLength(2);
    expect(root.textContent).toContain("pack/fight.def");
    expect(root.textContent).toContain("pack/alt/fight2.def");
    expect(onLoaded).not.toHaveBeenCalled();

    (options[1] as HTMLInputElement).click();
    root
      .querySelector("button[data-action='confirm-selection']")
      ?.dispatchEvent(new Event("click", { bubbles: true }));
    await vi.waitFor(() => {
      expect(onLoaded).toHaveBeenCalled();
    });

    expect(onLoaded).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "fight2.def" }),
    );
  });

  it("reports a read failure distinctly from a parse failure", async () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded: vi.fn(),
      fileOptions: {
        readFileText: async () => {
          throw new Error("disk gremlin");
        },
      },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
    ]);

    expect(status(root).textContent).toContain("disk gremlin");
    expect(status(root).textContent?.toLowerCase()).toContain("read");
  });

  it("reports a parse failure naming the file", async () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded: vi.fn(),
      fileOptions: { readFileText: async () => "not valid" },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
    ]);

    expect(status(root).textContent?.toLowerCase()).toContain("parse");
    expect(status(root).textContent).toContain("fight.def");
  });

  it("distinguishes a drag-and-drop that yielded nothing from an empty picker selection", async () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, { onLoaded: vi.fn() });

    dispatchDrop(dropZone(root), []);
    await vi.waitFor(() => {
      if (status(root).textContent === "") throw new Error("not yet updated");
    });

    expect(status(root).textContent?.toLowerCase()).toContain("browser");
  });

  it("recursively gathers files from a dropped folder and auto-loads the sole candidate", async () => {
    const onLoaded = vi.fn();
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded,
      fileOptions: { readFileText: async () => "[Files]\nfont1 = font.def" },
    });

    dispatchDrop(dropZone(root), [
      fakeFileEntry("/pack/fight.def", makeFile("fight.def")),
    ]);

    await vi.waitFor(() => {
      expect(onLoaded).toHaveBeenCalled();
    });
    expect(onLoaded).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "fight.def" }),
    );
  });

  it("resolves and reports the sole sprite sheet found in the same folder", async () => {
    const onSpriteSheetResolved = vi.fn();
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded: vi.fn(),
      onSpriteSheetResolved,
      fileOptions: { readFileText: async () => "[Files]\nfont1 = font.def" },
      spriteSheetOptions: {
        readFileBytes: async () => new Uint8Array([1, 2, 3]),
        loadSpriteSheet: async () => ({
          ok: true,
          spriteGroups: [{ index: 0, sprites: [] }],
        }),
      },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
      withRelativePath(makeFile("p1.sff"), "pack/p1.sff"),
    ]);
    await vi.waitFor(() => {
      expect(onSpriteSheetResolved).toHaveBeenCalled();
    });

    expect(onSpriteSheetResolved).toHaveBeenCalledWith({
      status: "success",
      fileName: "p1.sff",
      relativePath: "pack/p1.sff",
      sffBytes: new Uint8Array([1, 2, 3]),
      spriteGroups: [{ index: 0, sprites: [] }],
    });
    expect(status(root).textContent).toContain("p1.sff");
    expect(status(root).textContent).toContain("1 group");
  });

  it("reports no sprite sheet found without treating it as an error", async () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded: vi.fn(),
      fileOptions: { readFileText: async () => "[Files]\nfont1 = font.def" },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
    ]);
    await vi.waitFor(() => {
      expect(status(root).textContent?.toLowerCase()).toContain(
        "no sprite sheet",
      );
    });

    expect(
      status(root).classList.contains("lifebar-folder-input__status--error"),
    ).toBe(false);
  });

  it("reports multiple sprite sheets found without picking one or blocking the lifebar load", async () => {
    const onLoaded = vi.fn();
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded,
      fileOptions: { readFileText: async () => "[Files]\nfont1 = font.def" },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
      withRelativePath(makeFile("p1.sff"), "pack/p1.sff"),
      withRelativePath(makeFile("p2.sff"), "pack/p2.sff"),
    ]);

    expect(onLoaded).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(status(root).textContent?.toLowerCase()).toContain("multiple");
    });
  });

  it("shows a distinct, clearly-flagged error when the sprite sheet fails to parse", async () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded: vi.fn(),
      fileOptions: { readFileText: async () => "[Files]\nfont1 = font.def" },
      spriteSheetOptions: {
        readFileBytes: async () => new Uint8Array([1]),
        loadSpriteSheet: async () => ({
          ok: false,
          error: "sff: not a .sff file: unexpected signature",
        }),
      },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
      withRelativePath(makeFile("p1.sff"), "pack/p1.sff"),
    ]);
    await vi.waitFor(() => {
      expect(status(root).textContent).toContain("p1.sff");
    });

    expect(status(root).textContent?.toLowerCase()).toContain("parse");
    expect(
      status(root).classList.contains("lifebar-folder-input__status--error"),
    ).toBe(true);
  });

  it("always offers a way to choose a different folder once a result is shown", async () => {
    const root = document.createElement("div");
    renderLifebarFolderInput(root, {
      onLoaded: vi.fn(),
      fileOptions: { readFileText: async () => "[Files]\nfont1 = font.def" },
    });

    await selectViaPicker(root, [
      withRelativePath(makeFile("fight.def"), "pack/fight.def"),
    ]);

    const resetButton = root.querySelector(
      "button[data-action='reset']",
    ) as HTMLButtonElement;
    expect(resetButton).not.toBeNull();

    resetButton.click();

    expect(status(root).textContent).toBe("");
    expect(root.querySelector('input[type="file"]')).not.toBeNull();
  });
});
