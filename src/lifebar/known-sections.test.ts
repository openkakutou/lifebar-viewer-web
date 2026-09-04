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

  it("recognizes the modern Ikemen GO generic (non-player-prefixed) section families", () => {
    expect(isKnownSectionName("Lifebar")).toBe(true);
    expect(isKnownSectionName("Powerbar")).toBe(true);
    expect(isKnownSectionName("Face")).toBe(true);
    expect(isKnownSectionName("Name")).toBe(true);
    expect(isKnownSectionName("Time")).toBe(true);
    expect(isKnownSectionName("WinIcon")).toBe(true);
  });

  it("recognizes Simul/Turns/Tag mode-variant prefixes on Lifebar, Face and Name", () => {
    expect(isKnownSectionName("Simul Lifebar")).toBe(true);
    expect(isKnownSectionName("Turns Lifebar")).toBe(true);
    expect(isKnownSectionName("Tag Lifebar")).toBe(true);
    expect(isKnownSectionName("Simul Face")).toBe(true);
    expect(isKnownSectionName("Turns Name")).toBe(true);
    expect(isKnownSectionName("Tag Name")).toBe(true);
  });

  it("recognizes numbered mode-variant prefixes (Simul_3P, Simul_4P, Tag_3P, Tag_4P)", () => {
    expect(isKnownSectionName("Simul_3P Lifebar")).toBe(true);
    expect(isKnownSectionName("Simul_4P Lifebar")).toBe(true);
    expect(isKnownSectionName("Tag_3P Lifebar")).toBe(true);
    expect(isKnownSectionName("Tag_4P Face")).toBe(true);
  });

  it("matches the new families case-insensitively and tolerates extra inner whitespace", () => {
    expect(isKnownSectionName("lifebar")).toBe(true);
    expect(isKnownSectionName("WINICON")).toBe(true);
    expect(isKnownSectionName("simul   lifebar")).toBe(true);
  });

  it("does not apply the mode-variant prefix to Powerbar, Time, WinIcon, Combo or Round — no real file combines them", () => {
    expect(isKnownSectionName("Simul Powerbar")).toBe(false);
    expect(isKnownSectionName("Simul Time")).toBe(false);
    expect(isKnownSectionName("Simul WinIcon")).toBe(false);
    expect(isKnownSectionName("Simul Combo")).toBe(false);
    expect(isKnownSectionName("Simul Round")).toBe(false);
  });

  it("still recognizes the existing MUGEN-style per-player patterns unchanged (no regression)", () => {
    expect(isKnownSectionName("P1 Life Bar")).toBe(true);
    expect(isKnownSectionName("P2 Power Bar")).toBe(true);
    expect(isKnownSectionName("P1 Face")).toBe(true);
    expect(isKnownSectionName("P2 Name")).toBe(true);
    expect(isKnownSectionName("P1 Win Icons")).toBe(true);
    expect(isKnownSectionName("Round Time")).toBe(true);
  });
});
