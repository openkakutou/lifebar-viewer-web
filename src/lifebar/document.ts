// The lifebar `.def`-style file's data model, kept deliberately generic and
// unevaluated for the sections this app recognizes — an ordered list of
// sections, each an ordered list of raw key/value entries — rather than
// typed fields for every known MUGEN/Ikemen GO key. Independent from
// `lifebar-editor`'s own separate parser/model for the same format, per
// roadmap decision `009`. See
// .vibe/decisions/002-folder-only-input-and-warn-on-unrecognized-sections.md
// for why an *unrecognized* section is warned about and excluded here,
// unlike `lifebar-editor`'s silent-retain-everything choice.

/** One `key = value` line within a section, in original casing, unevaluated. */
export interface LifebarEntry {
  key: string;
  value: string;
  /** 1-indexed source line this entry was read from. */
  line: number;
}

/** One `[Section Name]` block and the entries found inside it, in file order. */
export interface LifebarSection {
  name: string;
  entries: LifebarEntry[];
  /** 1-indexed source line the section's own header was read from. */
  line: number;
}

/**
 * A parsed lifebar file: every *recognized* section, in the order they
 * appeared. Sections whose name matches none of this app's known families
 * are excluded here and surfaced instead as a parse warning.
 */
export interface LifebarDocument {
  sections: LifebarSection[];
}
