import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseLifebar } from "./parse.ts";

const testdataDir = path.resolve(import.meta.dirname, "testdata");
function fixture(name: string): string {
  return readFileSync(path.join(testdataDir, name), "utf-8");
}

describe("parseLifebar", () => {
  it("parses a well-formed MUGEN-style lifebar file into recognized sections", () => {
    const text = [
      "[Files]",
      "font1 = font.def",
      "",
      "[P1 Life Bar]",
      "pos = 27,17",
      "range.x = 0, 165",
    ].join("\n");

    const result = parseLifebar(text);

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("expected success");
    expect(result.document.sections.map((section) => section.name)).toEqual([
      "Files",
      "P1 Life Bar",
    ]);
    expect(result.document.sections[1].entries).toEqual([
      { key: "pos", value: "27,17", line: 5 },
      { key: "range.x", value: "0, 165", line: 6 },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("parses an Ikemen GO file with a recognized section into the same shape", () => {
    const text = [
      "[P2 Power Bar]",
      "; Ikemen GO extension comment",
      "anim = 100",
    ].join("\n");

    const result = parseLifebar(text);

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("expected success");
    expect(result.document.sections).toEqual([
      {
        name: "P2 Power Bar",
        entries: [{ key: "anim", value: "100", line: 3 }],
        line: 1,
      },
    ]);
  });

  it("excludes an unrecognized section from the document and reports it as a warning", () => {
    const text = [
      "[Files]",
      "font1 = font.def",
      "",
      "[Debug Overlay]",
      "enabled = 1",
    ].join("\n");

    const result = parseLifebar(text);

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("expected success");
    expect(result.document.sections.map((section) => section.name)).toEqual([
      "Files",
    ]);
    expect(result.warnings).toEqual([
      'line 4: unrecognized section "Debug Overlay" skipped.',
    ]);
  });

  it("keeps duplicate section names and duplicate keys as separate entries", () => {
    const text = [
      "[P1 Face]",
      "pos = 0,0",
      "pos = 1,1",
      "",
      "[P1 Face]",
      "pos = 2,2",
    ].join("\n");

    const result = parseLifebar(text);

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("expected success");
    expect(result.document.sections).toHaveLength(2);
    expect(result.document.sections[0].entries).toHaveLength(2);
  });

  it("returns an explicit empty document for blank/comment-only input", () => {
    const result = parseLifebar("\n; just a comment\n   \n");

    expect(result).toEqual({
      status: "success",
      document: { sections: [] },
      warnings: [],
    });
  });

  it("errors on a malformed section header missing its closing bracket", () => {
    const result = parseLifebar("[Files\nfont1 = font.def");

    expect(result).toEqual({
      status: "error",
      message: 'line 1: malformed section header (missing closing "]").',
    });
  });

  it("ignores content that appears before any section header instead of erroring, the same as an unrecognized section's own body", () => {
    const result = parseLifebar(
      "============================================\nCredits banner, no leading semicolon\n[Files]\nfont1 = font.def",
    );

    expect(result).toEqual({
      status: "success",
      document: {
        sections: [
          {
            name: "Files",
            line: 3,
            entries: [{ key: "font1", value: "font.def", line: 4 }],
          },
        ],
      },
      warnings: [],
    });
  });

  it("errors on a line that is neither a section header nor a key/value pair inside a recognized section", () => {
    const result = parseLifebar("[Files]\nnot a key value line");

    expect(result).toEqual({
      status: "error",
      message:
        'line 2: expected a "key = value" pair inside section "Files", found "not a key value line".',
    });
  });

  it("ignores non-key=value body lines inside an unrecognized section instead of erroring — the real MUGEN '[Begin Action N]' embedded animation shape", () => {
    const text = [
      "[Files]",
      "sff = fight.sff",
      "",
      "; Gear 1",
      "[Begin Action 170]",
      "11,3, 0,0, 1080, , A, 1,1,0",
      "Interpolate Angle",
      "11,3, 0,0, 1, , A, 1,1,-359",
      "",
      "[P1 Life Bar]",
      "pos = 27,17",
    ].join("\n");

    const result = parseLifebar(text);

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("expected success");
    expect(result.document.sections.map((section) => section.name)).toEqual([
      "Files",
      "P1 Life Bar",
    ]);
    expect(result.warnings).toEqual([
      'line 5: unrecognized section "Begin Action 170" skipped.',
    ]);
  });
});

// Fixture-driven compatibility against real, hand-authored community files
// (backlog item 006) — every test above uses small synthetic text; these
// validate the same parser against real MUGEN/Ikemen GO packs, which carry
// quirks synthetic fixtures don't think to cover. See testdata/README.md
// for what each fixture is and where it came from.
//
// Both real fixtures now recognize the modern, generic Ikemen GO section
// names (`Lifebar`, `Powerbar`, `WinIcon`, and mode-variant forms like
// `Simul_3P Lifebar`) alongside `Files`/`Combo` — backlog item 010 taught
// known-sections.ts this real-world naming convention. `Info`, `FightFx`,
// each embedded `Begin Action N` animation block, and the GMS-only
// `Guardbar`/`Stunbar` families stay unrecognized on purpose (out of this
// app's scope, or — for Guardbar/Stunbar — not part of item 010's scoped
// family list). These shared sections are not yet split per player/team
// (that's backlog item 011, which depends on this one).
describe("parseLifebar — real-file fixtures (item 006)", () => {
  it("parses a real classic-MUGEN-convention pack, asserting its actual recognized structure", () => {
    const result = parseLifebar(fixture("mfj2-classic-mugen-fixture.def"));

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("expected success");

    expect(result.document.sections.map((section) => section.name)).toEqual([
      "Files",
      "Lifebar",
      "Powerbar",
      "Combo",
      "WinIcon",
    ]);

    const files = result.document.sections[0];
    expect(files.line).toBe(10);
    expect(files.entries).toEqual([
      { key: "sff", value: "sff/fight.sff", line: 11 },
      { key: "snd", value: "snd/fight.snd", line: 12 },
      { key: "font1", value: "font/p1power.fnt", line: 13 },
      { key: "font2", value: "font/p2power.fnt", line: 14 },
      { key: "font3", value: "font/14x14.fnt", line: 15 },
      { key: "font4", value: "font/14x14-2.fnt", line: 16 },
      { key: "font5", value: "font/timer.fnt", line: 17 },
      { key: "font6", value: "font/counter.fnt", line: 18 },
      { key: "font7", value: "font/18x18.fnt", line: 19 },
      { key: "font8", value: "font/18x18-2.fnt", line: 20 },
      { key: "fightfx.sff", value: "sff/fightfx.sff", line: 21 },
      { key: "fightfx.air", value: "sff/fightfx.air", line: 22 },
      { key: "common.snd", value: "snd/common.snd", line: 23 },
    ]);

    // The Combo family's real position/text entries — concrete evidence
    // the parser reads actual per-team layout data correctly, not just
    // that it "didn't throw".
    const combo = result.document.sections[3];
    expect(combo.line).toBe(217);
    expect(combo.entries).toEqual([
      { key: "team1.pos", value: "60, 172", line: 219 },
      { key: "team1.start.x", value: "-80", line: 220 },
      { key: "team1.text.font", value: "6,0", line: 221 },
      { key: "team1.text.text", value: "%iH", line: 222 },
      { key: "team1.text.offset", value: "0,0", line: 223 },
      { key: "team1.text.layerno", value: "2", line: 224 },
      { key: "team1.displaytime", value: "90", line: 225 },
      { key: "team2.pos", value: "580, 172", line: 227 },
      { key: "team2.start.x", value: "720", line: 228 },
      { key: "team2.text.font", value: "6,0", line: 229 },
      { key: "team2.text.text", value: "%iH", line: 230 },
      { key: "team2.text.offset", value: "0,0", line: 231 },
      { key: "team2.text.layerno", value: "2", line: 232 },
      { key: "team2.displaytime", value: "90", line: 233 },
    ]);

    // `Info` and each embedded `Begin Action N` animation block stay
    // unrecognized on purpose — out of this app's scope regardless of
    // naming convention.
    expect(result.warnings).toEqual([
      'line 3: unrecognized section "Info" skipped.',
      'line 104: unrecognized section "Begin Action 111" skipped.',
      'line 107: unrecognized section "Begin Action 112" skipped.',
      'line 111: unrecognized section "Begin Action 121" skipped.',
      'line 114: unrecognized section "Begin Action 122" skipped.',
      'line 118: unrecognized section "Begin Action 131" skipped.',
      'line 121: unrecognized section "Begin Action 132" skipped.',
    ]);
  });

  it("parses a real Ikemen GO pack with genuine GO-only extensions, asserting its actual recognized structure", () => {
    const result = parseLifebar(fixture("gms-ikemen-go-fixture.def"));

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("expected success");

    expect(result.document.sections.map((section) => section.name)).toEqual([
      "Files",
      "Lifebar",
      "Simul_3P Lifebar",
      "Powerbar",
      "Combo",
      "WinIcon",
    ]);

    const files = result.document.sections[0];
    expect(files.entries).toEqual([
      { key: "sff", value: "fight.sff", line: 8 },
      { key: "snd", value: "fight.snd", line: 9 },
      { key: "font1", value: "font/font2.fnt", line: 10 },
      { key: "font2", value: "font/timer.fnt", line: 11 },
      { key: "font3", value: "font/round.fnt", line: 12 },
      { key: "font4", value: "font/combo.fnt", line: 13 },
      { key: "font5", value: "font/wincount.fnt", line: 14 },
      { key: "fightfx.sff", value: "fightfx.sff", line: 15 },
      { key: "fightfx.air", value: "fightfx.air", line: 16 },
      { key: "common.snd", value: "common.snd", line: 17 },
      // A real inline `; comment` after the value is stripped like any
      // other — this pack's own "new ikemen fx" note doesn't leak in.
      { key: "fx1", value: "gofx.def", line: 18 },
    ]);

    // Spot-check real per-team position/formatting entries rather than
    // the full 30-entry array — still real values, not synthetic ones.
    const combo = result.document.sections[4];
    expect(combo.line).toBe(214);
    expect(combo.entries).toHaveLength(30);
    expect(combo.entries[0]).toEqual({
      key: "team1.pos",
      value: "10,98",
      line: 215,
    });
    expect(combo.entries).toContainEqual({
      key: "team2.pos",
      value: "309,98",
      line: 231,
    });
    expect(combo.entries).toContainEqual({
      key: "format.decimal.separator",
      value: ".",
      line: 249,
    });

    // `Info`, `FightFx` and the guard-gauge/stun-gauge families
    // (`Guardbar`, `Stunbar`) stay unrecognized on purpose — out of this
    // app's scope (item 010 deliberately doesn't cover them).
    expect(result.warnings).toEqual([
      'line 3: unrecognized section "Info" skipped.',
      'line 21: unrecognized section "FightFx" skipped.',
      'line 268: unrecognized section "Guardbar" skipped.',
      'line 299: unrecognized section "Stunbar" skipped.',
    ]);
  });

  it("parses a real Ikemen GO pack using the modern generic section-naming convention, recognizing every in-scope family (backlog item 010)", () => {
    const result = parseLifebar(fixture("vhd-ikemen-go-fixture.def"));

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("expected success");

    expect(result.document.sections.map((section) => section.name)).toEqual([
      "Files",
      "Lifebar",
      "Simul Lifebar",
      "Turns Lifebar",
      "Powerbar",
      "Face",
      "Simul Face",
      "Turns Face",
      "Name",
      "Simul Name",
      "Turns Name",
      "Time",
      "Combo",
      "Round",
      "WinIcon",
    ]);

    // `Info`, `FightFx` and each embedded `Begin Action N` animation block
    // stay unrecognized on purpose — out of this app's scope.
    expect(result.warnings).toEqual([
      'line 9: unrecognized section "Info" skipped.',
      'line 24: unrecognized section "FightFx" skipped.',
      'line 44: unrecognized section "Begin Action 170" skipped.',
      'line 81: unrecognized section "Begin Action 220" skipped.',
      'line 160: unrecognized section "Begin Action 300" skipped.',
    ]);
  });

  it("errors on a real-world fixture deliberately truncated mid-section-header, the same as a corrupted/interrupted download", () => {
    const result = parseLifebar(fixture("truncated-real-fixture.def"));

    expect(result).toEqual({
      status: "error",
      message: 'line 15: malformed section header (missing closing "]").',
    });
  });
});
