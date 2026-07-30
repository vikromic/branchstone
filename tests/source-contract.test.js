import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { htmlFiles } from "../site-pages.js";

const root = process.cwd();

describe("published source contract", () => {
  it("keeps all real multi-page entry points", async () => {
    const themeBootstraps = [];
    for (const filename of htmlFiles) {
      const html = await readFile(resolve(root, filename), "utf8");
      expect(html).toContain('<div id="root"></div>');
      expect(html).toMatch(/<link rel="(?:canonical|icon)"/);
      expect(html).toContain('<meta name="theme-color" content="#15110e" />');
      themeBootstraps.push(html.match(/<script>([^<]*branchstone-theme[^<]*)<\/script>/)?.[1]);
    }
    expect(new Set(themeBootstraps).size).toBe(1);
    expect(themeBootstraps[0]).toContain("prefers-color-scheme:light");
  });

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
    expect(sitemap.match(/<loc>/g)).toHaveLength(16);
    expect(sitemap).toContain("https://branchstone.art/uk/gallery.html");
    expect(sitemap).toContain("https://branchstone.art/uk/exhibitions.html");
    expect(sitemap).toContain("https://branchstone.art/uk/terms.html");
  });
});
