import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { pagePathById, sitePages } from "../../site-pages.js";
import { localePathname } from "../../src/domain/locale.js";

const root = process.cwd();
const origin = "https://branchstone.art";

describe("published artifact data", () => {
  it("keeps every primary catalog image on disk", async () => {
    const { artworks } = JSON.parse(await readFile(resolve(root, "docs/json_data/artworks.json"), "utf8"));
    await Promise.all(artworks.map((artwork) => access(resolve(root, "docs", artwork.main_image))));
  });

  it("keeps authored highlights complete in both locales", async () => {
    const english = JSON.parse(await readFile(resolve(root, "docs/json_data/highlights.json"), "utf8"));
    const ukrainian = JSON.parse(await readFile(resolve(root, "docs/json_data/ukr/highlights_uk.json"), "utf8"));
    expect(ukrainian.highlights.map(({ id }) => id)).toEqual(english.highlights.map(({ id }) => id));
  });

  it("publishes every indexed page in both real locale namespaces", async () => {
    const sitemap = await readFile(resolve(root, "docs/sitemap.xml"), "utf8");
    const published = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
    const expected = sitePages
      .filter(({ id }) => id !== "notFound")
      .flatMap(({ id }) => ["en", "uk"].map((locale) => `${origin}${localePathname(pagePathById[id], locale)}`));

    expect(published).toHaveLength(new Set(published).size);
    expect([...published].sort()).toEqual([...expected].sort());
  });
});
