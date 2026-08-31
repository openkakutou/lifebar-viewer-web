// Parses MUGEN/Ikemen GO lifebar `.def`-style text (e.g. `fight.def`) into
// a LifebarDocument. Independent from `lifebar-editor`'s own separate
// parser for the same format, per roadmap decision 009. See
// .vibe/decisions/002-folder-only-input-and-warn-on-unrecognized-sections.md
// for the malformed-vs-unrecognized distinction this implements: only a
// *recognized* section name (known-sections.ts) ends up in the returned
// document — an unrecognized one is skipped and reported as a warning
// instead. That "skip, don't block" precedent extends to a line's own
// shape too: a non-blank, non-comment, non-header line that isn't a valid
// `key = value` pair is a parse error only when it's inside a *recognized*
// section — real files routinely carry content this app doesn't model at
// all outside one (embedded MUGEN AIR-style animation blocks, free-form
// banner/credits text before the first header, …), and that content is
// quietly ignored rather than blocking the whole file's load.
import type {
  LifebarDocument,
  LifebarEntry,
  LifebarSection,
} from "./document.ts";
import { isKnownSectionName } from "./known-sections.ts";

export type LifebarParseResult =
  | { status: "success"; document: LifebarDocument; warnings: string[] }
  | { status: "error"; message: string };

const SECTION_HEADER = /^\[([^\]]*)\]\s*$/;
const OPEN_BRACKET = /^\[/;
const KEY_VALUE = /^([^=]+?)\s*=\s*(.*)$/;

/** Strips a `;` comment (whole-line or trailing) and surrounding whitespace. */
function stripComment(rawLine: string): string {
  const commentIndex = rawLine.indexOf(";");
  const withoutComment =
    commentIndex === -1 ? rawLine : rawLine.slice(0, commentIndex);
  return withoutComment.trim();
}

/**
 * Parses `text` into a LifebarDocument. An empty (or whitespace/comment-only)
 * input returns an explicit empty document, not an error — the same
 * convention `character`'s own `.def`/`.cns`/`.air` parsers already follow.
 */
export function parseLifebar(text: string): LifebarParseResult {
  const rawLines = text.split("\n");
  const sections: LifebarSection[] = [];
  const warnings: string[] = [];
  let current: LifebarSection | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const lineNumber = i + 1;
    const line = stripComment(rawLines[i]);
    if (line === "") continue;

    if (OPEN_BRACKET.test(line)) {
      const headerMatch = line.match(SECTION_HEADER);
      if (!headerMatch) {
        return {
          status: "error",
          message: `line ${lineNumber}: malformed section header (missing closing "]").`,
        };
      }
      const name = headerMatch[1].trim();
      if (isKnownSectionName(name)) {
        current = { name, entries: [], line: lineNumber };
        sections.push(current);
      } else {
        current = null;
        warnings.push(
          `line ${lineNumber}: unrecognized section "${name}" skipped.`,
        );
      }
      continue;
    }

    if (!current) {
      // Not inside a recognized section — either this content precedes any
      // header (a free-form banner/credits line, common in hand-authored
      // files) or belongs to the most recently skipped, unrecognized one
      // (e.g. a MUGEN "[Begin Action N]" embedded AIR-style animation
      // block, whose body lines are raw frame data, not "key = value").
      // Only a *recognized* section's own content is modeled, so anything
      // else here is quietly ignored rather than blocking the whole file's
      // load — the same "skip, don't block" precedent as an unrecognized
      // section itself (see .vibe/decisions/002).
      continue;
    }

    const entryMatch = line.match(KEY_VALUE);
    const key = entryMatch?.[1].trim();
    if (!entryMatch || !key) {
      return {
        status: "error",
        message: `line ${lineNumber}: expected a "key = value" pair inside section "${current.name}", found "${line}".`,
      };
    }

    const entry: LifebarEntry = {
      key,
      value: entryMatch[2].trim(),
      line: lineNumber,
    };
    current.entries.push(entry);
  }

  return { status: "success", document: { sections }, warnings };
}
