# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Users can now simulate life, power, and combo count values with sliders (paired with numeric inputs for precise entry) to see how a loaded lifebar's elements react, without a real match running. A slider only appears for a value the loaded lifebar actually defines, and out-of-range or invalid entries clamp to a valid value instead of showing a broken state.
- The lifebar parser is now validated against real MUGEN and Ikemen GO community lifebar files, not just hand-written test data — confirming it correctly reads a real file's actual position and text data, gracefully reports the real-world sections it doesn't yet recognize instead of failing, and degrades to a clear error rather than crashing on a truncated or corrupted file.

### Fixed

- Fixed a loaded lifebar pack showing no sprites at all when its folder contains more than one sprite sheet file (a real-world pack shape: a main sheet plus a separate effects sheet). The app now reads which one the lifebar file itself declares as its sprite sheet and loads that one automatically, instead of giving up.
- Fixed most real-world lifebar files failing to load at all with a parse error. Real lifebar files commonly include content the app doesn't model (embedded decorative animations, free-form credits banners); that content is now correctly ignored instead of blocking the whole file from loading.

## [0.5.0] - 2026-08-23

### Added

- Users can now see a live preview of a loaded lifebar: every recognized element (life bar, power bar, face, name, win icons, match wins, round time, round display, combo) is listed, and selecting one highlights its exact region in the preview. Elements are drawn at their real configured position using the resolved sprite sheet. An element that needs a sprite sheet not loaded yet, or that references a sprite the loaded sheet doesn't actually have, is clearly marked rather than showing a broken image, and a lifebar with no recognized elements shows a clear message instead of an empty panel.

## [0.4.0] - 2026-08-19

### Added

- The sprite sheet a loaded lifebar references is now decoded automatically from the same folder — no separate upload step. Its decoded sprites are available for the elements panel to display. A missing sprite sheet WASM build or a corrupt sprite sheet shows a clear message instead of failing silently, without blocking the lifebar itself from loading.

## [0.3.0] - 2026-08-18

### Added

- Users can now load a lifebar by selecting or dropping the folder it's distributed in. If the folder contains exactly one lifebar file, it loads automatically; if it contains several, you're asked which one to load. Both MUGEN and Ikemen GO lifebar files are supported, malformed files show a clear error, and any section this app doesn't yet recognize is skipped with a warning instead of blocking the load.

## [0.2.0] - 2026-08-16

### Added

- The app now uses the shared OpenKakutou design system for its layout and styling, with a visible error message shown instead of a blank page if the design assets fail to load.

[Unreleased]: https://github.com/openkakutou/lifebar-viewer-web/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/openkakutou/lifebar-viewer-web/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/openkakutou/lifebar-viewer-web/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/openkakutou/lifebar-viewer-web/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/openkakutou/lifebar-viewer-web/releases/tag/v0.2.0
