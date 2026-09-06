// DOM component for backlog item 002 (lifebar folder input): folder
// selection is the only input path (a native `<input webkitdirectory>`
// picker plus a drag-and-drop zone), not a single-file picker — see
// .vibe/decisions/002-folder-only-input-and-warn-on-unrecognized-sections.md.
// Every interactive control is a real native element (file input, radio
// inputs) or `web-ui-kit`'s own styled equivalent (`<wuik-button>`) rather
// than a custom `role="button"` div, so keyboard operability comes for
// free from the browser, with no bespoke keydown handling needed the way
// a fully synthetic drop zone would require. The candidate-file radios
// stay native `<input type="radio">` — this kit has no radio-group
// component yet (org-wide UX audit, backlog item 012; tracked there as
// `web-ui-kit` backlog item 014).
import { onLocaleChange, t } from "../i18n/i18n.ts";
import type { LifebarDocument } from "../lifebar/document.ts";
import type { GatheredFile } from "./folder-entries.ts";
import {
  type DataTransferItemLike,
  filesFromDataTransferItems,
  filesFromWebkitDirectoryFiles,
} from "./folder-entries.ts";
import {
  type LifebarFolderInputOptions,
  type LifebarFolderInputResult,
  loadLifebarFromChosenEntry,
  loadLifebarFromFolderFiles,
} from "./lifebar-folder-input.ts";
import {
  type SpriteSheetFolderInputOptions,
  type SpriteSheetFolderResult,
  loadSpriteSheetFromFolderFiles,
} from "./sprite-sheet-folder-input.ts";

export interface LifebarFolderInputViewOptions {
  /** Called once a folder's lifebar file has been read and parsed successfully. */
  onLoaded: (result: {
    document: LifebarDocument;
    fileName: string;
    warnings: string[];
  }) => void;
  /** Forwarded to the read/parse layer; injectable for testing. */
  fileOptions?: LifebarFolderInputOptions;
  /** Called once the lifebar's sprite sheet has been resolved from the same folder (success, none/multiple found, or an error). */
  onSpriteSheetResolved?: (result: SpriteSheetFolderResult) => void;
  /** Forwarded to the sprite-sheet resolution layer; injectable for testing. */
  spriteSheetOptions?: SpriteSheetFolderInputOptions;
}

type Phase = "idle" | "loading" | "needs-selection" | "done";

/**
 * What the main status line currently shows -- a small tagged description
 * of the situation and its raw parameters, not pre-formatted text. Kept as
 * data (not a string) so a locale change can re-format it in the new
 * language without re-running the load/parse that produced it. See
 * .vibe/decisions/007-i18n-integration-approach.md.
 */
type MainStatus =
  | { kind: "reading" }
  | {
      kind: "success";
      fileName: string;
      sectionCount: number;
      warningCount: number;
    }
  | { kind: "needs-selection"; count: number }
  | { kind: "error"; error: MainStatusError };

type MainStatusError =
  | { kind: "no-files-drop" }
  | { kind: "no-files-picker" }
  | { kind: "no-candidate" }
  | { kind: "read-error"; fileName: string; message: string }
  | { kind: "parse-error"; fileName: string; message: string };

type SpriteStatus =
  | { kind: "success"; fileName: string; groupCount: number }
  | { kind: "none-found" }
  | { kind: "multiple-found"; count: number }
  | { kind: "read-error"; fileName: string; message: string }
  | { kind: "setup-error"; message: string }
  | { kind: "parse-error"; fileName: string; message: string };

function sectionWord(count: number): string {
  return count === 1
    ? t("input.sectionWordSingular", "section")
    : t("input.sectionWordPlural", "sections");
}

function groupWord(count: number): string {
  return count === 1
    ? t("input.groupWordSingular", "group")
    : t("input.groupWordPlural", "groups");
}

