import { afterEach, describe, expect, it, vi } from "vitest";
import type { LifebarDocument } from "../lifebar/document.ts";
import type { SpritePixelResult } from "../wasm/bridge.ts";
import type { SpriteGroup } from "../wasm/types.ts";
import {
  PREVIEW_CANVAS_HEIGHT,
  PREVIEW_CANVAS_WIDTH,
} from "./element-layout.ts";
import { renderElementsPanel } from "./elements-panel.ts";

function doc(sections: LifebarDocument["sections"]): LifebarDocument {
  return { sections };
}

function spriteGroups(): SpriteGroup[] {
  return [
    {
      index: 9000,
      sprites: [
        {
          group: 9000,
          image: 0,
          width: 50,
          height: 20,
          axisX: 0,
          axisY: 0,
          palette: 0,
        },
      ],
    },
  ];
}

function items(root: HTMLElement): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll(".elements-panel__item"));
}

function overlays(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll(".elements-panel__overlay"));
}

// A fake, non-null 2D context: jsdom's real getContext("2d") always returns
// null, so a test that needs to observe draw calls injects this instead of
// relying on a real canvas -- the same seam sprite-browser.ts's own
// drawPixels injection point provides in the sibling `lifebar-editor` repo.
const fakeCtx = {} as CanvasRenderingContext2D;

