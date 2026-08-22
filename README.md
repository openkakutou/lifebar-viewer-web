# lifebar-viewer-web

A static web page to visualize and preview a [OpenKakutou](https://github.com/openkakutou) (MUGEN/Ikemen GO-compatible) lifebar: the health bar, power bar, combo counter, and round display UI a match uses, so a lifebar's construction can be checked without running a real match. It parses the lifebar `.def`-style format directly in this app, and decodes referenced sprite sheets via the [`sff`](https://github.com/openkakutou/sff) WebAssembly module.

<!-- vibe:begin:features -->
This project is in early-stage development. Available now:

- A styled app shell using the shared OpenKakutou design system, so every screen built from here on looks and behaves consistently with the org's other viewer/editor apps. If the app's visual styling fails to load, a clear error message is shown instead of a blank page.
- Load a lifebar by selecting or dropping the folder it's distributed in — MUGEN and Ikemen GO `.def`-style files are both supported. If the folder has exactly one lifebar file it loads automatically; if it has several, you're asked which one to load. A malformed file shows a clear error, and any section this app doesn't yet recognize is skipped with a warning instead of blocking the load.
- The sprite sheet a loaded lifebar references is decoded automatically from the same folder, no extra step needed. A missing sprite sheet build or a corrupt sprite sheet shows a clear message without blocking the lifebar itself from loading.
- See a live preview of every recognized element (life bar, power bar, face, name, win icons, match wins, round time, round display, combo): each one is listed, drawn at its real configured position using the resolved sprite sheet, and selecting it highlights exactly where it sits in the preview. An element that needs a sprite sheet not loaded yet, or that references a sprite the loaded sheet doesn't have, is clearly marked instead of showing a broken image, and a lifebar with no recognized elements shows a clear message instead of an empty panel.

Planned:

- Live value simulation controls (sliders) to preview life/power/combo values without a real match running
<!-- vibe:end:features -->

<!-- vibe:begin:install -->
Requires [Node.js](https://nodejs.org/) `^20.19.0` or `>=22.12.0`.

```sh
npm install
```

Verify the install worked by running the test suite:

```sh
npm test
```

To update dependencies to their latest allowed versions:

```sh
npm update
```

Download a specific version of the `sff` library's WebAssembly build (needed to decode a lifebar's sprite sheet):

```sh
npm run wasm:download -- v0.2.0
```
<!-- vibe:end:install -->

<!-- vibe:begin:usage -->
Start a local dev server with hot reload:

```sh
npm run dev
```

Build the static site for production (output in `dist/`):

```sh
npm run build
```

Preview a production build locally:

```sh
npm run preview
```

Run the test suite:

```sh
npm test
```

Run the linter/formatter (auto-fixes issues in place):

```sh
npm run lint
```
<!-- vibe:end:usage -->

<!-- vibe:begin:docs-index -->
- [docs/architecture.md](docs/architecture.md) — the app's modules and how loading a lifebar flows through them
- [docs/testing.md](docs/testing.md) — how the test suite is organized and run
<!-- vibe:end:docs-index -->
