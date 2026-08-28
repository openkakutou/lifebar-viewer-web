// Live value simulation controls (backlog item 005): a slider paired with
// a numeric input for each simulatable section the loaded lifebar actually
// defines, grouped by player. A slider alone can't hit a precise
// diagnostic value and fails keyboard-only operability, so every slot gets
// both, kept in sync — see plan consultation notes in
// .vibe/decisions/005-simulation-values-shown-as-diagnostic-overlay-not-authentic-rendering.md.
import type { LifebarDocument } from "../lifebar/document.ts";
import {
  type SimulatableSlot,
  clampSimulatedValue,
  defaultSimulatedValue,
  detectSimulatableSlots,
} from "./simulated-values.ts";

const RANGE_BOUNDS: Record<
  SimulatableSlot["kind"],
  { min: number; max: number }
> = {
  life: { min: 0, max: 100 },
  power: { min: 0, max: 100 },
  combo: { min: 0, max: 50 },
};

/** Renders live value simulation controls into `root`, replacing its previous content. */
export function renderSimulationControls(
  root: HTMLElement,
  document_: LifebarDocument | null,
  values: Readonly<Record<string, number>>,
  onChange: (key: string, value: number) => void,
): void {
  root.replaceChildren();
  if (document_ === null) return;

  const slots = detectSimulatableSlots(document_);
  if (slots.length === 0) return;

  const container = document.createElement("div");
  container.className = "simulation-controls";

  let currentPlayer: 1 | 2 | null | "__unset__" = "__unset__";
  let group: HTMLElement = container;

  for (const slot of slots) {
    if (slot.player !== currentPlayer) {
      currentPlayer = slot.player;
      group = document.createElement("div");
      group.className = "simulation-controls__group";
      if (slot.player !== null) {
        const heading = document.createElement("h4");
        heading.textContent = `P${slot.player}`;
        group.appendChild(heading);
      }
      container.appendChild(group);
    }

    group.appendChild(buildSlotRow(slot, values[slot.key], onChange));
  }

  root.appendChild(container);
}

function buildSlotRow(
  slot: SimulatableSlot,
  initialValue: number | undefined,
  onChange: (key: string, value: number) => void,
): HTMLElement {
  const { min, max } = RANGE_BOUNDS[slot.kind];
  const startValue = clampSimulatedValue(
    slot.kind,
    initialValue ?? defaultSimulatedValue(slot.kind),
  );

  const row = document.createElement("div");
  row.className = "simulation-controls__row";

  const label = document.createElement("label");
  label.className = "simulation-controls__label";
  label.textContent = slot.label;
  row.appendChild(label);

  const range = document.createElement("input");
  range.type = "range";
  range.min = String(min);
  range.max = String(max);
  range.step = "1";
  range.value = String(startValue);
  range.dataset.slotKey = slot.key;
  row.appendChild(range);

  const number = document.createElement("input");
  number.type = "number";
  number.min = String(min);
  number.max = String(max);
  number.step = "1";
  number.value = String(startValue);
  number.dataset.slotKey = slot.key;
  row.appendChild(number);

  function commit(raw: number): void {
    const clamped = clampSimulatedValue(slot.kind, raw);
    range.value = String(clamped);
    number.value = String(clamped);
    onChange(slot.key, clamped);
  }

  range.addEventListener("input", () => commit(Number(range.value)));
  number.addEventListener("input", () => commit(Number(number.value)));

  return row;
}
