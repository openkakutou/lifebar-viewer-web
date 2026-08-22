// The elements panel + preview renderer (backlog item 004): lists every
// recognized element of a loaded lifebar and draws a live visual composite
// of them on a fixed-size canvas, using sprites resolved from an
// auto-loaded `.sff` sheet. Selecting an element in the list highlights its
// region via a DOM overlay -- see
// .vibe/decisions/004-element-layout-convention-and-placeholder-states.md
// for why highlighting is an overlay rather than a canvas redraw, and why
// an unresolved sprite reference, an element with no sprite layers at all,
// and "no sheet loaded yet" are three visually distinct states rather than
// one generic placeholder.
import type { LifebarDocument } from "../lifebar/document.ts";
import {
  type SpritePixelResult,
  type WasmBridgeOptions,
  resolveSpritePixels as defaultResolveSpritePixels,
} from "../wasm/bridge.ts";
import type { SpriteGroup } from "../wasm/types.ts";
import {
  PREVIEW_CANVAS_HEIGHT,
  PREVIEW_CANVAS_WIDTH,
  computeElementBox,
  computeElementLayout,
  layerPosition,
} from "./element-layout.ts";

/**
 * Draws one decoded sprite's pixels onto ctx at (x, y). The real,
 * browser-only implementation -- tests inject a stub instead, since jsdom
 * does not implement `HTMLCanvasElement.getContext("2d")` at all.
 */
export function defaultDrawSprite(
  ctx: CanvasRenderingContext2D,
  pixels: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.putImageData(
    new ImageData(new Uint8ClampedArray(pixels), width, height),
    x,
    y,
  );
}

/** Which element (by index into the document's sections) is currently selected. */
export interface ElementSelection {
  index: number | null;
}

