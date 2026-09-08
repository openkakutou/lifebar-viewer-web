import { describe, expect, it } from "vitest";
import packageJson from "../package.json" with { type: "json" };
import { appVersion } from "./version.ts";

describe("appVersion", () => {
  it("is a non-empty semantic version string", () => {
    expect(appVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("matches package.json's own version field, independently read here", () => {
    expect(appVersion).toBe(packageJson.version);
  });

  it("is not the stale hardcoded value this feature replaces", () => {
    expect(appVersion).not.toBe("0.2.0");
  });
});
