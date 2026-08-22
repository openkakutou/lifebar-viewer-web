# Module: app
**Role:** Application entry point — mounts the root frame into the DOM, built on the shared `web-ui-kit` design system, with a fallback error state if the design tokens stylesheet fails to load. The frame's `<main>` region hosts the lifebar folder input (which also resolves the lifebar's sprite sheet) and the elements panel. Owns the elements panel's selection object, re-rendering the panel (with that same object) after either the lifebar document or the sprite sheet store changes.
**Files:** `src/main.ts`, `src/style.css`, `src/version.ts`
**Exports:** `appVersion: string`, `renderApp(root, version, options?)`, `designTokensLoaded(target?): boolean`, `RenderAppOptions`
**Depends on:** `@openkakutou/web-ui-kit` (external), `modules/input.md`, `modules/document.md`, `modules/elements.md`
