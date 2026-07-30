import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteProvider } from "../src/app/SiteContext.jsx";
import { collections } from "../src/domain/catalog.js";
import { GalleryPage } from "../src/pages/GalleryPage.jsx";

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
  ])("keeps all 32 linked works in the %s prerender before desktop hydration", (
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

    expect(html).toContain('class="gallery-mobile-index" role="list"');
    expect(html.match(/class="gallery-index-work"/g)).toHaveLength(32);
    expect(html.match(/--gallery-index-aspect:/g)).toHaveLength(32);
    expect(html.match(/--gallery-index-estimate:/g)).toHaveLength(32);
    expect(html.match(/--gallery-index-estimate-narrow:/g)).toHaveLength(32);
    expect(html.match(/<select[^>]*disabled=""/g)).toHaveLength(2);
    expect(html.match(/<button[^>]*disabled=""/g))
      .toHaveLength(4 + collections.length);
    expect(html.match(/class="gallery-index-work__link"/g)).toHaveLength(32);
    expect(html.match(/class="gallery-progressive-detail"/g)).toHaveLength(32);
    expect(html).not.toContain("gallery-index-work__preview-error");
    expect(html).toContain(heading);
    expect(html).toContain(firstWork);
    expect(html).not.toMatch(
      /class="gallery-index-work__link"[^>]*aria-haspopup="dialog"/,
    );
    expect(html).toContain('href="#artwork-details-born-of-burn"');
    expect(html).toContain('id="artwork-details-born-of-burn"');
    expect(html).toContain('class="gallery-progressive-detail"');
    expect(html).toContain(firstMaterial);
    expect(html).toContain(price);
    expect(html).toContain(collectedNote);
    expect(html).toContain(resultCount);
    expect(html).toContain('class="gallery-archive__pending" role="status"');
  });
});
