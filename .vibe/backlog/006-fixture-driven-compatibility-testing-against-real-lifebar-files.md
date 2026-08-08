---
status: todo
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
None.
