# lifebar-viewer-web

A static web page to visualize and preview a [OpenKakutou](https://github.com/openkakutou) (MUGEN/Ikemen GO-compatible) lifebar: the health bar, power bar, combo counter, and round display UI a match uses, so a lifebar's construction can be checked without running a real match. It parses the lifebar `.def`-style format directly in this app, and decodes referenced sprite sheets via the [`sff`](https://github.com/openkakutou/sff) WebAssembly module.

<!-- vibe:begin:features -->
This project is in early-stage development — only the project scaffold exists so far, no functionality yet.

Planned:

- Parse a lifebar's `.def`-style format, MUGEN and Ikemen GO compatible
- Decode the sprite sheets a lifebar references via the `sff` WebAssembly build
- An elements panel listing every configured element (life bar, power bar, combo counter, round display, etc.)
- A live visual preview renderer using resolved sprites
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
No additional documentation yet.
<!-- vibe:end:docs-index -->
