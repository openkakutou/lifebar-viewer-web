---
status: todo
depends_on: [002]
---
# Integrate `sff` WASM For Lifebar Sprite Elements

## Description
Lifebar elements reference sprite sheets (e.g. the life bar background, the numeral fonts) in the `.sff` v1/v2 format. Add a bridge to the `sff` WebAssembly module (github.com/openkakutou/sff), loaded client-side, that decodes the sprite groups/images a parsed lifebar (item 002) references, so later screens can render them. This mirrors `character-viewer-web`'s WASM bridge pattern for its own `character` dependency, adapted to `sff`'s narrower sprite-only contract.

## Acceptance Criteria
- [ ] Given a parsed lifebar's sprite references and the matching `.sff` file bytes, the bridge returns decoded sprite data for each referenced group/image
- [ ] The bridge exposes a typed result (success/failure) instead of throwing on decode errors
- [ ] A sprite reference that doesn't exist in the provided `.sff` file surfaces a clear per-element error rather than aborting the whole load
- [ ] A missing or corrupt `.sff` file shows a clear error state instead of crashing the page

## Notes
Cross-repo blocker: requires the `sff` repo's WASM entrypoint/release pipeline item (mirroring `character`'s own `033-wasm-entrypoint-and-release-pipeline.md`) to be released before this can be implemented against a real published build.
