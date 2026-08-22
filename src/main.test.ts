import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetLifebarDocumentForTests } from "./document/lifebar-document-store.ts";
import { resetSffSpriteSheetForTests } from "./document/sff-sprite-sheet-store.ts";
import { designTokensLoaded, renderApp } from "./main.ts";

function makeFile(name: string, contents = "x"): File {
  return new File([contents], name);
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

describe("renderApp", () => {
  beforeEach(() => {
    document.title = "";
    resetLifebarDocumentForTests();
    resetSffSpriteSheetForTests();
  });

  it("mounts a wuik-app-shell root frame with a toolbar title (including the version) when design tokens are loaded", () => {
    const root = document.createElement("div");

    renderApp(root, "0.1.0", { designTokensLoaded: () => true });

    const shell = root.querySelector("wuik-app-shell");
    expect(shell).not.toBeNull();

    const toolbar = shell?.querySelector('[slot="toolbar"]');
    expect(toolbar?.tagName.toLowerCase()).toBe("wuik-toolbar");
    expect(toolbar?.getAttribute("role")).toBe("banner");
    expect(toolbar?.textContent).toBe("Lifebar Viewer — v0.1.0");

    expect(shell?.querySelector("main")).not.toBeNull();
  });

  it("does not slot anything into the sidebar region", () => {
    const root = document.createElement("div");

    renderApp(root, "0.1.0", { designTokensLoaded: () => true });

    expect(root.querySelector('[slot="sidebar"]')).toBeNull();
  });

  it("sets the document title to the app name and version", () => {
    const root = document.createElement("div");

    renderApp(root, "0.2.3", { designTokensLoaded: () => true });

    expect(document.title).toBe("Lifebar Viewer — v0.2.3");
  });

  it("replaces previous content instead of appending on repeated renders", () => {
    const root = document.createElement("div");

    renderApp(root, "0.1.0", { designTokensLoaded: () => true });
    renderApp(root, "0.2.0", { designTokensLoaded: () => true });

    expect(root.querySelectorAll("wuik-app-shell")).toHaveLength(1);
    expect(root.querySelector('[slot="toolbar"]')?.textContent).toBe(
      "Lifebar Viewer — v0.2.0",
    );
  });

  it("renders without throwing and keeps a valid structure when given an empty version string", () => {
    const root = document.createElement("div");

    expect(() =>
      renderApp(root, "", { designTokensLoaded: () => true }),
    ).not.toThrow();
    expect(root.querySelector('[slot="toolbar"]')?.textContent).toBe(
      "Lifebar Viewer — v",
    );
  });

  it("shows a visible error message instead of a blank page when the design tokens stylesheet fails to load", () => {
    const root = document.createElement("div");

    renderApp(root, "0.1.0", { designTokensLoaded: () => false });

    expect(root.querySelector("wuik-app-shell")).toBeNull();
    const error = root.querySelector(".design-tokens-error");
    expect(error).not.toBeNull();
    expect(error?.textContent).toMatch(/failed to load/i);
  });

  it("still sets a document title when the design tokens stylesheet fails to load", () => {
    const root = document.createElement("div");

    renderApp(root, "0.1.0", { designTokensLoaded: () => false });

    expect(document.title).toBe("Lifebar Viewer — v0.1.0");
  });

  it("renders the elements panel once a folder with a lifebar file is dropped", async () => {
    const root = document.createElement("div");
    renderApp(root, "0.1.0", { designTokensLoaded: () => true });

    const dropZone = root.querySelector(".lifebar-folder-input__dropzone");
    if (!dropZone) throw new Error("dropzone not found");
    dispatchDrop(dropZone, [
      fakeFileEntry(
        "/pack/fight.def",
        makeFile("fight.def", "[P1 Life Bar]\npos = 5, 17\n"),
      ),
    ]);

    await vi.waitFor(() => {
      expect(root.querySelector(".elements-panel__item")).not.toBeNull();
    });

    expect(root.querySelectorAll(".elements-panel__item")).toHaveLength(1);
    // No .sff candidate was in the dropped folder, so the preview stays in
    // the "waiting for a sheet" state rather than an error one.
    expect(
      root.querySelector(".elements-panel__waiting-message"),
    ).not.toBeNull();
  });

  it("renders no elements panel before any lifebar folder has loaded", () => {
    const root = document.createElement("div");
    renderApp(root, "0.1.0", { designTokensLoaded: () => true });

    expect(root.querySelector(".elements-panel")).toBeNull();
  });
});

describe("designTokensLoaded", () => {
  it("returns true when the probe token resolves to a real value on the given element", () => {
    const el = document.createElement("div");
    el.style.setProperty("--wuik-color-bg", "#ffffff");

    expect(designTokensLoaded(el)).toBe(true);
  });

  it("returns false when the probe token was never declared on the given element", () => {
    const el = document.createElement("div");

    expect(designTokensLoaded(el)).toBe(false);
  });

  it("returns false when the probe token is set but whitespace-only", () => {
    const el = document.createElement("div");
    el.style.setProperty("--wuik-color-bg", "   ");

    expect(designTokensLoaded(el)).toBe(false);
  });
});
