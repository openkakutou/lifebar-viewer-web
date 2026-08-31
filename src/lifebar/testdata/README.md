# testdata

Real-world lifebar `.def`-style fixtures for `parse.test.ts`'s fixture-driven
compatibility suite (backlog item 006). Every other test in this module uses
small hand-typed synthetic text — these three exist specifically to validate
the parser against real, hand-authored community files, which routinely
carry quirks synthetic fixtures don't think to cover (inconsistent
whitespace, mixed line endings, already-garbled comment encoding, sections
this app doesn't model at all).

## Source and license

Trimmed from two real MUGEN/Ikemen GO lifebar packs in a local, personal
reference collection of community screenpacks
(`/home/neolao/workspace/ikemen-quick-versus/lifebars/`), gathered from the
MUGEN/Ikemen GO fan community for compatibility testing. These screenpacks
are informally distributed as freeware within that community with no
attached formal license, the same status as most MUGEN content — the same
caveat already applies to the two real Ikemen GO section names and one
real-file excerpt quoted directly in this repo's own backlog items 010 and
011. Only plain-text structural layout data is vendored here (section
names, numeric positions, sprite/animation index references, font paths) —
no sprite images, fonts, sounds, or other binary assets from either pack
are included, and each file below is trimmed to a small fraction of the
original (see line counts).

- **`mfj2-classic-mugen-fixture.def`** (326 lines, from the `MFJ2` pack's
  `fight.def`, originally ~1500 lines) — the classic MUGEN-compatible
  section-naming convention (`[Lifebar]`, `[Powerbar]`, `[Combo]`,
  `[WinIcon]`, generic non-player-prefixed names with `p1.`/`p2.`-prefixed
  keys inside), no Ikemen-GO-only extensions. Comments in this pack are
  Japanese, and — as found in the file, not introduced here — already
  corrupted to literal Unicode replacement characters (`U+FFFD`) by
  whatever earlier tool re-saved it as UTF-8 from its original encoding;
  the original comment text is unrecoverable, but this is realistic
  real-world noise the parser has to tolerate (it lives entirely in
  comments, which are stripped before parsing either way). Also mixes CRLF
  and LF line endings, unmodified from the source file.
- **`gms-ikemen-go-fixture.def`** (329 lines, from the `GMS` pack's
  `fight.def`, originally ~1800 lines) — the same modern section-naming
  convention, plus genuine Ikemen-GO-only extensions the source file's own
  comments explicitly label as such (`; Ikemen feature`): `[Simul_3P
  Lifebar]` (3-player simultaneous mode — vanilla MUGEN tops out at 2
  players) and the `[Guardbar]`/`[Stunbar]` element families (guard-gauge
  and stun-gauge bars, not part of the original MUGEN format at all).
- **`truncated-real-fixture.def`** (17 lines) — a small excerpt of the GMS
  fixture above, deliberately corrupted (a section header's closing `]` is
  cut off) to simulate a truncated/interrupted download — a real failure
  mode for a file gathered through this app's folder-based input, not
  covered by any existing synthetic fixture in `parse.test.ts`.

Regenerating: re-extract from the source pack's `fight.def` if a scenario
needs a different section; there is no automated extraction tool for these
(unlike `sff`'s `.sff` fixtures, which need one to also produce
byte-for-byte valid binary containers — these are just trimmed plain text).
