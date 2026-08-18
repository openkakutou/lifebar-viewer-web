import { beforeEach, describe, expect, it } from "vitest";
import {
  getLifebarDocument,
  resetLifebarDocumentForTests,
  setLifebarDocument,
} from "./lifebar-document-store.ts";

describe("lifebar document store", () => {
  beforeEach(() => {
    resetLifebarDocumentForTests();
  });

  it("has no loaded document before anything is set", () => {
    expect(getLifebarDocument()).toBeNull();
  });

  it("returns exactly what was set", () => {
    const loaded = {
      fileName: "fight.def",
      document: { sections: [] },
      warnings: ['line 4: unrecognized section "Debug" skipped.'],
    };

    setLifebarDocument(loaded);

    expect(getLifebarDocument()).toEqual(loaded);
  });

  it("clears back to null when set to null", () => {
    setLifebarDocument({
      fileName: "fight.def",
      document: { sections: [] },
      warnings: [],
    });

    setLifebarDocument(null);

    expect(getLifebarDocument()).toBeNull();
  });
});