export interface ElementsPanelOptions {
  /** Persists the current selection across re-renders (e.g. a sprite sheet finishing loading while an element is selected). A fresh, empty selection is used if omitted. */
  selection?: ElementSelection;
  /** Batch-decodes sprite pixels. Defaults to the real WASM bridge; injectable for testing. */
  resolveSpritePixels?: (
    sffBytes: Uint8Array,
    requests: readonly (readonly [number, number])[],
    overridePaletteBytes: Uint8Array | null,
    options?: WasmBridgeOptions,
  ) => Promise<SpritePixelResult[]>;
  /** Forwarded to the default resolveSpritePixels; ignored if resolveSpritePixels is overridden. */
  bridgeOptions?: WasmBridgeOptions;
  /** Gets the preview canvas's 2D context. Defaults to the real `canvas.getContext("2d")`; injectable for testing, since jsdom's own always returns null. */
  getContext2d?: (canvas: HTMLCanvasElement) => CanvasRenderingContext2D | null;
  /** Draws one decoded sprite's pixels. Defaults to the real canvas 2D draw; injectable for testing. */
  drawSprite?: (
    ctx: CanvasRenderingContext2D,
    pixels: Uint8Array,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
}

/**
 * Renders the elements panel + preview into `root`, replacing its previous
 * content. `document_ === null` (nothing loaded yet) renders nothing.
 * `spriteGroups === null` means no sprite sheet is loaded yet -- every
 * element stays listed and selectable, but the preview shows one shared
 * waiting message instead of per-element error placeholders (see the
 * module doc comment).
 */
export function renderElementsPanel(
  root: HTMLElement,
  document_: LifebarDocument | null,
  spriteGroups: SpriteGroup[] | null,
  sffBytes: Uint8Array | null,
  options: ElementsPanelOptions = {},
): void {
  root.replaceChildren();
  if (document_ === null) return;

  const panel = document.createElement("wuik-panel");
  panel.className = "elements-panel";

  const heading = document.createElement("h3");
  heading.textContent = `Elements (${document_.sections.length})`;
  panel.appendChild(heading);

  if (document_.sections.length === 0) {
    const empty = document.createElement("p");
    empty.className = "elements-panel__empty";
    empty.textContent = "This lifebar has no recognized elements.";
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const selection = options.selection ?? { index: null };
  const resolvePixels =
    options.resolveSpritePixels ?? defaultResolveSpritePixels;
  const getContext2d = options.getContext2d ?? ((c) => c.getContext("2d"));
  const drawSprite = options.drawSprite ?? defaultDrawSprite;

  const body = document.createElement("div");
  body.className = "elements-panel__body";

  const list = document.createElement("div");
  list.className = "elements-panel__list";

  const preview = document.createElement("div");
  preview.className = "elements-panel__preview";
  preview.style.width = `${PREVIEW_CANVAS_WIDTH}px`;
  preview.style.height = `${PREVIEW_CANVAS_HEIGHT}px`;

  const canvas = document.createElement("canvas");
  canvas.className = "elements-panel__canvas";
  canvas.width = PREVIEW_CANVAS_WIDTH;
  canvas.height = PREVIEW_CANVAS_HEIGHT;
  preview.appendChild(canvas);

  const layouts = document_.sections.map((section) =>
    computeElementLayout(section),
  );
  const boxResults = layouts.map((layout) =>
    computeElementBox(layout, spriteGroups),
  );

  const buttons: HTMLButtonElement[] = [];
  const overlays: HTMLElement[] = [];

  function applySelection(): void {
    buttons.forEach((button, i) => {
      const selected = i === selection.index;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("is-selected", selected);
    });
    overlays.forEach((overlay, i) => {
      overlay.classList.toggle("is-selected", i === selection.index);
    });
  }

  function select(index: number): void {
    selection.index = index;
    applySelection();
  }

  document_.sections.forEach((section, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "elements-panel__item";
    button.setAttribute("aria-pressed", "false");
    button.textContent = section.name || "(unnamed element)";
    button.addEventListener("click", () => select(i));
    list.appendChild(button);
    buttons.push(button);

    const { box, layerResolutions } = boxResults[i];
    const overlay = document.createElement("div");
    overlay.className = "elements-panel__overlay";
    overlay.style.left = `${box.x}px`;
    overlay.style.top = `${box.y}px`;
    overlay.style.width = `${box.width}px`;
    overlay.style.height = `${box.height}px`;

    if (layerResolutions.length === 0) {
      overlay.classList.add("elements-panel__overlay--no-sprite");
      overlay.title = "No sprite layers on this element.";
    } else if (spriteGroups === null) {
      overlay.classList.add("elements-panel__overlay--waiting");
      overlay.title = "Load a sprite sheet to preview this element's sprites.";
    } else {
      const badRefs = layerResolutions
        .filter(
          (r): r is { kind: "invalid"; raw: string } => r.kind === "invalid",
        )
        .map((r) => r.raw);
      if (badRefs.length > 0) {
        overlay.classList.add("elements-panel__overlay--unresolved");
        overlay.title = `Sprite reference not found in the loaded sheet: ${badRefs.join(", ")}`;
      }
    }

    overlay.addEventListener("click", () => select(i));
    preview.appendChild(overlay);
    overlays.push(overlay);
  });

  if (spriteGroups === null) {
    const waiting = document.createElement("p");
    waiting.className = "elements-panel__waiting-message";
    waiting.textContent = "Waiting for a sprite sheet to preview elements.";
    preview.appendChild(waiting);
  }

  applySelection();

  body.append(list, preview);
  panel.appendChild(body);
  root.appendChild(panel);

  if (spriteGroups === null || sffBytes === null) return;
  const sffBytesNonNull = sffBytes;

  const requests: [number, number][] = [];
  const targets: { x: number; y: number }[] = [];
  layouts.forEach((layout, i) => {
    const { layerResolutions } = boxResults[i];
    layout.layers.forEach((layer, j) => {
      const resolution = layerResolutions[j];
      if (resolution.kind === "resolved") {
        requests.push([resolution.sprite.group, resolution.sprite.image]);
        targets.push(layerPosition(layout, layer));
      }
    });
  });
  if (requests.length === 0) return;

  const ctx = getContext2d(canvas);
  if (!ctx) return;

  resolvePixels(sffBytesNonNull, requests, null, options.bridgeOptions).then(
    (results) => {
      results.forEach((result, i) => {
        if (!result.ok) return;
        const { x, y } = targets[i];
        drawSprite(ctx, result.pixels, x, y, result.width, result.height);
      });
    },
  );
}
