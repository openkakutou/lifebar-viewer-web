---
status: done
depends_on: [006]
---
# Recognize Ikemen GO Lifebar Section Names

## Description
`known-sections.ts`'s recognized-section patterns only match the old MUGEN per-player naming (`[P1 Life Bar]`, `[P2 Power Bar]`, …). Real Ikemen GO lifebar packs use a different, modern convention instead — generic, non-player-prefixed section names — so almost none of a real Ikemen GO file's actual content is currently recognized, leaving the preview looking nearly empty even on a file that loads successfully.

## Acceptance Criteria
- [ ] `[Lifebar]`, `[Powerbar]`, `[Face]`, `[Name]`, `[Time]`, `[WinIcon]` are recognized as known sections (in addition to the existing MUGEN-style patterns, not replacing them — both conventions must keep working)
- [ ] The common mode-variant prefixes seen in real files (`Simul`, `Turns`, `Tag`, and numbered variants like `Simul_3P`, `Simul_4P`) are also recognized for these same section families, e.g. `[Simul Lifebar]`, `[Turns Lifebar]`, `[Tag Lifebar]`
- [ ] Re-parsing the real "VHD" pack (`/home/neolao/workspace/ikemen-quick-versus/lifebars/VHD/fight.def`) recognizes all of `Files`, `Lifebar`, `Powerbar`, `Face`, `Name`, `Time`, `Combo`, `Round`, `WinIcon` (currently only `Files`, `Combo`, `Round` are recognized — 3 of 17 real top-level sections)
- [ ] Existing MUGEN-style fixtures (`[P1 Life Bar]`, etc.) still parse exactly as before — no regression

## Notes
Concrete real-file evidence (2026-08-31), from grepping the top-level section headers of five different real Ikemen GO lifebar packs under `/home/neolao/workspace/ikemen-quick-versus/lifebars/` (VHD, DBFZ, Citrix, SFZ3, GMS) — every one of them uses this same modern naming, none use the old `P1`/`P2`-prefixed MUGEN style:

```
[Info] [Files] [FightFx] [Lifebar] [Simul Lifebar] [Turns Lifebar] [Powerbar]
[Face] [Simul Face] [Turns Face] [Name] [Simul Name] [Turns Name] [Time]
[Combo] [Round] [WinIcon]
```

(GMS additionally has `[Tag Lifebar]`, `[Simul_3P Lifebar]`, `[Simul_4P Lifebar]`, `[Tag_3P Lifebar]`, `[Tag_4P Lifebar]` — the numbered/tag variants.)

This item is deliberately scoped to *name recognition only* (a `known-sections.ts` pattern addition). It does **not** cover deriving one element per player out of a single shared section — that's a separate, larger change, tracked as item 011 (which depends on this one).

Sections not addressed here and left unrecognized on purpose (out of this app's current scope, per its own project scope in CLAUDE.md): `[Info]`, `[FightFx]`, and any `[Begin Action N]` embedded animation block (already tolerated as skippable content, not modeled — see `.vibe/decisions/002`, amended).
