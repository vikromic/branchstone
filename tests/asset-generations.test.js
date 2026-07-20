import { describe, expect, it } from "vitest";
import {
  parseAssetGenerationManifest,
  selectPreviousAssetGeneration,
} from "../scripts/asset-generations.mjs";

describe("published asset generations", () => {
  it("preserves the real previous generation across an identical local republish", () => {
    expect(selectPreviousAssetGeneration(
      ["current.js", "current.css"],
      { current: ["current.css", "current.js"], previous: ["previous.js"] },
    )).toEqual(["previous.js"]);
  });

  it("advances the published current generation when staged assets change", () => {
    expect(selectPreviousAssetGeneration(
      ["next.js"],
      { current: ["current.js"], previous: ["previous.js"] },
    )).toEqual(["current.js"]);
  });

  it.each(["", ".", "..", "nested/file.js", "nested\\file.js", ".branchstone-generations.json"])(
    "rejects unsafe manifest entry %j",
    (entry) => {
      expect(() => parseAssetGenerationManifest(JSON.stringify({
        version: 1,
        current: [entry],
        previous: [],
      }))).toThrow();
    },
  );
});
