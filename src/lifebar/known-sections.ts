// The top-level lifebar `.def` section-name families this app recognizes
// and knows how to display (life bar, power bar, face, name, win icons,
// match wins, round time, combo — matching this app's own project scope).
// A section whose name matches none of these is excluded from the parsed
// document and reported as a warning instead — see
// .vibe/decisions/002-folder-only-input-and-warn-on-unrecognized-sections.md.
//
// Two naming conventions are recognized side by side, both real:
// - The classic MUGEN per-player convention (`P1 Life Bar`, `P2 Power
//   Bar`, ...).
// - The modern, generic Ikemen GO convention real lifebar packs actually
//   use (`Lifebar`, `Powerbar`, `Face`, `Name`, `Time`, `WinIcon`),
//   confirmed against five independent real packs (backlog item 010).
//
// A mode-variant prefix (`Simul`, `Turns`, `Tag`, and numbered forms
// `Simul_3P`, `Simul_4P`, `Tag_3P`, `Tag_4P`) is recognized only ahead of
// `Lifebar`, `Face` and `Name` — never `Powerbar`, `Time` or `WinIcon` —
// because that is what every sampled real file does; see
// .vibe/decisions/006-ikemen-go-mode-prefix-scoped-to-per-team-families-only.md.
const MODE_VARIANT_PREFIX = "(?:(?:simul|turns|tag)(?:_[34]p)?\\s+)?";

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
  new RegExp(`^${MODE_VARIANT_PREFIX}lifebar$`),
  /^powerbar$/,
  new RegExp(`^${MODE_VARIANT_PREFIX}face$`),
  new RegExp(`^${MODE_VARIANT_PREFIX}name$`),
  /^time$/,
  /^winicon$/,
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
