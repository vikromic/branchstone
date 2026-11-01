import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  artworkRecords,
  catalogStats,
  getCatalog,
} from "../../src/content/artworks.js";
import { streamPrimaryPaths } from "../../src/content/artwork-media.js";

describe("catalog contract", () => {
  it("publishes every catalog record exactly once in the catalog statistics", () => {
    expect(catalogStats.total).toBe(artworkRecords.length);
    expect(catalogStats.available + catalogStats.collected).toBe(catalogStats.total);
  });

  it("uses unique locale-independent artwork ids", () => {
    const ids = artworkRecords.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("july-pines");
    expect(ids).toContain("mermaid-s-dream");
    expect(ids).not.toContain("mermaids-dream");
    expect(getCatalog("uk").find(({ id }) => id === "july-pines")?.name).not.toBe("July Pines");
  });

  it("joins both locales one-to-one through the source image", () => {
    const english = getCatalog("en");
    const ukrainian = getCatalog("uk");
    expect(ukrainian).toHaveLength(english.length);
    expect(ukrainian.map(({ id }) => id)).toEqual(english.map(({ id }) => id));
    expect(ukrainian.map(({ imagePaths }) => imagePaths[0])).toEqual(english.map(({ imagePaths }) => imagePaths[0]));
  });

  it("keeps an explicit on-disk stream primary without changing carousel order", async () => {
    expect(Object.keys(streamPrimaryPaths)).toEqual(artworkRecords.map(({ id }) => id));
    await Promise.all(artworkRecords.map(async (record) => {
      expect(record.streamPrimaryPath).toBe(streamPrimaryPaths[record.id]);
      expect(record.imagePaths[0]).toBe(record.en.main_image);
      await access(resolve("docs", record.streamPrimaryPath));
    }));
  });

  it("provides downscale-only, intrinsic mobile previews and responsive primaries", () => {
    for (const artwork of getCatalog("en")) {
      expect(artwork.streamPreview).toMatch(/artwork-index.*\.webp/);
      expect(artwork.streamPreviewWidth).toBeGreaterThan(0);
      expect(artwork.streamPreviewHeight).toBeGreaterThan(0);
      expect(artwork.streamPreviewWidth).toBeLessThanOrEqual(720);
      expect(artwork.streamPreviewWidth).toBeLessThanOrEqual(artwork.streamPrimaryWidth);
      expect(artwork.streamPreviewHeight / artwork.streamPreviewWidth)
        .toBeCloseTo(artwork.streamPrimaryHeight / artwork.streamPrimaryWidth, 2);
      if (artwork.streamPreviewWidth < artwork.streamPrimaryWidth) {
        expect(artwork.streamSrcSet).toContain(`${artwork.streamPreviewWidth}w`);
        expect(artwork.streamSrcSet).toContain(`${artwork.streamPrimaryWidth}w`);
      } else {
        expect(artwork.streamSrcSet).toBeUndefined();
      }
    }
  });

  it("preserves the five intentionally empty English stories instead of inventing copy", () => {
    const emptyStoryIds = getCatalog("en")
      .filter(({ story }) => !story.trim())
      .map(({ id }) => id);
    expect(emptyStoryIds).toEqual([
      "christmas-joy",
      "full",
      "moonglow",
      "golden-monstera",
      "november-forest",
    ]);
  });
});
