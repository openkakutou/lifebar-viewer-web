import path from "node:path";
import { waitForVisualReady } from "@openkakutou/web-ui-kit/testing/visual-preset";
import { expect, test } from "@playwright/test";

/**
 * Visual-regression baselines for the elements panel's live composite
 * preview (backlog item 012) -- driven against a real, purpose-authored
 * lifebar fixture loaded through the app's real folder-picker input, with
 * sprites decoded through the real `sff` WASM bridge. See
 * .vibe/decisions/010-visual-regression-fixture-uses-real-sprite-decode.md
 * for why the fixture pairs a synthetic `.def` with the project's existing
 * real `.sff` fixture, and
 * .vibe/decisions/011-visual-regression-served-via-vite-dev-not-build-preview.md
 * for why the app is served via the plain dev server rather than a build.
 */

// A real folder (fight.def + a byte-for-byte copy of the project's
// existing real v1-basic.sff sprite fixture -- see fight.def's own header
// comment and .vibe/decisions/010) uploaded via Playwright's
// directory-upload support, since the real app only accepts a folder
// through its `<input webkitdirectory>` picker, not an arbitrary file list.
const lifebarPackDir = path.resolve(
  import.meta.dirname,
  "fixtures",
  "lifebar-pack",
);

const PREVIEW_SELECTOR = ".elements-panel__preview";

/**
 * Loads the fixture lifebar pack through the real folder picker, then waits
 * for the composite preview to have actually drawn real decoded sprite
 * pixels -- the sprite sheet's async decode-and-draw isn't otherwise
 * observable from the DOM/status text alone. Scans the whole canvas for any
 * non-transparent pixel rather than checking one hardcoded coordinate, so
 * this readiness wait stays valid regardless of where a (possibly
 * regressed) layout actually draws.
 */
async function loadFixtureLifebar(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.setInputFiles("#lifebar-folder-picker", lifebarPackDir);
  await expect(page.getByRole("status")).toContainText("Sprite sheet:");
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        "canvas.elements-panel__canvas",
      );
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return false;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) return true;
      }
      return false;
    },
    undefined,
    { timeout: 10_000 },
  );
}

test.describe("elements panel composite preview", () => {
  test("matches its baseline at rest (default simulated values)", async ({
    page,
  }) => {
    await loadFixtureLifebar(page);
    await waitForVisualReady(page);

    await expect(page.locator(PREVIEW_SELECTOR)).toHaveScreenshot(
      "preview-at-rest.png",
    );
  });

  test("matches its baseline after driving simulated values, with diagnostic overlays visible", async ({
    page,
  }) => {
    await loadFixtureLifebar(page);

    // Section order in the fixture (Files=0, P1 Life=1, P2 Life=2, P1
    // Power=3, P2 Power=4, Combo=5) gives these slot keys -- see
    // src/simulation/simulated-values.ts's `detectSimulatableSlots`.
    const driven: Record<string, string> = {
      "life-1": "35",
      "life-2": "80",
      "power-3": "60",
      "power-4": "15",
      "combo-5": "12",
    };
    for (const [slotKey, value] of Object.entries(driven)) {
      const input = page.locator(
        `input[type="number"][data-slot-key="${slotKey}"]`,
      );
      await input.fill(value);
      await expect(input).toHaveValue(value);
    }

    await waitForVisualReady(page);

    await expect(page.locator(PREVIEW_SELECTOR)).toHaveScreenshot(
      "preview-with-simulated-values.png",
    );
  });
});