describe("renderElementsPanel", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders nothing when no lifebar document is loaded", () => {
    const root = document.createElement("div");
    renderElementsPanel(root, null, null, null);
    expect(root.children.length).toBe(0);
  });

  it("shows an empty-state message for a lifebar with zero recognized elements", () => {
    const root = document.createElement("div");
    renderElementsPanel(root, doc([]), null, null);
    expect(root.textContent).toMatch(/no recognized elements/i);
    expect(root.querySelector(".elements-panel__overlay")).toBeNull();
  });

  it("lists every recognized element", () => {
    const root = document.createElement("div");
    renderElementsPanel(
      root,
      doc([
        { name: "P1 Life Bar", entries: [], line: 1 },
        { name: "P1 Power Bar", entries: [], line: 2 },
      ]),
      null,
      null,
    );
    const names = items(root).map((b) => b.textContent);
    expect(names).toEqual(["P1 Life Bar", "P1 Power Bar"]);
  });

  it("sizes the preview to the fixed canvas resolution", () => {
    const root = document.createElement("div");
    renderElementsPanel(
      root,
      doc([{ name: "P1 Life Bar", entries: [], line: 1 }]),
      null,
      null,
    );
    const canvas = root.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.width).toBe(PREVIEW_CANVAS_WIDTH);
    expect(canvas.height).toBe(PREVIEW_CANVAS_HEIGHT);
  });

  it("positions each element's overlay at its computed box", () => {
    const root = document.createElement("div");
    renderElementsPanel(
      root,
      doc([
        {
          name: "P1 Life Bar",
          entries: [
            { key: "pos", value: "10, 20", line: 1 },
            { key: "0.spr", value: "9000, 0", line: 2 },
          ],
          line: 0,
        },
      ]),
      spriteGroups(),
      new Uint8Array(),
      // This test only cares about overlay positioning, not pixel decoding
      // -- stubbed so it never touches the real WASM bridge or jsdom's own
      // unimplemented canvas 2D context.
      { resolveSpritePixels: async () => [], getContext2d: () => null },
    );
    const overlay = overlays(root)[0];
    expect(overlay.style.left).toBe("10px");
    expect(overlay.style.top).toBe("20px");
    expect(overlay.style.width).toBe("50px");
    expect(overlay.style.height).toBe("20px");
  });

  it("selecting an element's list item highlights its overlay", () => {
    const root = document.createElement("div");
    renderElementsPanel(
      root,
      doc([
        { name: "P1 Life Bar", entries: [], line: 1 },
        { name: "P1 Power Bar", entries: [], line: 2 },
      ]),
      null,
      null,
    );
    items(root)[1].click();

    expect(overlays(root)[0].classList.contains("is-selected")).toBe(false);
    expect(overlays(root)[1].classList.contains("is-selected")).toBe(true);
    expect(items(root)[1].getAttribute("aria-pressed")).toBe("true");
  });

  it("flags an element with no sprite layers as 'no sprite by design', not an error", () => {
    const root = document.createElement("div");
    renderElementsPanel(
      root,
      doc([{ name: "P1 Name", entries: [], line: 1 }]),
      spriteGroups(),
      new Uint8Array(),
    );
    const overlay = overlays(root)[0];
    expect(
      overlay.classList.contains("elements-panel__overlay--no-sprite"),
    ).toBe(true);
    expect(
      overlay.classList.contains("elements-panel__overlay--unresolved"),
    ).toBe(false);
    expect(overlay.title).toMatch(/no sprite/i);
  });

  it("flags an element with an unresolvable sprite reference as an error, naming the bad reference", () => {
    const root = document.createElement("div");
    renderElementsPanel(
      root,
      doc([
        {
          name: "P1 Life Bar",
          entries: [{ key: "0.spr", value: "9000, 99", line: 1 }],
          line: 0,
        },
      ]),
      spriteGroups(),
      new Uint8Array(),
    );
    const overlay = overlays(root)[0];
    expect(
      overlay.classList.contains("elements-panel__overlay--unresolved"),
    ).toBe(true);
    expect(overlay.title).toContain("9000, 99");
  });

  it("shows a single waiting message, not per-layer errors, when no sheet is loaded yet", () => {
    const root = document.createElement("div");
    renderElementsPanel(
      root,
      doc([
        {
          name: "P1 Life Bar",
          entries: [{ key: "0.spr", value: "9000, 0", line: 1 }],
          line: 0,
        },
        {
          name: "P1 Power Bar",
          entries: [{ key: "0.spr", value: "9000, 0", line: 1 }],
          line: 0,
        },
      ]),
      null,
      null,
    );
    expect(
      root.querySelectorAll(".elements-panel__waiting-message"),
    ).toHaveLength(1);
    expect(
      root.querySelectorAll(".elements-panel__overlay--unresolved"),
    ).toHaveLength(0);
    for (const overlay of overlays(root)) {
      expect(
        overlay.classList.contains("elements-panel__overlay--waiting"),
      ).toBe(true);
    }
  });

  it("keeps every element selectable while no sheet is loaded yet", () => {
    const root = document.createElement("div");
    renderElementsPanel(
      root,
      doc([
        {
          name: "P1 Life Bar",
          entries: [{ key: "0.spr", value: "9000, 0", line: 1 }],
          line: 0,
        },
      ]),
      null,
      null,
    );
    items(root)[0].click();
    expect(overlays(root)[0].classList.contains("is-selected")).toBe(true);
  });

  it("batch-decodes and draws every resolved layer's pixels once", async () => {
    const resolveSpritePixels = vi.fn(
      async (): Promise<SpritePixelResult[]> => [
        {
          ok: true,
          pixels: new Uint8Array([1, 2, 3, 4]),
          width: 50,
          height: 20,
        },
      ],
    );
    const drawSprite = vi.fn();
    const root = document.createElement("div");

    renderElementsPanel(
      root,
      doc([
        {
          name: "P1 Life Bar",
          entries: [
            { key: "pos", value: "10, 20", line: 1 },
            { key: "0.spr", value: "9000, 0", line: 2 },
          ],
          line: 0,
        },
      ]),
      spriteGroups(),
      new Uint8Array([9, 9, 9]),
      { resolveSpritePixels, drawSprite, getContext2d: () => fakeCtx },
    );

    expect(resolveSpritePixels).toHaveBeenCalledTimes(1);
    expect(resolveSpritePixels).toHaveBeenCalledWith(
      new Uint8Array([9, 9, 9]),
      [[9000, 0]],
      null,
      undefined,
    );

    await vi.waitFor(() => {
      expect(drawSprite).toHaveBeenCalledTimes(1);
    });
    expect(drawSprite).toHaveBeenCalledWith(
      fakeCtx,
      new Uint8Array([1, 2, 3, 4]),
      10,
      20,
      50,
      20,
    );
  });

  it("does not attempt to decode pixels for an unresolved or no-sheet layer", () => {
    const resolveSpritePixels = vi.fn(
      async (): Promise<SpritePixelResult[]> => [],
    );
    const root = document.createElement("div");

    renderElementsPanel(
      root,
      doc([
        {
          name: "P1 Life Bar",
          entries: [{ key: "0.spr", value: "9000, 99", line: 1 }],
          line: 0,
        },
      ]),
      spriteGroups(),
      new Uint8Array(),
      { resolveSpritePixels },
    );

    expect(resolveSpritePixels).not.toHaveBeenCalled();
  });

  it("skips a batch decode call entirely when no sheet is loaded", () => {
    const resolveSpritePixels = vi.fn();
    const root = document.createElement("div");

    renderElementsPanel(
      root,
      doc([
        {
          name: "P1 Life Bar",
          entries: [{ key: "0.spr", value: "9000, 0", line: 1 }],
          line: 0,
        },
      ]),
      null,
      null,
      { resolveSpritePixels },
    );

    expect(resolveSpritePixels).not.toHaveBeenCalled();
  });
});
