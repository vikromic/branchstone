import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteProvider } from "../../src/app/SiteContext.jsx";
import { getCatalog } from "../../src/content/artworks.js";
import { collections } from "../../src/domain/catalog.js";
import { GalleryPage } from "../../src/pages/GalleryPage.jsx";

describe("Gallery progressive archive", () => {
  it.each([
    [
      "en",
      "Works that carry the ground",
      "Born Of Burn",
      "Ponderosa pine",
      "USD 200",
      "This work is held in a private collection.",
      "32 works",
    ],
    [
      "uk",
      "Роботи, що несуть землю",
      "Народженне з Попілу",
      "Жовта сосна",
      "USD 200",
      "Робота у приватній колекції.",
      "32 роботи",
    ],
  ])("keeps every linked work and its static details in the %s prerender", (
    locale,
    heading,
    firstWork,
    firstMaterial,
    price,
    collectedNote,
    resultCount,
  ) => {
    const html = renderToString(
      <SiteProvider initialLocale={locale}><GalleryPage /></SiteProvider>,
    );
    const workCount = getCatalog(locale).length;

    expect(html).toContain('class="works-grid" role="list"');
    expect(html.match(/class="works-grid__item"/g)).toHaveLength(workCount);
    expect(html.match(/class="works-grid__link"/g)).toHaveLength(workCount);
    expect(html.match(/--ar:/g)).toHaveLength(workCount);
    expect(html.match(/<button[^>]*disabled=""/g))
      .toHaveLength(3 + 1 + collections.length);
    expect(html.match(/class="gallery-progressive-detail"/g)).toHaveLength(workCount);
    expect(html).not.toContain("works-grid__preview-error");
    expect(html).not.toMatch(/class="works-grid__link"[^>]*aria-haspopup/);
    expect(html).toContain(heading);
    expect(html).toContain(firstWork);
    expect(html).toContain('href="#artwork-details-born-of-burn"');
    expect(html).toContain('id="artwork-details-born-of-burn"');
    expect(html).toContain(firstMaterial);
    expect(html).toContain(price);
    expect(html).toContain(collectedNote);
    expect(html).toContain(resultCount);
  });
});
