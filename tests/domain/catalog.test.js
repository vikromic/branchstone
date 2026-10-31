import { describe, expect, it } from "vitest";
import {
  catalogStatsFor,
  collections,
  normalizeArtworkId,
  normalizeCollection,
} from "../../src/domain/catalog.js";

describe("catalog rules", () => {
  it("counts availability from explicit sold and highlighted flags", () => {
    expect(catalogStatsFor([
      { sold: false, highlighted: true },
      { sold: true, highlighted: true },
      { sold: false, highlighted: false },
      { sold: true, highlighted: false },
    ])).toEqual({ total: 4, available: 2, collected: 2, highlightedAvailable: 1 });
    expect(catalogStatsFor([])).toEqual({ total: 0, available: 0, collected: 0, highlightedAvailable: 0 });
  });

  it("normalizes both published and accidental legacy artwork ids", () => {
    expect(normalizeArtworkId("artwork-july-pines")).toBe("july-pines");
    expect(normalizeArtworkId("mermaids-dream")).toBe("mermaid-s-dream");
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
