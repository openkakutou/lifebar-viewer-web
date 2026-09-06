import "@openkakutou/web-ui-kit/tokens.css";
import "@openkakutou/web-ui-kit";
import "./style.css";
import type { WuikLocaleSwitcherElement } from "@openkakutou/web-ui-kit";
import {
  getLifebarDocument,
  setLifebarDocument,
} from "./document/lifebar-document-store.ts";
import {
  getSffSpriteSheet,
  setSffSpriteSheet,
} from "./document/sff-sprite-sheet-store.ts";
import { renderElementsPanel } from "./elements/elements-panel.ts";
import { getI18n, initAppI18n, onLocaleChange, t } from "./i18n/i18n.ts";
import { renderLifebarFolderInput } from "./input/lifebar-folder-input-view.ts";
import {
  defaultSimulatedValue,
  detectSimulatableSlots,
} from "./simulation/simulated-values.ts";
import { renderSimulationControls } from "./simulation/simulation-controls.ts";
import { appVersion } from "./version.ts";

// The app's own brand name -- a proper noun, deliberately never translated
// (see .vibe/decisions/007-i18n-integration-approach.md).
const APP_TITLE = "Lifebar Viewer";

/**
 * A design token only `web-ui-kit`'s tokens stylesheet defines. Its
 * presence on the given element is used as a proxy for "the stylesheet
 * actually loaded" — if the linked CSS asset 404s or otherwise fails at
 * runtime, this custom property resolves to nothing.
 */
const TOKEN_PROBE = "--wuik-color-bg";

/**
 * Checks whether `web-ui-kit`'s design tokens stylesheet actually applied
 * to `target`, by probing a known custom property it defines. No load/error
 * event listener is needed: the browser blocks a `<script type="module">`'s
 * execution until a preceding `<link rel="stylesheet">` has settled (loaded
 * or failed), so by the time this module runs the stylesheet has already
 * resolved one way or the other — see
 * .vibe/decisions/001-web-ui-kit-scaffold-adoption-and-token-failure-detection.md.
 */
export function designTokensLoaded(
  target: Element = document.documentElement,
): boolean {
  return getComputedStyle(target).getPropertyValue(TOKEN_PROBE).trim() !== "";
}

export interface RenderAppOptions {
  /** Overridable for testing; defaults to the real stylesheet probe. */
  designTokensLoaded?: () => boolean;
}

// `renderApp` is only ever really invoked once per page (from `mount()`),
// but tests call it repeatedly on the same or a fresh root -- torn down at
// the top of every call, before a fresh one is made, so a locale-change
// subscription from a previous call never accumulates or fires against
// content no longer on the page. Mirrors `lifebar-editor`'s own
// replace-not-accumulate handling of a render-owned live subscription.
let currentUnsubscribeLocaleChange: (() => void) | undefined;

/**
 * Builds the app's root frame — a `web-ui-kit` `<wuik-app-shell>` with the
 * app title (plus version) in the toolbar and the lifebar folder input as
 * `<main>` content. Once a lifebar loads, its sprite sheet (item 003) is
 * auto-resolved from the same folder — see
 * .vibe/decisions/003-sprite-sheet-resolved-from-the-same-folder-no-separate-picker.md.
 * No sidebar content is slotted yet: no other screen exists in this repo
 * yet to navigate to — see
 * .vibe/decisions/001-web-ui-kit-scaffold-adoption-and-token-failure-detection.md.
 *
 * If the design tokens stylesheet failed to load at runtime, the shell is
 * not mounted at all — it depends on those same tokens for its own layout
 * and would render broken/unstyled — and a plain, dependency-free error
 * message is shown instead, so the page is never blank.
 */
