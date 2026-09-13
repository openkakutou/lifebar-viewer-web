// Pure layout logic for the elements panel + preview renderer (backlog item
// 004): where each recognized element (`known-sections.ts`) draws in the
// preview, computed from its own raw, unevaluated LifebarEntry list.
//
// Convention: a section's `pos` entry ("x, y") is its anchor point,
// defaulting to (0, 0). Each `N.spr` entry (N a non-negative integer, e.g.
// "0.spr = 9000, 0") is one layer's sprite reference, offset from the
// anchor by its matching `N.offset` entry if present ((0, 0) otherwise) --
// the same ".spr"-suffix-as-sprite-reference convention `lifebar-editor`'s
// own decision 004 independently established for the same file format. See
// .vibe/decisions/004-element-layout-convention-and-placeholder-states.md
// for the full reasoning, including why three distinct unresolved states
// exist rather than one generic "placeholder".
import type { LifebarSection } from "../lifebar/document.ts";
import type { Sprite, SpriteGroup } from "../wasm/types.ts";

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The classic MUGEN/Ikemen GO screen resolution every lifebar is authored against. */
export const PREVIEW_CANVAS_WIDTH = 640;
export const PREVIEW_CANVAS_HEIGHT = 480;

/** Fixed box side length for a layer that can't (yet, or ever) show a real sprite. */
export const PLACEHOLDER_SIZE = 32;

/** One `N.spr` layer within an element, with its own offset from the element's origin. */
export interface ElementLayer {
  index: number;
  offset: Point;
  /** null when the `N.spr` value itself is malformed (not a "group, image" pair). */
  spriteRef: { group: number; image: number } | null;
}

/**
 * Why a section could not be split into a clean per-player layout -- see
 * .vibe/decisions/009-shared-section-per-player-split-and-malformed-state.md.
 * `mixed-prefix`: some entries carry a p1./p2. prefix, others don't.
 * `one-sided-prefix`: only one player's prefix is present, the other is
 * entirely missing.
 */
export type SectionPrefixIssue = "mixed-prefix" | "one-sided-prefix";

/** One recognized element's computed layout: its anchor point and sprite layers. */
export interface ElementLayout {
  name: string;
  origin: Point;
  layers: ElementLayer[];
  /** Set only for a malformed shared section -- see computeSectionElementLayouts. */
  issue?: SectionPrefixIssue;
}

const POINT_PATTERN = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;
const SPRITE_LAYER_KEY = /^(\d+)\.spr$/i;
const SPRITE_REF_PATTERN = /^(-?\d+)\s*,\s*(-?\d+)$/;

/** Parses an "x, y" pair, defaulting to the origin when absent or malformed. */
export function parsePoint(value: string | undefined): Point {
  if (value === undefined) return { x: 0, y: 0 };
  const match = value.trim().match(POINT_PATTERN);
  if (!match) return { x: 0, y: 0 };
  return { x: Number(match[1]), y: Number(match[2]) };
}

function parseSpriteRefValue(
  value: string,
): { group: number; image: number } | null {
  const match = value.trim().match(SPRITE_REF_PATTERN);
  if (!match) return null;
  return { group: Number(match[1]), image: Number(match[2]) };
}

function findEntry(section: LifebarSection, key: string): string | undefined {
  const target = key.toLowerCase();
  return section.entries.find((e) => e.key.trim().toLowerCase() === target)
    ?.value;
}

/** Computes a recognized section's layout: its origin and ordered sprite layers. */
export function computeElementLayout(section: LifebarSection): ElementLayout {
  const origin = parsePoint(findEntry(section, "pos"));

  const layers: ElementLayer[] = [];
  for (const entry of section.entries) {
    const match = entry.key.trim().match(SPRITE_LAYER_KEY);
    if (!match) continue;
    const index = Number(match[1]);
    layers.push({
      index,
      offset: parsePoint(findEntry(section, `${index}.offset`)),
      spriteRef: parseSpriteRefValue(entry.value),
    });
  }
  layers.sort((a, b) => a.index - b.index);

  return { name: section.name, origin, layers };
}

type PlayerPrefix = "p1" | "p2";

function hasPlayerPrefix(
  entry: { key: string },
  prefix: PlayerPrefix,
): boolean {
  return entry.key.trim().toLowerCase().startsWith(`${prefix}.`);
}

