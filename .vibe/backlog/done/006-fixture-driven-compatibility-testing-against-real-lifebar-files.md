---
status: done
depends_on: [002]
---
# Fixture-Driven Compatibility Testing Against Real Lifebar Files

## Description
Build a corpus of real-world lifebar `.def`-style files — both MUGEN 1.0/1.1 and Ikemen GO originated — and test the parser (item 002) against them, following the same fixture-driven practice `character` already uses for its own file formats (`roadmap`'s `.vibe/decisions/009` calls out this expectation explicitly for lifebar). This is what actually validates MUGEN/Ikemen GO compatibility, beyond what synthetic unit-test fixtures can cover.

## Acceptance Criteria
- [ ] At least one real MUGEN lifebar file and one real Ikemen GO lifebar file (with its GO-specific extensions) are included as test fixtures and parse successfully
- [ ] Fixture tests assert on the actual parsed structure (element positions, sprite references), not just "it didn't throw"
- [ ] At least one deliberately malformed/edge-case real-world fixture (e.g. missing section, unexpected encoding) is covered and produces the expected error/warning behavior from item 002
- [ ] Fixture files are documented with their origin/license so provenance stays clear

## Notes
**Update (2026-08-31):** the compatibility gap this item anticipated is now confirmed concretely, not just theoretically — real Ikemen GO files (VHD, DBFZ, Citrix, SFZ3, GMS under `/home/neolao/workspace/ikemen-quick-versus/lifebars/`) parse successfully but only recognize 3 of ~17 real top-level sections each, because their section-naming convention and per-section, per-player data layout differ from what this app currently models. Split into two focused items so the two genuinely separate pieces of work (name recognition vs. per-player element derivation) can be picked up independently: [item 010](010-recognize-ikemen-go-lifebar-section-names.md) and [item 011](011-split-shared-ikemen-go-sections-into-per-player-elements.md), which carry the concrete evidence and acceptance criteria. This item remains the umbrella for the broader fixture-corpus/testing practice itself (real MUGEN fixtures too, malformed-fixture coverage, provenance documentation) — 010/011 are the specific compatibility fixes that fixture-driven testing surfaced.
