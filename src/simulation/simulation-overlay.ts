// Renders a simulated value's diagnostic overlay on top of an element's
// own real box (backlog item 005) — never mixed into the real sprite
// rendering underneath. See
// .vibe/decisions/005-simulation-values-shown-as-diagnostic-overlay-not-authentic-rendering.md
// for why this is an overlay rather than authentic MUGEN bar-fill/font
// rendering, and for the exact visual treatment: life/power get a
// warning-token fill bar growing from the box's left edge; combo gets a
// numeric chip at the box's corner. Deliberately visually distinct from
// elements-panel.ts's own accent-colored selection overlay, so a user
// viewing an element that's both selected and simulated can tell the two
// cues apart.
import type { Box } from "../elements/element-layout.ts";
import type { SimulatableSlot } from "./simulated-values.ts";

/** Appends the simulated-value overlay for `slot` at `box` into `container`. */
export function renderSimulationOverlay(
  container: HTMLElement,
  box: Box,
  slot: SimulatableSlot,
  value: number,
): void {
  if (slot.kind === "combo") {
    renderComboBadge(container, box, value);
    return;
  }
  renderFillBar(container, box, value);
}

function renderFillBar(container: HTMLElement, box: Box, value: number): void {
  const overlay = document.createElement("div");
  overlay.className = "simulation-overlay simulation-overlay--fill";
  overlay.style.left = `${box.x}px`;
  overlay.style.top = `${box.y}px`;
  overlay.style.width = `${box.width}px`;
  overlay.style.height = `${box.height}px`;

  const bar = document.createElement("div");
  bar.className = "simulation-overlay__fill-bar";
  bar.style.width = `${value}%`;
  overlay.appendChild(bar);

  // The color/stripe cue alone can be subtle against some sprite art (a
  // mid-tone sprite can visually absorb a semi-transparent warning-color
  // fill) -- a numeric label makes the exact value legible regardless, the
  // same "don't rely on color alone" reasoning behind the stripe pattern
  // itself.
  const label = document.createElement("span");
  label.className = "simulation-overlay__label";
  label.textContent = `${value}%`;
  overlay.appendChild(label);

  container.appendChild(overlay);
}

function renderComboBadge(
  container: HTMLElement,
  box: Box,
  value: number,
): void {
  const badge = document.createElement("div");
  badge.className = "simulation-overlay simulation-overlay__badge";
  badge.style.left = `${box.x}px`;
  badge.style.top = `${box.y}px`;
  badge.textContent = String(value);

  container.appendChild(badge);
}