/**
 * Whether an (unprefixed) key could actually affect a computed layout --
 * the same `pos`/`N.spr`/`N.offset` set `computeElementLayout` itself reads,
 * everything else already being silently ignored by it regardless of any
 * prefix. A real Ikemen GO section legitimately mixes per-player
 * (`p1.`/`p2.`) data with section-wide, non-positional settings (e.g.
 * `[Powerbar]`'s `level1.snd`) or with an unrelated third/fourth-player
 * prefix (`p3.`/`p4.`, real Simul-mode sections) this app doesn't split by
 * (out of this item's scope) -- neither should demote an otherwise-clean p1./p2.
 * split to the malformed diagnostic state, since neither can produce a
 * plausible-but-wrong layout on its own.
 */
const LAYOUT_RELEVANT_KEY = /^(pos|\d+\.(?:spr|offset))$/i;

function isLayoutRelevantKey(key: string): boolean {
  return LAYOUT_RELEVANT_KEY.test(key.trim());
}

/**
 * A section's own player-prefixing shape -- see
 * .vibe/decisions/009-shared-section-per-player-split-and-malformed-state.md.
 */
export type SectionPrefixShape =
  | { kind: "unprefixed" }
  | { kind: "per-player" }
  | { kind: SectionPrefixIssue };

/** Classifies a section by whether its entries use a p1./p2. key prefix, and how consistently. */
export function classifySectionPrefixShape(
  section: LifebarSection,
): SectionPrefixShape {
  const hasP1 = section.entries.some((e) => hasPlayerPrefix(e, "p1"));
  const hasP2 = section.entries.some((e) => hasPlayerPrefix(e, "p2"));
  const hasOther = section.entries.some(
    (e) =>
      !hasPlayerPrefix(e, "p1") &&
      !hasPlayerPrefix(e, "p2") &&
      isLayoutRelevantKey(e.key),
  );

  if (!hasP1 && !hasP2) return { kind: "unprefixed" };
  if (hasOther) return { kind: "mixed-prefix" };
  if (hasP1 && hasP2) return { kind: "per-player" };
  return { kind: "one-sided-prefix" };
}

/** Builds a per-player sub-section: only that player's entries, prefix stripped. */
function subSectionForPlayer(
  section: LifebarSection,
  prefix: PlayerPrefix,
  playerLabel: string,
): LifebarSection {
  return {
    name: `${section.name} (${playerLabel})`,
    line: section.line,
    entries: section.entries
      .filter((e) => hasPlayerPrefix(e, prefix))
      .map((e) => ({ ...e, key: e.key.trim().slice(prefix.length + 1) })),
  };
}

/**
 * A fixed, neutral, non-guessed placeholder for a section whose player
 * prefixing is malformed -- deliberately never anchored at a player's own
 * (possibly present) `pos`, so it can never look like a verified position.
 * See .vibe/decisions/009.
 */
function malformedElementLayout(
  section: LifebarSection,
  issue: SectionPrefixIssue,
): ElementLayout {
  return { name: section.name, origin: { x: 0, y: 0 }, layers: [], issue };
}

/**
 * Computes the one or two elements a section renders as: unchanged for a
 * classic per-player section, split in two for a clean shared p1./p2.
 * section, or a single diagnostic placeholder for a malformed one -- see
 * .vibe/decisions/009-shared-section-per-player-split-and-malformed-state.md.
 */
export function computeSectionElementLayouts(
  section: LifebarSection,
): ElementLayout[] {
  const shape = classifySectionPrefixShape(section);
  switch (shape.kind) {
    case "unprefixed":
      return [computeElementLayout(section)];
    case "per-player":
      return [
        computeElementLayout(subSectionForPlayer(section, "p1", "P1")),
        computeElementLayout(subSectionForPlayer(section, "p2", "P2")),
      ];
    case "mixed-prefix":
    case "one-sided-prefix":
      return [malformedElementLayout(section, shape.kind)];
  }
}

/** A layer's absolute position: the element's origin plus the layer's own offset. */
export function layerPosition(
  layout: ElementLayout,
  layer: ElementLayer,
): Point {
  return {
    x: layout.origin.x + layer.offset.x,
    y: layout.origin.y + layer.offset.y,
  };
}

