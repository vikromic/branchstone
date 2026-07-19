import { describe, expect, it } from "vitest";
import {
  artworkRecords,
  catalogStats,
  collections,
  getCatalog,
  normalizeArtworkId,
  normalizeCollection,
} from "../src/domain/catalog.js";

describe("catalog contract", () => {
  it("keeps the published inventory and availability split", () => {
    expect(catalogStats).toEqual({ total: 32, available: 19, collected: 13, highlightedAvailable: 7 });
  });

  it("uses unique locale-independent artwork ids", () => {
    const ids = artworkRecords.map(({ id }) => id);
    expect(new Set(ids).size).toBe(32);
    expect(ids).toContain("july-pines");
    expect(ids).toContain("mermaid-s-dream");
    expect(ids).not.toContain("mermaids-dream");
    expect(getCatalog("uk").find(({ id }) => id === "july-pines")?.name).not.toBe("July Pines");
  });

  it("normalizes both published and accidental legacy artwork ids", () => {
    expect(normalizeArtworkId("artwork-july-pines")).toBe("july-pines");
    expect(normalizeArtworkId("mermaids-dream")).toBe("mermaid-s-dream");
  });

  it("joins both locales one-to-one through the source image", () => {
    const english = getCatalog("en");
    const ukrainian = getCatalog("uk");
    expect(ukrainian).toHaveLength(english.length);
    expect(ukrainian.map(({ id }) => id)).toEqual(english.map(({ id }) => id));
    expect(ukrainian.map(({ imagePaths }) => imagePaths[0])).toEqual(english.map(({ imagePaths }) => imagePaths[0]));
  });

  it("accepts canonical, display-name and legacy collection aliases", () => {
    expect(collections).toHaveLength(7);
    expect(normalizeCollection("Of Ash and Flowers")).toBe("of-ash-and-flowers");
    expect(normalizeCollection("ofAshAndFlowers")).toBe("of-ash-and-flowers");
    expect(normalizeCollection("the-calm-of-the-forest")).toBe("the-calm-of-the-forest");
    expect(normalizeCollection("Велика Вода")).toBe("deep-ocean");
    expect(normalizeCollection("По її слідах")).toBe("following-her-steps");
    expect(normalizeCollection("Спокій Лісу")).toBe("the-calm-of-the-forest");
    expect(normalizeCollection("<script>alert(1)</script>")).toBe("all");
  });
});
