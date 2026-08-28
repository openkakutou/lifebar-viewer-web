import { describe, expect, it } from "vitest";
import type { LifebarDocument, LifebarSection } from "../lifebar/document.ts";
import {
  clampSimulatedValue,
  defaultSimulatedValue,
  detectSimulatableSlots,
} from "./simulated-values.ts";

function section(name: string): LifebarSection {
  return { name, entries: [], line: 1 };
}

function doc(names: string[]): LifebarDocument {
  return { sections: names.map(section) };
}

describe("detectSimulatableSlots", () => {
  it("detects a P1 life bar and a P1 power bar as separate slots", () => {
    const slots = detectSimulatableSlots(doc(["P1 Life Bar", "P1 Power Bar"]));

    expect(slots).toEqual([
      {
        key: "life-0",
        kind: "life",
        player: 1,
        sectionIndex: 0,
        label: "P1 — Life",
      },
      {
        key: "power-1",
        kind: "power",
        player: 1,
        sectionIndex: 1,
        label: "P1 — Power",
      },
    ]);
  });

  it("detects P2 slots distinctly from P1", () => {
    const slots = detectSimulatableSlots(doc(["P1 Life Bar", "P2 Life Bar"]));

    expect(slots.map((s) => s.player)).toEqual([1, 2]);
    expect(slots.map((s) => s.label)).toEqual(["P1 — Life", "P2 — Life"]);
  });

  it("detects a combo section with no player number", () => {
    const slots = detectSimulatableSlots(doc(["Combo Display"]));

    expect(slots).toEqual([
      {
        key: "combo-0",
        kind: "combo",
        player: null,
        sectionIndex: 0,
        label: "Combo",
      },
    ]);
  });

  it("only detects slots for sections the document actually has", () => {
    const slots = detectSimulatableSlots(doc(["P1 Life Bar"]));

    expect(slots.map((s) => s.kind)).toEqual(["life"]);
  });

  it("detects nothing for a document with no simulatable sections", () => {
    const slots = detectSimulatableSlots(doc(["P1 Face", "P1 Name"]));

    expect(slots).toEqual([]);
  });

  it("ignores case and extra whitespace, matching the same tolerance as known-sections.ts", () => {
    const slots = detectSimulatableSlots(doc(["p1  life  bar"]));

    expect(slots).toHaveLength(1);
    expect(slots[0]?.kind).toBe("life");
  });
});

describe("defaultSimulatedValue", () => {
  it("defaults life and power to 100 (a full, undamaged bar)", () => {
    expect(defaultSimulatedValue("life")).toBe(100);
    expect(defaultSimulatedValue("power")).toBe(100);
  });

  it("defaults combo to 0 (no combo in progress)", () => {
    expect(defaultSimulatedValue("combo")).toBe(0);
  });
});

describe("clampSimulatedValue", () => {
  it("clamps life/power to 0-100", () => {
    expect(clampSimulatedValue("life", 150)).toBe(100);
    expect(clampSimulatedValue("life", -10)).toBe(0);
    expect(clampSimulatedValue("power", 42)).toBe(42);
  });

  it("clamps combo to 0-50", () => {
    expect(clampSimulatedValue("combo", 999)).toBe(50);
    expect(clampSimulatedValue("combo", -5)).toBe(0);
    expect(clampSimulatedValue("combo", 12)).toBe(12);
  });

  it("clamps a non-finite input (NaN from an invalid text entry) to the range minimum", () => {
    expect(clampSimulatedValue("life", Number.NaN)).toBe(0);
  });
});
