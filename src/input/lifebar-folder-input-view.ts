// DOM component for backlog item 002 (lifebar folder input): folder
// selection is the only input path (a native `<input webkitdirectory>`
// picker plus a drag-and-drop zone), not a single-file picker — see
// .vibe/decisions/002-folder-only-input-and-warn-on-unrecognized-sections.md.
// Every interactive control is a real native element (file input, radio
// inputs, buttons) rather than a custom `role="button"` div, so keyboard
// operability comes for free from the browser, with no bespoke keydown
// handling needed the way a fully synthetic drop zone would require.
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

export interface LifebarFolderInputViewOptions {
  /** Called once a folder's lifebar file has been read and parsed successfully. */
  onLoaded: (result: {
    document: LifebarDocument;
    fileName: string;
    warnings: string[];
  }) => void;
  /** Forwarded to the read/parse layer; injectable for testing. */
  fileOptions?: LifebarFolderInputOptions;
}

type Phase = "idle" | "loading" | "needs-selection" | "done";

function formatSuccessMessage(
  fileName: string,
  document: LifebarDocument,
  warnings: string[],
): string {
  const sectionCount = document.sections.length;
  const sectionWord = sectionCount === 1 ? "section" : "sections";
  let message = `Loaded ${fileName} — ${sectionCount} ${sectionWord} recognized`;
  if (warnings.length > 0) {
    const warningWord = warnings.length === 1 ? "section" : "sections";
    message += `, ${warnings.length} unrecognized ${warningWord} skipped`;
  }
  return `${message}.`;
}

function formatErrorMessage(
  result: Exclude<
    LifebarFolderInputResult,
    { status: "success" | "needs-selection" }
  >,
  source: "picker" | "drop",
): string {
  switch (result.status) {
    case "no-files":
      return source === "drop"
        ? "Couldn't read anything from the dropped folder — your browser may not support folder drag-and-drop here. Try the folder picker button instead."
        : "This folder is empty — pick a folder that contains the lifebar's .def-style file.";
    case "no-candidate":
      return "No .def-style lifebar file found in this folder — expected one like fight.def.";
    case "read-error":
      return `Could not read ${result.fileName}: ${result.message}`;
    case "parse-error":
      return `Could not parse ${result.fileName}: ${result.message}`;
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
  let statusMessage = "";
  let isError = false;
  let lastSource: "picker" | "drop" = "picker";
  let selectedIndex: number | null = null;

  const panel = document.createElement("div");
  panel.className = "lifebar-folder-input";

  const dropZone = document.createElement("div");
  dropZone.className = "lifebar-folder-input__dropzone";

  const label = document.createElement("label");
  label.className = "lifebar-folder-input__label";
  label.htmlFor = "lifebar-folder-picker";
  label.textContent =
    "Select a lifebar folder (containing its .def-style file, e.g. fight.def)";

  const picker = document.createElement("input");
  picker.type = "file";
  picker.id = "lifebar-folder-picker";
  picker.setAttribute("webkitdirectory", "");
  picker.multiple = true;

  const hint = document.createElement("p");
  hint.className = "lifebar-folder-input__hint";
  hint.textContent = "…or drag and drop a lifebar folder here";

  dropZone.append(label, picker, hint);

  const selectionContainer = document.createElement("div");
  selectionContainer.className = "lifebar-folder-input__selection";
  selectionContainer.hidden = true;

  const status = document.createElement("div");
  status.className = "lifebar-folder-input__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "lifebar-folder-input__reset";
  resetButton.dataset.action = "reset";
  resetButton.textContent = "Choose a different folder";
  resetButton.hidden = true;

  panel.append(dropZone, selectionContainer, status, resetButton);
  root.appendChild(panel);

  function render(): void {
    picker.disabled = phase === "loading";
    dropZone.classList.toggle(
      "lifebar-folder-input__dropzone--loading",
      phase === "loading",
    );
    status.classList.toggle("lifebar-folder-input__status--error", isError);
    status.textContent = statusMessage;
    resetButton.hidden = phase === "idle" || phase === "loading";
    selectionContainer.hidden = phase !== "needs-selection";
  }

  function resetToIdle(): void {
    phase = "idle";
    statusMessage = "";
    isError = false;
    selectedIndex = null;
    picker.value = "";
    selectionContainer.replaceChildren();
    render();
  }

  function renderSelection(candidates: GatheredFile[]): void {
    selectionContainer.replaceChildren();
    selectedIndex = null;

    const prompt = document.createElement("p");
    prompt.textContent = "Which file is the lifebar?";

    const group = document.createElement("div");
    group.setAttribute("role", "radiogroup");
    group.setAttribute("aria-label", "Candidate lifebar files");

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.dataset.action = "confirm-selection";
    confirmButton.textContent = "Load selected file";
    confirmButton.disabled = true;

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
        confirmButton.disabled = false;
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
      statusMessage = "Reading…";
      isError = false;
      render();
      void finishLoading(
        loadLifebarFromChosenEntry(chosen, options.fileOptions),
      );
    });

    selectionContainer.append(prompt, group, confirmButton);
  }

  async function finishLoading(
    resultPromise: Promise<LifebarFolderInputResult>,
  ): Promise<void> {
    const result = await resultPromise;

    if (result.status === "success") {
      phase = "done";
      isError = false;
      statusMessage = formatSuccessMessage(
        result.fileName,
        result.document,
        result.warnings,
      );
      render();
      options.onLoaded({
        document: result.document,
        fileName: result.fileName,
        warnings: result.warnings,
      });
      return;
    }

    if (result.status === "needs-selection") {
      phase = "needs-selection";
      isError = false;
      statusMessage = `Found ${result.candidates.length} possible lifebar files — pick which one to load.`;
      renderSelection(result.candidates);
      render();
      return;
    }

    phase = "done";
    isError = true;
    statusMessage = formatErrorMessage(result, lastSource);
    render();
  }

  function handleGathered(
    files: GatheredFile[],
    source: "picker" | "drop",
  ): void {
    lastSource = source;
    phase = "loading";
    statusMessage = "Reading…";
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

  render();
}
