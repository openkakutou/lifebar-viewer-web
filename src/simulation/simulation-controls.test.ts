import { describe, expect, it, vi } from "vitest";
import type { LifebarDocument, LifebarSection } from "../lifebar/document.ts";
import {
  defaultSimulatedValue,
  detectSimulatableSlots,
} from "./simulated-values.ts";
import { renderSimulationControls } from "./simulation-controls.ts";

function section(name: string): LifebarSection {
  return { name, entries: [], line: 1 };
}

function doc(names: string[]): LifebarDocument {
  return { sections: names.map(section) };
}

function valuesFor(document: LifebarDocument): Record<string, number> {
  const values: Record<string, number> = {};
  for (const slot of detectSimulatableSlots(document)) {
    values[slot.key] = defaultSimulatedValue(slot.kind);
  }
  return values;
}

describe("renderSimulationControls", () => {
  it("renders nothing when no document is loaded", () => {
    const root = document.createElement("div");
    renderSimulationControls(root, null, {}, () => {});
    expect(root.children.length).toBe(0);
  });

  it("renders nothing when the loaded document has no simulatable sections", () => {
    const root = document.createElement("div");
    const document_ = doc(["P1 Face"]);
    renderSimulationControls(root, document_, valuesFor(document_), () => {});
    expect(root.children.length).toBe(0);
  });

  it("renders only the controls for sections the document actually has, grouped by player", () => {
    const root = document.createElement("div");
    const document_ = doc(["P1 Life Bar", "P2 Power Bar", "Combo Display"]);

    renderSimulationControls(root, document_, valuesFor(document_), () => {});

    expect(root.textContent).toContain("P1 — Life");
    expect(root.textContent).toContain("P2 — Power");
    expect(root.textContent).toContain("Combo");
    expect(root.textContent).not.toContain("P1 — Power");
    expect(root.textContent).not.toContain("P2 — Life");
  });

  it("pre-fills each slider and numeric input from the given values", () => {
    const root = document.createElement("div");
    const document_ = doc(["P1 Life Bar"]);
    const values = { "life-0": 42 };

    renderSimulationControls(root, document_, values, () => {});

    const range = root.querySelector('wuik-slider[data-slot-key="life-0"]');
    const number = root.querySelector<HTMLInputElement>(
      '[data-slot-key="life-0"][type="number"]',
    );
    expect(range?.getAttribute("value")).toBe("42");
    expect(number?.value).toBe("42");
  });

  it("moving the slider calls onChange with the clamped value, live (on wuik-input, not just wuik-change)", () => {
    const root = document.createElement("div");
    const document_ = doc(["P1 Life Bar"]);
    const onChange = vi.fn();

    renderSimulationControls(root, document_, valuesFor(document_), onChange);

    const range = root.querySelector('wuik-slider[data-slot-key="life-0"]');
    if (!range) throw new Error("no slider");
    range.dispatchEvent(
      new CustomEvent("wuik-input", { detail: { value: 30 } }),
    );

    expect(onChange).toHaveBeenCalledWith("life-0", 30);
  });

  it("typing an out-of-range value into the numeric input clamps before calling onChange", () => {
    const root = document.createElement("div");
    const document_ = doc(["P1 Life Bar"]);
    const onChange = vi.fn();

    renderSimulationControls(root, document_, valuesFor(document_), onChange);

    const number = root.querySelector<HTMLInputElement>(
      '[data-slot-key="life-0"][type="number"]',
    );
    if (!number) throw new Error("no number input");
    number.value = "150";
    number.dispatchEvent(new Event("input"));

    expect(onChange).toHaveBeenCalledWith("life-0", 100);
    expect(number.value).toBe("100");
  });

  it("clamps an unparseable numeric entry to the range minimum", () => {
    const root = document.createElement("div");
    const document_ = doc(["Combo Display"]);
    const onChange = vi.fn();

    renderSimulationControls(root, document_, valuesFor(document_), onChange);

    const number = root.querySelector<HTMLInputElement>(
      '[data-slot-key="combo-0"][type="number"]',
    );
    if (!number) throw new Error("no number input");
    number.value = "";
    number.dispatchEvent(new Event("input"));

    expect(onChange).toHaveBeenCalledWith("combo-0", 0);
  });

  it("sets the combo slider's max to 50, not an unbounded range", () => {
    const root = document.createElement("div");
    const document_ = doc(["Combo Display"]);

    renderSimulationControls(root, document_, valuesFor(document_), () => {});

    const range = root.querySelector('wuik-slider[data-slot-key="combo-0"]');
    expect(range?.getAttribute("max")).toBe("50");
  });
});
