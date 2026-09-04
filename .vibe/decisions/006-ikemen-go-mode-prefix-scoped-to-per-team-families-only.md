---
date: 2026-09-04
status: accepted
---
# Ikemen GO mode-variant prefixes recognized only for Lifebar/Face/Name, not Powerbar/Time/WinIcon

**Context:** Backlog item 010 adds recognition for Ikemen GO's modern, non-player-prefixed section names (`Lifebar`, `Powerbar`, `Face`, `Name`, `Time`, `WinIcon`) plus common mode-variant prefixes (`Simul`, `Turns`, `Tag`, and numbered forms `Simul_3P`, `Simul_4P`, `Tag_3P`, `Tag_4P`) seen in real files.

**Decision:** The mode-variant prefix is only recognized ahead of `Lifebar`, `Face`, and `Name` (e.g. `Simul Lifebar`, `Tag_3P Face`). `Powerbar`, `Time`, and `WinIcon` are recognized only in their bare, unprefixed form.

**Reason:** Grepping the top-level section headers of five independent real Ikemen GO packs (VHD, Citrix, DBFZ, SFZ3, GMS) found the mode-variant prefix combined with `Lifebar`/`Face`/`Name` dozens of times, but never once combined with `Powerbar`, `Time`, or `WinIcon` — those three stay shared/global even in packs that otherwise fully support Simul/Turns/Tag modes. Scoping the pattern to what real files actually do keeps the recognizer evidence-based rather than speculative, consistent with this project's fixture-driven compatibility approach (item 006).

**Rejected alternatives:** Applying the mode-variant prefix uniformly to all six new families (broader reading of the acceptance criteria's "these same section families" wording) — rejected as unfounded speculation with zero supporting evidence across the sampled corpus, and it would silently accept malformed/typoed section names (e.g. a stray `Simul WinIcon`) as if they were a real, intentional Ikemen GO convention.