function formatMainStatusError(error: MainStatusError): string {
  switch (error.kind) {
    case "no-files-drop":
      return t(
        "input.errorNoFilesDrop",
        "Couldn't read anything from the dropped folder — your browser may not support folder drag-and-drop here. Try the folder picker button instead.",
      );
    case "no-files-picker":
      return t(
        "input.errorNoFilesPicker",
        "This folder is empty — pick a folder that contains the lifebar's .def-style file.",
      );
    case "no-candidate":
      return t(
        "input.errorNoCandidate",
        "No .def-style lifebar file found in this folder — expected one like fight.def.",
      );
    case "read-error":
      return t(
        "input.errorReadFile",
        "Could not read {{fileName}}: {{message}}",
        {
          fileName: error.fileName,
          message: error.message,
        },
      );
    case "parse-error":
      return t(
        "input.errorParseFile",
        "Could not parse {{fileName}}: {{message}}",
        { fileName: error.fileName, message: error.message },
      );
  }
}

function formatMainStatus(status: MainStatus | null): string {
  if (status === null) return "";
  switch (status.kind) {
    case "reading":
      return t("input.reading", "Reading…");
    case "success": {
      let message = t(
        "input.success",
        "Loaded {{fileName}} — {{count}} {{word}} recognized",
        {
          fileName: status.fileName,
          count: String(status.sectionCount),
          word: sectionWord(status.sectionCount),
        },
      );
      if (status.warningCount > 0) {
        message += t(
          "input.warningsSuffix",
          ", {{count}} unrecognized {{word}} skipped",
          {
            count: String(status.warningCount),
            word: sectionWord(status.warningCount),
          },
        );
      }
      return `${message}.`;
    }
    case "needs-selection":
      return t(
        "input.needsSelection",
        "Found {{count}} possible lifebar files — pick which one to load.",
        { count: String(status.count) },
      );
    case "error":
      return formatMainStatusError(status.error);
  }
}

function formatSpriteStatus(status: SpriteStatus | null): string {
  if (status === null) return "";
  switch (status.kind) {
    case "success":
      return t(
        "input.spriteSuccess",
        "Sprite sheet: {{fileName}} ({{count}} {{word}}).",
        {
          fileName: status.fileName,
          count: String(status.groupCount),
          word: groupWord(status.groupCount),
        },
      );
    case "none-found":
      return t(
        "input.spriteNoneFound",
        "No sprite sheet found in this folder.",
      );
    case "multiple-found":
      return t(
        "input.spriteMultipleFound",
        "Multiple sprite sheets found ({{count}}) — not resolved.",
        { count: String(status.count) },
      );
    case "read-error":
      return t(
        "input.spriteReadError",
        "Could not read sprite sheet {{fileName}}: {{message}}.",
        { fileName: status.fileName, message: status.message },
      );
    case "setup-error":
      return t(
        "input.spriteSetupError",
        'The sff WASM build isn\'t available ({{message}}). Run "npm run wasm:download -- <version>" to fetch it.',
        { message: status.message },
      );
    case "parse-error":
      return t(
        "input.spriteParseError",
        "Could not parse sprite sheet {{fileName}}: {{message}}.",
        { fileName: status.fileName, message: status.message },
      );
  }
}

function isSpriteSheetError(result: SpriteSheetFolderResult): boolean {
  return (
    result.status === "read-error" ||
    result.status === "setup-error" ||
    result.status === "parse-error"
  );
}

function toMainStatusError(
  result: Exclude<
    LifebarFolderInputResult,
    { status: "success" | "needs-selection" }
  >,
  source: "picker" | "drop",
): MainStatusError {
  switch (result.status) {
    case "no-files":
      return source === "drop"
        ? { kind: "no-files-drop" }
        : { kind: "no-files-picker" };
    case "no-candidate":
      return { kind: "no-candidate" };
    case "read-error":
      return {
        kind: "read-error",
        fileName: result.fileName,
        message: result.message,
      };
    case "parse-error":
      return {
        kind: "parse-error",
        fileName: result.fileName,
        message: result.message,
      };
  }
}

function toSpriteStatus(result: SpriteSheetFolderResult): SpriteStatus {
  switch (result.status) {
    case "success":
      return {
        kind: "success",
        fileName: result.fileName,
        groupCount: result.spriteGroups.length,
      };
    case "none-found":
      return { kind: "none-found" };
    case "multiple-found":
      return { kind: "multiple-found", count: result.candidates.length };
    case "read-error":
      return {
        kind: "read-error",
        fileName: result.fileName,
        message: result.message,
      };
    case "setup-error":
      return { kind: "setup-error", message: result.message };
    case "parse-error":
      return {
        kind: "parse-error",
        fileName: result.fileName,
        message: result.message,
      };
  }
}

