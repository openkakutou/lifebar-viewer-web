// Pure logic for live value simulation (backlog item 005): which sections
// of a loaded lifebar can have a simulated value, and the default/clamp
// rules for each kind. No DOM, no rendering — see
// .vibe/decisions/005-simulation-values-shown-as-diagnostic-overlay-not-authentic-rendering.md
// for why a simulated value is shown as a diagnostic overlay rather than
// authentic MUGEN rendering, and for the reasoning behind every default
// and range below.
import type { LifebarDocument } from "../lifebar/document.ts";

export type SimulatedValueKind = "life" | "power" | "combo";

/** One section that can have a simulated value, detected from the loaded document. */
export interface SimulatableSlot {
  /** Stable, unique key for this slot — sectionIndex-suffixed, so a malformed file with duplicate sections never collides. */
  key: string;
  kind: SimulatedValueKind;
  /** null for combo, whose recognized pattern (known-sections.ts) has no player-number prefix. */
  player: 1 | 2 | null;
  sectionIndex: number;
  /** e.g. "P1 — Life", "Combo" — always names the player alongside the value type when there is one. */
  label: string;
}

const LIFE_PATTERN = /^p([12])\s*life\s*bar$/;
const POWER_PATTERN = /^p([12])\s*power\s*bar$/;
// Same pattern known-sections.ts recognizes this section family by —
// deliberately not imported from there, since that module's job is
// recognition (is this a section we parse at all), not the player-number
// capture this one additionally needs.
const COMBO_PATTERN = /^combo(\s*display|\s*counter)?$/;

function normalizeSectionName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Detects every simulatable section in `document`, in file order. A
 * section absent from the file contributes no slot at all — never a
 * disabled/ghosted control for a value the loaded lifebar doesn't define.
 */
export function detectSimulatableSlots(
  document: LifebarDocument,
): SimulatableSlot[] {
  const slots: SimulatableSlot[] = [];

  document.sections.forEach((section, sectionIndex) => {
    const normalized = normalizeSectionName(section.name);

    const lifeMatch = normalized.match(LIFE_PATTERN);
    if (lifeMatch) {
      const player = Number(lifeMatch[1]) as 1 | 2;
      slots.push({
        key: `life-${sectionIndex}`,
        kind: "life",
        player,
        sectionIndex,
        label: `P${player} — Life`,
      });
      return;
    }

    const powerMatch = normalized.match(POWER_PATTERN);
    if (powerMatch) {
      const player = Number(powerMatch[1]) as 1 | 2;
      slots.push({
        key: `power-${sectionIndex}`,
        kind: "power",
        player,
        sectionIndex,
        label: `P${player} — Power`,
      });
      return;
    }

    if (COMBO_PATTERN.test(normalized)) {
      slots.push({
        key: `combo-${sectionIndex}`,
        kind: "combo",
        player: null,
        sectionIndex,
        label: "Combo",
      });
    }
  });

  return slots;
}

const RANGES: Record<
  SimulatedValueKind,
  { min: number; max: number; default: number }
> = {
  // A freshly-loaded, undamaged bar is the more useful diagnostic starting
  // point than an empty one.
  life: { min: 0, max: 100, default: 100 },
  power: { min: 0, max: 100, default: 100 },
  // MUGEN itself has no real combo ceiling; 50 keeps the 1-20 range most
  // diagnostic testing actually uses from being crushed into a few pixels
  // of drag precision on an unbounded slider.
  combo: { min: 0, max: 50, default: 0 },
};

/** The starting value for a freshly-detected slot of this kind. */
export function defaultSimulatedValue(kind: SimulatedValueKind): number {
  return RANGES[kind].default;
}

/**
 * Clamps `raw` into the valid range for `kind`. A non-finite input (e.g.
 * `NaN` from an invalid text entry) clamps to the range minimum rather
 * than propagating — never a broken/undefined simulated state.
 */
export function clampSimulatedValue(
  kind: SimulatedValueKind,
  raw: number,
): number {
  const { min, max } = RANGES[kind];
  if (!Number.isFinite(raw)) return min;
  return Math.max(min, Math.min(max, raw));
}
