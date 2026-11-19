---
status: todo
---
# Parse lifebars through the shared `lifebar` library

## Description
Roadmap decision `046`: lifebar parsing moves to `openkakutou/lifebar` (Go, WASM). Replace `src/lifebar/` (`parse.ts`, `known-sections.ts`, `document.ts`) with the `lifebar` WASM module; keep this app's warning on unrecognized sections (decision 002) on top of what the library reports.

Blocked until `lifebar` releases its WASM entrypoint (`lifebar` 007) with the features listed below; pin its exact tag (roadmap decisions `016`, `025`) and add this repo to `lifebar`'s release propagation.

🔒 MUST: no regression on any lifebar this repo loads today.

## Acceptance Criteria
- [ ] `src/lifebar/` parsing removed; the app loads lifebars through the `lifebar` WASM module
- [ ] Every existing fixture test still passes
- [ ] Needs `lifebar` 001, 007