/**
 * Renders the folder-based lifebar input into `root`, replacing its
 * previous content.
 */
export function renderLifebarFolderInput(
  root: HTMLElement,
  options: LifebarFolderInputViewOptions,
): void {
  root.replaceChildren();

  let phase: Phase = "idle";
  let mainStatus: MainStatus | null = null;
  let spriteStatus: SpriteStatus | null = null;
  let isError = false;
  let lastSource: "picker" | "drop" = "picker";
  let selectedIndex: number | null = null;
  let lastGatheredFiles: GatheredFile[] = [];
  // The selection screen's own static labels are re-translated in place on
  // a locale change (see the `onLocaleChange` subscription below) without
  // rebuilding the radios themselves, so an in-progress selection and the
  // confirm button's enabled state survive a language switch untouched.
  let selectionPrompt: HTMLParagraphElement | null = null;
  let selectionGroup: HTMLElement | null = null;
  let selectionConfirmButton: HTMLElement | null = null;

  const panel = document.createElement("div");
  panel.className = "lifebar-folder-input";

  const dropZone = document.createElement("div");
  dropZone.className = "lifebar-folder-input__dropzone";

  const label = document.createElement("label");
  label.className = "lifebar-folder-input__label";
  label.htmlFor = "lifebar-folder-picker";

  const picker = document.createElement("input");
  picker.type = "file";
  picker.id = "lifebar-folder-picker";
  picker.setAttribute("webkitdirectory", "");
  picker.multiple = true;

  const hint = document.createElement("p");
  hint.className = "lifebar-folder-input__hint";

  dropZone.append(label, picker, hint);

  const selectionContainer = document.createElement("div");
  selectionContainer.className = "lifebar-folder-input__selection";
  selectionContainer.hidden = true;

  const status = document.createElement("div");
  status.className = "lifebar-folder-input__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const resetButton = document.createElement("wuik-button");
  resetButton.setAttribute("variant", "secondary");
  resetButton.className = "lifebar-folder-input__reset";
  resetButton.dataset.action = "reset";
  resetButton.hidden = true;

  panel.append(dropZone, selectionContainer, status, resetButton);
  root.appendChild(panel);

  function renderStaticText(): void {
    label.textContent = t(
      "input.folderLabel",
      "Select a lifebar folder (containing its .def-style file, e.g. fight.def)",
    );
    hint.textContent = t(
      "input.dropHint",
      "…or drag and drop a lifebar folder here",
    );
    resetButton.textContent = t(
      "input.resetButton",
      "Choose a different folder",
    );
    if (selectionPrompt) {
      selectionPrompt.textContent = t(
        "input.selectionPrompt",
        "Which file is the lifebar?",
      );
    }
    if (selectionGroup) {
      selectionGroup.setAttribute(
        "aria-label",
        t("input.candidateGroupLabel", "Candidate lifebar files"),
      );
    }
    if (selectionConfirmButton) {
      selectionConfirmButton.textContent = t(
        "input.confirmSelection",
        "Load selected file",
      );
    }
  }

  function render(): void {
    picker.disabled = phase === "loading";
    dropZone.classList.toggle(
      "lifebar-folder-input__dropzone--loading",
      phase === "loading",
    );
    status.classList.toggle("lifebar-folder-input__status--error", isError);
    const mainText = formatMainStatus(mainStatus);
    const spriteText = spriteStatus ? formatSpriteStatus(spriteStatus) : "";
    status.textContent = spriteText ? `${mainText} ${spriteText}` : mainText;
    resetButton.hidden = phase === "idle" || phase === "loading";
    selectionContainer.hidden = phase !== "needs-selection";
  }

  function resetToIdle(): void {
    phase = "idle";
    mainStatus = null;
    spriteStatus = null;
    isError = false;
    selectedIndex = null;
    picker.value = "";
    selectionContainer.replaceChildren();
    selectionPrompt = null;
    selectionGroup = null;
    selectionConfirmButton = null;
    render();
  }

  function renderSelection(candidates: GatheredFile[]): void {
    selectionContainer.replaceChildren();
    selectedIndex = null;

    const prompt = document.createElement("p");
    selectionPrompt = prompt;

    const group = document.createElement("div");
    group.setAttribute("role", "radiogroup");
    selectionGroup = group;

    const confirmButton = document.createElement("wuik-button");
    confirmButton.dataset.action = "confirm-selection";
    confirmButton.setAttribute("disabled", "");
    selectionConfirmButton = confirmButton;

    candidates.forEach((candidate, index) => {
      const optionLabel = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "lifebar-candidate";
      input.value = String(index);
      // A jsdom quirk: `.click()` on a radio reliably toggles `.checked`
      // but doesn't reliably synthesize a "change" event under this
      // project's pinned jsdom — read the selection from "click" instead,
      // the same workaround `character-viewer-web`'s animation player uses.
      input.addEventListener("click", () => {
        selectedIndex = index;
        confirmButton.removeAttribute("disabled");
      });
      optionLabel.append(
        input,
        document.createTextNode(` ${candidate.relativePath}`),
      );
      group.appendChild(optionLabel);
    });

    confirmButton.addEventListener("click", () => {
      if (selectedIndex === null) return;
      const chosen = candidates[selectedIndex];
      phase = "loading";
      mainStatus = { kind: "reading" };
      isError = false;
      render();
      void finishLoading(
        loadLifebarFromChosenEntry(chosen, options.fileOptions),
      );
    });

    selectionContainer.append(prompt, group, confirmButton);
    renderStaticText();
  }

  async function finishLoading(
    resultPromise: Promise<LifebarFolderInputResult>,
  ): Promise<void> {
    const result = await resultPromise;

    if (result.status === "success") {
      phase = "done";
      isError = false;
      mainStatus = {
        kind: "success",
        fileName: result.fileName,
        sectionCount: result.document.sections.length,
        warningCount: result.warnings.length,
      };
      render();
      options.onLoaded({
        document: result.document,
        fileName: result.fileName,
        warnings: result.warnings,
      });

      const spriteSheetResult = await loadSpriteSheetFromFolderFiles(
        lastGatheredFiles,
        result.document,
        options.spriteSheetOptions,
      );
      spriteStatus = toSpriteStatus(spriteSheetResult);
      isError = isSpriteSheetError(spriteSheetResult);
      render();
      options.onSpriteSheetResolved?.(spriteSheetResult);
      return;
    }

    if (result.status === "needs-selection") {
      phase = "needs-selection";
      isError = false;
      mainStatus = { kind: "needs-selection", count: result.candidates.length };
      renderSelection(result.candidates);
      render();
      return;
    }

    phase = "done";
    isError = true;
    mainStatus = {
      kind: "error",
      error: toMainStatusError(result, lastSource),
    };
    render();
  }

  function handleGathered(
    files: GatheredFile[],
    source: "picker" | "drop",
  ): void {
    lastSource = source;
    lastGatheredFiles = files;
    phase = "loading";
    mainStatus = { kind: "reading" };
    isError = false;
    render();
    void finishLoading(loadLifebarFromFolderFiles(files, options.fileOptions));
  }

  picker.addEventListener("change", () => {
    const files = picker.files ? Array.from(picker.files) : [];
    handleGathered(filesFromWebkitDirectoryFiles(files), "picker");
  });

  resetButton.addEventListener("click", resetToIdle);

  dropZone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dropZone.classList.add("lifebar-folder-input__dropzone--dragging");
  });
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("lifebar-folder-input__dropzone--dragging");
  });
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("lifebar-folder-input__dropzone--dragging");
    const dataTransfer = (event as DragEvent).dataTransfer as {
      items?: ArrayLike<DataTransferItemLike>;
    } | null;
    const items = dataTransfer?.items ? Array.from(dataTransfer.items) : [];
    void filesFromDataTransferItems(items).then((files) =>
      handleGathered(files, "drop"),
    );
  });

  // This view is only ever mounted once per app session (see
  // main.ts's renderApp), so one subscription for its whole lifetime never
  // accumulates. Re-formats whatever is currently shown (the static
  // chrome, the main/sprite status text, the selection screen's labels)
  // from the state already held above -- never re-running a load/parse --
  // so an in-progress folder selection or radio pick survives untouched.
  onLocaleChange(() => {
    renderStaticText();
    render();
  });

  renderStaticText();
  render();
}
