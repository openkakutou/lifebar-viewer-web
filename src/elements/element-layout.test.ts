import { describe, expect, it } from "vitest";
import type { LifebarSection } from "../lifebar/document.ts";
import type { SpriteGroup } from "../wasm/types.ts";
import {
  PLACEHOLDER_SIZE,
  PREVIEW_CANVAS_HEIGHT,
  PREVIEW_CANVAS_WIDTH,
  clampBoxToCanvas,
  computeElementBox,
  computeElementLayout,
  layerBox,
  layerPosition,
  parsePoint,
  resolveLayer,
} from "./element-layout.ts";

function section(
  name: string,
  entries: { key: string; value: string }[],
): LifebarSection {
  return {
    name,
    entries: entries.map((e, i) => ({ ...e, line: i + 1 })),
    line: 0,
  };
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
        {
          group: 9000,
          image: 1,
          width: 10,
          height: 10,
          axisX: 0,
          axisY: 0,
          palette: 0,
        },
      ],
    },
  ];
}

describe("parsePoint", () => {
  it("parses a well-formed 'x, y' pair", () => {
    expect(parsePoint("149, 20")).toEqual({ x: 149, y: 20 });
  });

  it("tolerates no space after the comma", () => {
    expect(parsePoint("149,20")).toEqual({ x: 149, y: 20 });
  });

  it("defaults to the origin when the value is undefined", () => {
    expect(parsePoint(undefined)).toEqual({ x: 0, y: 0 });
  });

  it("defaults to the origin when the value is malformed", () => {
    expect(parsePoint("not-a-point")).toEqual({ x: 0, y: 0 });
  });
});

describe("computeElementLayout", () => {
  it("reads the section's pos entry as its origin", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [{ key: "pos", value: "5, 17" }]),
    );
    expect(layout.origin).toEqual({ x: 5, y: 17 });
  });

  it("defaults the origin to (0, 0) when pos is absent", () => {
    const layout = computeElementLayout(section("P1 Name", []));
    expect(layout.origin).toEqual({ x: 0, y: 0 });
  });

  it("collects every N.spr entry as a layer, sorted by index", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [
        { key: "pos", value: "5, 17" },
        { key: "1.spr", value: "9000, 1" },
        { key: "0.spr", value: "9000, 0" },
      ]),
    );
    expect(layout.layers.map((l) => l.index)).toEqual([0, 1]);
    expect(layout.layers[0].spriteRef).toEqual({ group: 9000, image: 0 });
    expect(layout.layers[1].spriteRef).toEqual({ group: 9000, image: 1 });
  });

  it("pairs a layer with its matching N.offset entry", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [
        { key: "0.spr", value: "9000, 0" },
        { key: "0.offset", value: "3, -2" },
      ]),
    );
    expect(layout.layers[0].offset).toEqual({ x: 3, y: -2 });
  });

  it("defaults a layer's offset to (0, 0) when no N.offset entry exists", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [{ key: "0.spr", value: "9000, 0" }]),
    );
    expect(layout.layers[0].offset).toEqual({ x: 0, y: 0 });
  });

  it("records a malformed N.spr value as a null spriteRef rather than dropping the layer", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [{ key: "0.spr", value: "garbage" }]),
    );
    expect(layout.layers).toHaveLength(1);
    expect(layout.layers[0].spriteRef).toBeNull();
  });

  it("ignores entries that are neither pos, N.spr, nor N.offset", () => {
    const layout = computeElementLayout(
      section("P1 Name", [{ key: "font", value: "0, 0" }]),
    );
    expect(layout.layers).toHaveLength(0);
  });
});

describe("layerPosition", () => {
  it("adds the layer's offset to the layout's origin", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [
        { key: "pos", value: "100, 50" },
        { key: "0.spr", value: "9000, 0" },
        { key: "0.offset", value: "3, -2" },
      ]),
    );
    expect(layerPosition(layout, layout.layers[0])).toEqual({ x: 103, y: 48 });
  });
});

describe("resolveLayer", () => {
  const layout = computeElementLayout(
    section("P1 Life Bar", [{ key: "0.spr", value: "9000, 0" }]),
  );

  it("reports no-sheet when spriteGroups is null", () => {
    expect(resolveLayer(layout.layers[0], null)).toEqual({ kind: "no-sheet" });
  });

  it("reports resolved with the matching sprite's metadata", () => {
    const result = resolveLayer(layout.layers[0], spriteGroups());
    expect(result).toEqual({
      kind: "resolved",
      sprite: {
        group: 9000,
        image: 0,
        width: 50,
        height: 20,
        axisX: 0,
        axisY: 0,
        palette: 0,
      },
    });
  });

  it("reports invalid when the referenced sprite is not in the loaded sheet", () => {
    const missing = computeElementLayout(
      section("P1 Life Bar", [{ key: "0.spr", value: "9000, 99" }]),
    );
    const result = resolveLayer(missing.layers[0], spriteGroups());
    expect(result.kind).toBe("invalid");
  });

  it("reports invalid for a layer with a malformed (null) spriteRef", () => {
    const malformed = computeElementLayout(
      section("P1 Life Bar", [{ key: "0.spr", value: "garbage" }]),
    );
    const result = resolveLayer(malformed.layers[0], spriteGroups());
    expect(result.kind).toBe("invalid");
  });
});

