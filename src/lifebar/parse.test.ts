import { describe, expect, it } from "vitest";
import { parseLifebar } from "./parse.ts";

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

  it("errors on content that appears before any section header", () => {
    const result = parseLifebar("pos = 0,0\n[Files]");

    expect(result).toEqual({
      status: "error",
      message:
        'line 1: content appears before any "[Section Name]" header: "pos = 0,0".',
    });
  });

  it("errors on a line that is neither a section header nor a key/value pair", () => {
    const result = parseLifebar("[Files]\nnot a key value line");

    expect(result).toEqual({
      status: "error",
      message:
        'line 2: expected a "[Section Name]" header or a "key = value" pair, found "not a key value line".',
    });
  });
});
