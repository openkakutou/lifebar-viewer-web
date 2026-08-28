import { describe, expect, it } from "vitest";
import type { Box } from "../elements/element-layout.ts";
import type { SimulatableSlot } from "./simulated-values.ts";
import { renderSimulationOverlay } from "./simulation-overlay.ts";

const box: Box = { x: 10, y: 20, width: 100, height: 40 };

function lifeSlot(): SimulatableSlot {
  return {
    key: "life-0",
    kind: "life",
    player: 1,
    sectionIndex: 0,
    label: "P1 — Life",
  };
}

function comboSlot(): SimulatableSlot {
  return {
    key: "combo-0",
    kind: "combo",
    player: null,
    sectionIndex: 0,
    label: "Combo",
  };
}

describe("renderSimulationOverlay", () => {
  it("positions a life/power fill overlay at the element's own box", () => {
    const container = document.createElement("div");

    renderSimulationOverlay(container, box, lifeSlot(), 50);

    const overlay = container.querySelector<HTMLElement>(
      ".simulation-overlay--fill",
    );
    expect(overlay?.style.left).toBe("10px");
    expect(overlay?.style.top).toBe("20px");
    expect(overlay?.style.width).toBe("100px");
    expect(overlay?.style.height).toBe("40px");
  });

  it("shows a numeric percentage label so the value is legible even when the color cue is subtle", () => {
    const container = document.createElement("div");

    renderSimulationOverlay(container, box, lifeSlot(), 60);

    expect(
      container.querySelector(".simulation-overlay__label")?.textContent,
    ).toBe("60%");
  });

  it("sizes the inner fill bar proportionally to the value, growing from the left", () => {
    const container = document.createElement("div");

    renderSimulationOverlay(container, box, lifeSlot(), 25);

    const fill = container.querySelector<HTMLElement>(
      ".simulation-overlay__fill-bar",
    );
    expect(fill?.style.width).toBe("25%");
  });

  it("shows a full-width fill bar at 100 and a zero-width (but present) one at 0", () => {
    const container = document.createElement("div");
    renderSimulationOverlay(container, box, lifeSlot(), 100);
    expect(
      container.querySelector<HTMLElement>(".simulation-overlay__fill-bar")
        ?.style.width,
    ).toBe("100%");

    container.replaceChildren();
    renderSimulationOverlay(container, box, lifeSlot(), 0);
    const zeroFill = container.querySelector<HTMLElement>(
      ".simulation-overlay__fill-bar",
    );
    expect(zeroFill?.style.width).toBe("0%");
    expect(zeroFill).not.toBeNull();
  });

  it("renders a numeric badge, not a fill bar, for a combo slot", () => {
    const container = document.createElement("div");

    renderSimulationOverlay(container, box, comboSlot(), 7);

    expect(container.querySelector(".simulation-overlay--fill")).toBeNull();
    const badge = container.querySelector<HTMLElement>(
      ".simulation-overlay__badge",
    );
    expect(badge?.textContent).toBe("7");
    expect(badge?.style.left).toBe("10px");
    expect(badge?.style.top).toBe("20px");
  });
});
