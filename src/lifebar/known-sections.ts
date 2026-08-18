// The top-level lifebar `.def` section-name families this app recognizes
// and knows how to display (life bar, power bar, face, name, win icons,
// match wins, round time, combo — matching this app's own project scope).
// A section whose name matches none of these is excluded from the parsed
// document and reported as a warning instead — see
// .vibe/decisions/002-folder-only-input-and-warn-on-unrecognized-sections.md.
//
// These patterns are a best-effort approximation of the real MUGEN/Ikemen
// GO lifebar format, not yet validated against a real-file corpus — that
// hardening is backlog item 006 (fixture-driven compatibility testing),
// deliberately deferred rather than blocking this item.
const KNOWN_SECTION_PATTERNS: RegExp[] = [
  /^files$/,
  /^p[12]\s*life\s*bar$/,
  /^p[12]\s*power\s*bar$/,
  /^p[12]\s*face$/,
  /^p[12]\s*name$/,
  /^p[12]\s*win\s*icons?$/,
  /^match\s*wins?$/,
  /^round\s*time$/,
  /^round(\s*display)?$/,
  /^combo(\s*display|\s*counter)?$/,
];

/**
 * Whether `name` (a section's raw `[Section Name]` text) matches one of
 * this app's known section-name families, case-insensitively and
 * tolerating extra inner whitespace (real files vary on both).
 */
export function isKnownSectionName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (normalized === "") return false;
  return KNOWN_SECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}