describe("layerBox", () => {
  const layout = computeElementLayout(
    section("P1 Life Bar", [
      { key: "pos", value: "10, 10" },
      { key: "0.spr", value: "9000, 0" },
    ]),
  );

  it("uses the resolved sprite's real dimensions", () => {
    const resolution = resolveLayer(layout.layers[0], spriteGroups());
    expect(layerBox(layout, layout.layers[0], resolution)).toEqual({
      x: 10,
      y: 10,
      width: 50,
      height: 20,
    });
  });

  it("uses the fixed placeholder size when unresolved", () => {
    const resolution = resolveLayer(layout.layers[0], null);
    expect(layerBox(layout, layout.layers[0], resolution)).toEqual({
      x: 10,
      y: 10,
      width: PLACEHOLDER_SIZE,
      height: PLACEHOLDER_SIZE,
    });
  });
});

describe("clampBoxToCanvas", () => {
  it("leaves a box entirely inside the canvas unchanged", () => {
    expect(clampBoxToCanvas({ x: 10, y: 10, width: 20, height: 20 })).toEqual({
      x: 10,
      y: 10,
      width: 20,
      height: 20,
    });
  });

  it("truncates a box straddling the right/bottom edge", () => {
    expect(
      clampBoxToCanvas({
        x: PREVIEW_CANVAS_WIDTH - 5,
        y: PREVIEW_CANVAS_HEIGHT - 5,
        width: 50,
        height: 50,
      }),
    ).toEqual({
      x: PREVIEW_CANVAS_WIDTH - 5,
      y: PREVIEW_CANVAS_HEIGHT - 5,
      width: 5,
      height: 5,
    });
  });

  it("collapses a box entirely outside the canvas to zero size at the clamped edge", () => {
    expect(
      clampBoxToCanvas({ x: 10000, y: 10000, width: 32, height: 32 }),
    ).toEqual({
      x: PREVIEW_CANVAS_WIDTH,
      y: PREVIEW_CANVAS_HEIGHT,
      width: 0,
      height: 0,
    });
  });

  it("clamps a negative-origin box back onto the canvas", () => {
    expect(clampBoxToCanvas({ x: -20, y: -20, width: 30, height: 30 })).toEqual(
      {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      },
    );
  });
});

describe("computeElementBox", () => {
  it("gives an element with zero sprite layers a placeholder box at its origin", () => {
    const layout = computeElementLayout(
      section("P1 Name", [{ key: "pos", value: "5, 5" }]),
    );
    const result = computeElementBox(layout, spriteGroups());
    expect(result.box).toEqual({
      x: 5,
      y: 5,
      width: PLACEHOLDER_SIZE,
      height: PLACEHOLDER_SIZE,
    });
    expect(result.layerResolutions).toEqual([]);
  });

  it("unions every resolved layer's box", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [
        { key: "pos", value: "0, 0" },
        { key: "0.spr", value: "9000, 0" }, // 0,0 .. 50,20
        { key: "1.spr", value: "9000, 1" },
        { key: "1.offset", value: "100, 100" }, // 100,100 .. 110,110
      ]),
    );
    const result = computeElementBox(layout, spriteGroups());
    expect(result.box).toEqual({ x: 0, y: 0, width: 110, height: 110 });
  });

  it("reports one resolution per layer, in layer order", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [
        { key: "0.spr", value: "9000, 0" },
        { key: "1.spr", value: "9000, 99" },
      ]),
    );
    const result = computeElementBox(layout, spriteGroups());
    expect(result.layerResolutions.map((r) => r.kind)).toEqual([
      "resolved",
      "invalid",
    ]);
  });

  it("clamps a wildly-offset layer instead of letting it balloon the element's box", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [
        { key: "pos", value: "0, 0" },
        { key: "0.spr", value: "9000, 0" }, // 0,0 .. 50,20 (a real, sane layer)
        { key: "1.spr", value: "9000, 1" },
        { key: "1.offset", value: "999999, 999999" }, // corrupt/wild offset
      ]),
    );
    const result = computeElementBox(layout, spriteGroups());
    // The union stays within the fixed canvas -- the wild layer contributes
    // at most the canvas's own far corner, not its real (huge) coordinates.
    expect(result.box.x + result.box.width).toBeLessThanOrEqual(
      PREVIEW_CANVAS_WIDTH,
    );
    expect(result.box.y + result.box.height).toBeLessThanOrEqual(
      PREVIEW_CANVAS_HEIGHT,
    );
  });

  it("treats every layer as unresolved (no-sheet) when spriteGroups is null", () => {
    const layout = computeElementLayout(
      section("P1 Life Bar", [{ key: "0.spr", value: "9000, 0" }]),
    );
    const result = computeElementBox(layout, null);
    expect(result.layerResolutions).toEqual([{ kind: "no-sheet" }]);
    expect(result.box).toEqual({
      x: 0,
      y: 0,
      width: PLACEHOLDER_SIZE,
      height: PLACEHOLDER_SIZE,
    });
  });
});