export function renderApp(
  root: HTMLElement,
  version: string,
  options: RenderAppOptions = {},
): void {
  currentUnsubscribeLocaleChange?.();
  currentUnsubscribeLocaleChange = undefined;
  root.replaceChildren();
  document.title = `${APP_TITLE} — v${version}`;

  const tokensLoaded = options.designTokensLoaded ?? designTokensLoaded;
  if (!tokensLoaded()) {
    renderDesignTokensError(root);
    currentUnsubscribeLocaleChange = onLocaleChange(() =>
      renderDesignTokensError(root),
    );
    return;
  }

  const shell = document.createElement("wuik-app-shell");

  const toolbar = document.createElement("wuik-toolbar");
  toolbar.slot = "toolbar";
  toolbar.setAttribute("role", "banner");
  const title = document.createElement("span");
  title.className = "app-title";
  title.textContent = `${APP_TITLE} — v${version}`;
  toolbar.appendChild(title);

  const localeSwitcher = document.createElement(
    "wuik-locale-switcher",
  ) as unknown as WuikLocaleSwitcherElement;
  localeSwitcher.className = "locale-switcher";
  localeSwitcher.setAttribute("label", t("app.languageLabel", "Language"));
  localeSwitcher.i18n = getI18n();
  toolbar.appendChild(localeSwitcher);

  shell.appendChild(toolbar);

  const main = document.createElement("main");
  shell.appendChild(main);

  const simulationSection = document.createElement("div");
  const elementsSection = document.createElement("div");
  // Persisted across re-renders (not recreated per call) so a selected
  // element stays selected once the sprite sheet resolves and the preview
  // re-renders with real sprites -- see elements-panel.ts's own
  // ElementsPanelOptions.selection.
  const elementSelection: { index: number | null } = { index: null };
  // Simulated values (backlog item 005) persist across re-renders the same
  // way -- loading a new sprite sheet, or any other reason the elements
  // panel re-renders, must never reset a value the user already set. Keyed
  // by SimulatableSlot.key; a slot with no entry yet shows no overlay,
  // never a default the user didn't actually choose.
  const simulatedValues: Record<string, number> = {};
  const refreshElementsPanel = (): void => {
    renderElementsPanel(
      elementsSection,
      getLifebarDocument()?.document ?? null,
      getSffSpriteSheet()?.spriteGroups ?? null,
      getSffSpriteSheet()?.sffBytes ?? null,
      { selection: elementSelection, simulatedValues },
    );
  };
  const refreshSimulationControls = (): void => {
    renderSimulationControls(
      simulationSection,
      getLifebarDocument()?.document ?? null,
      simulatedValues,
      (key, value) => {
        simulatedValues[key] = value;
        refreshElementsPanel();
      },
    );
  };

  renderLifebarFolderInput(main, {
    onLoaded: ({ document: parsedDocument, fileName, warnings }) => {
      setLifebarDocument({ fileName, document: parsedDocument, warnings });
      // A freshly-loaded file starts every simulatable slot at its own
      // default (life/power full, combo zero) so the controls and the
      // preview overlay agree from the very first render -- never a
      // slider reading 100 next to a preview with no overlay yet, which
      // would only resolve once the user first touches something.
      for (const key of Object.keys(simulatedValues)) {
        delete simulatedValues[key];
      }
      for (const slot of detectSimulatableSlots(parsedDocument)) {
        simulatedValues[slot.key] = defaultSimulatedValue(slot.kind);
      }
      refreshSimulationControls();
      refreshElementsPanel();
    },
    onSpriteSheetResolved: (result) => {
      if (result.status === "success") {
        setSffSpriteSheet({
          fileName: result.fileName,
          sffBytes: result.sffBytes,
          spriteGroups: result.spriteGroups,
        });
      } else {
        setSffSpriteSheet(null);
      }
      refreshElementsPanel();
    },
  });
  main.append(simulationSection, elementsSection);

  root.appendChild(shell);

  // Live locale switching (backlog item 008): re-renders the elements
  // panel and simulation controls -- through the same refresh closures
  // every ordinary data change already uses, so the current element
  // selection and simulated values survive untouched -- plus the
  // switcher's own translated accessible label. The folder-input view
  // handles its own currently-displayed text separately, internally (see
  // lifebar-folder-input-view.ts).
  currentUnsubscribeLocaleChange = onLocaleChange(() => {
    localeSwitcher.setAttribute("label", t("app.languageLabel", "Language"));
    refreshSimulationControls();
    refreshElementsPanel();
  });
}

/**
 * Deliberately styled with no `web-ui-kit` tokens or custom elements: this
 * renders exactly in the scenario where those failed to load, so it must
 * stay visible without depending on them. Re-invoked (replacing its own
 * previous content) on a locale change, so its text stays live too even
 * though no `<wuik-locale-switcher>` is available in this degraded state --
 * the browser-detected/persisted locale still applies via `t()`.
 */
function renderDesignTokensError(root: HTMLElement): void {
  root.replaceChildren();

  const container = document.createElement("div");
  container.className = "design-tokens-error";

  const heading = document.createElement("h1");
  heading.textContent = t(
    "errors.designTokensFailedHeading",
    "{{title}} failed to load",
    {
      title: APP_TITLE,
    },
  );
  container.appendChild(heading);

  const body = document.createElement("p");
  body.textContent = t(
    "errors.designTokensFailedBody",
    "The design system's tokens stylesheet didn't load. Try reloading the page; if this keeps happening, please report it.",
  );
  container.appendChild(body);

  root.appendChild(container);
}

/**
 * The built `<script type="module">` tag is emitted before the tokens
 * `<link rel="stylesheet">` tag (Vite's own asset injection order) and
 * module scripts aren't parser-blocked by a *following* stylesheet the way
 * classic scripts are — so probing immediately here could race the
 * stylesheet and false-negative while it's still in flight. `window`'s
 * `load` event is spec-guaranteed to fire only after every stylesheet
 * referenced at parse time has settled, so waiting for it (a no-op if it
 * has already fired) makes the probe accurate.
 *
 * `initAppI18n` is awaited here, before the very first `renderApp` call --
 * never inside `renderApp` itself, which stays synchronous so tests can
 * keep calling it directly with deterministic English defaults (see
 * .vibe/decisions/007-i18n-integration-approach.md). This is also why the
 * real app never flashes English before a persisted locale resolves: the
 * first paint already has the right language.
 */
async function mount(): Promise<void> {
  await initAppI18n();
  const app = document.querySelector<HTMLDivElement>("#app");
  if (app) {
    renderApp(app, appVersion);
  }
}

if (document.readyState === "complete") {
  void mount();
} else {
  window.addEventListener("load", () => void mount(), { once: true });
}
