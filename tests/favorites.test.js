import { describe, expect, it } from "vitest";
import { decodeFavoriteStorage, encodeFavoriteStorage, normalizeFavoriteValues } from "../src/domain/favorites.js";

describe("favorite storage migration", () => {
  it("deduplicates bare and prefixed forms after normalization", () => {
    expect(normalizeFavoriteValues(["july-pines", "artwork-july-pines", "artwork-july-pines"]).known).toEqual(["july-pines"]);
  });

  it("migrates the accidental apostrophe alias and isolates ambiguous corruption", () => {
    expect(normalizeFavoriteValues(["artwork-mermaids-dream", "artwork-", "future-record"])).toEqual({
      known: ["mermaid-s-dream"],
      unknown: ["future-record"],
      corrupted: true,
    });
  });

  it("surfaces and discards invalid JSON or a non-array storage shape", () => {
    expect(decodeFavoriteStorage("{invalid-json")).toEqual({
      known: [], unknown: [], corrupted: true, discard: true,
    });
    expect(decodeFavoriteStorage(JSON.stringify({ favorite: "july-pines" }))).toEqual({
      known: [], unknown: [], corrupted: true, discard: true,
    });
  });

  it("flags invalid array members while preserving valid records", () => {
    expect(decodeFavoriteStorage(JSON.stringify([42, "artwork-july-pines"]))).toEqual({
      known: ["july-pines"], unknown: [], corrupted: true, discard: false,
    });
  });

  it("encodes known ids once while preserving future unknown records", () => {
    expect(JSON.parse(encodeFavoriteStorage(["july-pines"], ["future-record"])))
      .toEqual(["future-record", "artwork-july-pines"]);
  });
});
