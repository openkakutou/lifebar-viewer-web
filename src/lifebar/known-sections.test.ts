import { describe, expect, it } from "vitest";
import { isKnownSectionName } from "./known-sections.ts";

describe("isKnownSectionName", () => {
  it("recognizes the per-player life and power bar section families", () => {
    expect(isKnownSectionName("P1 Life Bar")).toBe(true);
    expect(isKnownSectionName("P2 Life Bar")).toBe(true);
    expect(isKnownSectionName("P1 Power Bar")).toBe(true);
    expect(isKnownSectionName("P2 Power Bar")).toBe(true);
  });

  it("recognizes the shared match/round/combo section families", () => {
    expect(isKnownSectionName("Files")).toBe(true);
    expect(isKnownSectionName("Match Wins")).toBe(true);
    expect(isKnownSectionName("Round Time")).toBe(true);
    expect(isKnownSectionName("Combo Display")).toBe(true);
  });

  it("matches case-insensitively and tolerates extra inner whitespace", () => {
    expect(isKnownSectionName("p1   life   bar")).toBe(true);
    expect(isKnownSectionName("MATCH WINS")).toBe(true);
  });

  it("rejects a name that matches none of the known families", () => {
    expect(isKnownSectionName("P1 Jukebox Widget")).toBe(false);
    expect(isKnownSectionName("Debug Overlay")).toBe(false);
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(isKnownSectionName("")).toBe(false);
    expect(isKnownSectionName("   ")).toBe(false);
  });
});