/**
 * A layer's resolution state against a (possibly not-yet-loaded) sprite
 * sheet -- three distinct states, not one generic "unresolved", since a
 * previewer's whole value is telling the user which case they're in. See
 * .vibe/decisions/004.
 */
export type LayerResolution =
  | { kind: "no-sheet" }
  | { kind: "invalid"; raw: string }
  | { kind: "resolved"; sprite: Sprite };

/** Resolves one layer's sprite reference against spriteGroups (null = no sheet loaded). */
export function resolveLayer(
  layer: ElementLayer,
  spriteGroups: SpriteGroup[] | null,
): LayerResolution {
  if (spriteGroups === null) return { kind: "no-sheet" };
  if (layer.spriteRef === null) {
    return { kind: "invalid", raw: "malformed sprite reference" };
  }

  const group = spriteGroups.find((g) => g.index === layer.spriteRef?.group);
  const sprite = group?.sprites.find((s) => s.image === layer.spriteRef?.image);
  if (!sprite) {
    return {
      kind: "invalid",
      raw: `${layer.spriteRef.group}, ${layer.spriteRef.image}`,
    };
  }
  return { kind: "resolved", sprite };
}

/** A layer's drawable box: the real sprite size when resolved, a fixed placeholder otherwise. */
export function layerBox(
  layout: ElementLayout,
  layer: ElementLayer,
  resolution: LayerResolution,
): Box {
  const pos = layerPosition(layout, layer);
  if (resolution.kind === "resolved") {
    return {
      x: pos.x,
      y: pos.y,
      width: resolution.sprite.width,
      height: resolution.sprite.height,
    };
  }
  return {
    x: pos.x,
    y: pos.y,
    width: PLACEHOLDER_SIZE,
    height: PLACEHOLDER_SIZE,
  };
}

/**
 * Intersects box with the fixed preview canvas rectangle. Applied before a
 * layer's box can contribute to an element's overall highlight box, so a
 * single wild/malformed offset cannot balloon or displace the whole
 * element's selection highlight -- see .vibe/decisions/004.
 */
export function clampBoxToCanvas(box: Box): Box {
  const x1 = Math.max(0, Math.min(box.x, PREVIEW_CANVAS_WIDTH));
  const y1 = Math.max(0, Math.min(box.y, PREVIEW_CANVAS_HEIGHT));
  const x2 = Math.max(0, Math.min(box.x + box.width, PREVIEW_CANVAS_WIDTH));
  const y2 = Math.max(0, Math.min(box.y + box.height, PREVIEW_CANVAS_HEIGHT));
  return {
    x: x1,
    y: y1,
    width: Math.max(0, x2 - x1),
    height: Math.max(0, y2 - y1),
  };
}

function unionBoxes(boxes: Box[]): Box {
  const x1 = Math.min(...boxes.map((b) => b.x));
  const y1 = Math.min(...boxes.map((b) => b.y));
  const x2 = Math.max(...boxes.map((b) => b.x + b.width));
  const y2 = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

export interface ElementBoxResult {
  /** The element's overall highlight box (already clamped to the canvas). */
  box: Box;
  /** One resolution per layer, in the same order as layout.layers. */
  layerResolutions: LayerResolution[];
}

/**
 * Computes an element's overall highlight box and each layer's resolution.
 * An element with no sprite layers at all (e.g. a text-only "Name" section)
 * still gets a small placeholder box at its origin, so selecting it isn't a
 * dead end.
 */
export function computeElementBox(
  layout: ElementLayout,
  spriteGroups: SpriteGroup[] | null,
): ElementBoxResult {
  if (layout.layers.length === 0) {
    return {
      box: clampBoxToCanvas({
        x: layout.origin.x,
        y: layout.origin.y,
        width: PLACEHOLDER_SIZE,
        height: PLACEHOLDER_SIZE,
      }),
      layerResolutions: [],
    };
  }

  const layerResolutions = layout.layers.map((layer) =>
    resolveLayer(layer, spriteGroups),
  );
  const boxes = layout.layers.map((layer, i) =>
    clampBoxToCanvas(layerBox(layout, layer, layerResolutions[i])),
  );
  return { box: unionBoxes(boxes), layerResolutions };
}
