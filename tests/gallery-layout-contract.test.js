import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const galleryCssUrl = new URL("../src/styles/gallery.css", import.meta.url);
const galleryPageUrl = new URL("../src/pages/GalleryPage.jsx", import.meta.url);
const galleryCssPromise = readFile(galleryCssUrl, "utf8");
const galleryPagePromise = readFile(galleryPageUrl, "utf8");

function extractCssBlock(css, prelude, occurrence = 0) {
  let start = -1;
  for (let match = 0; match <= occurrence; match += 1) {
    start = css.indexOf(prelude, start + 1);
    if (start < 0) return "";
  }

  const openingBrace = css.indexOf("{", start + prelude.length);
  if (openingBrace < 0) return "";

  let depth = 0;
  for (let index = openingBrace; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] !== "}") continue;

    depth -= 1;
    if (depth === 0) return css.slice(start, index + 1);
  }

  return "";
}

describe("Gallery material and artwork layout contract", () => {
  it("preserves source artwork pixels instead of cropping or forcing an upscale", async () => {
    const css = await galleryCssPromise;
    const imageRule = css.match(
      /\.gallery-work__visual\s*>\s*img,[\s\S]*?\.artwork-dialog__visual\s*>\s*img\s*\{([\s\S]*?)\}/,
    )?.[1] ?? "";

    expect(imageRule).toContain("width: auto");
    expect(imageRule).toContain("height: auto");
    expect(imageRule).toContain("max-width: 100%");
    expect(imageRule).toContain("var(--artwork-frame-height) - var(--artwork-frame-gutter) - var(--artwork-frame-gutter)");
    expect(imageRule).toContain("object-fit: contain");
    expect(css).not.toContain("object-fit: cover");
  });

  it("keeps the mobile archive scan-first, full-composition, and safe from iOS form zoom", async () => {
    const [css, page] = await Promise.all([
      galleryCssPromise,
      galleryPagePromise,
    ]);
    const previewRule = css.match(
      /\.gallery-index-work__visual img\s*\{([\s\S]*?)\}/,
    )?.[1] ?? "";
    const selectRule = css.match(
      /\.gallery-mobile-filters select\s*\{([\s\S]*?)\}/,
    )?.[1] ?? "";
    const ledgerRule = css.match(
      /\.gallery-index-work__ledger\s*\{([\s\S]*?)\}/,
    )?.[1] ?? "";
    const statusRule = css.match(
      /\.gallery-index-work__status\s*\{([\s\S]*?)\}/,
    )?.[1] ?? "";
    const viewRule = css.match(
      /\.gallery-index-work__view\s*\{([\s\S]*?)\}/,
    )?.[1] ?? "";
    const pendingArchiveRule = css.match(
      /\.gallery-archive__pending\s*\{([\s\S]*?)\}/,
    )?.[1] ?? "";
    const desktopLayout = extractCssBlock(
      css,
      "@media (min-width: 760px)",
    );
    const desktopIndexRule = desktopLayout.match(
      /\.gallery-mobile-index\s*\{([^}]*)\}/,
    )?.[1] ?? "";
    const narrowMobileLayout = extractCssBlock(
      css,
      "@media (max-width: 21.875rem)",
    );
    const workNavigationReflow = extractCssBlock(
      css,
      "@media (max-width: 21.875rem)",
      1,
    );

    expect(page).toContain('className="gallery-mobile-index"');
    expect(page).toContain('className="gallery-mobile-index" role="list"');
    expect(page).toContain('aria-haspopup={showProgressiveDetails ? undefined : "dialog"}');
    expect(page).toContain('aria-labelledby={`${titleId} ${statusId} ${viewId}`}');
    expect(page).toContain('<div className="gallery-index-work__identity">');
    expect(page).toContain('<CaretDown aria-hidden="true" />');
    expect(page.match(/disabled=\{!filtersReady\}/g)).toHaveLength(5);
    expect(page).toContain('loading={position < 2 ? "eager" : "lazy"}');
    expect(page).toContain('fetchPriority={position < 2 ? "high" : "auto"}');
    expect(previewRule).toContain("max-width: 100%");
    expect(previewRule).toContain("max-height: 100%");
    expect(previewRule).toContain("object-fit: contain");
    expect(css).toMatch(
      /\.gallery-index-work__visual\s*\{[^}]*aspect-ratio:\s*var\(--gallery-index-aspect,\s*4\s*\/\s*5\);/s,
    );
    expect(css).toMatch(
      /\.gallery-index-work\s*\{[^}]*contain-intrinsic-size:\s*auto var\(--gallery-index-estimate,\s*22rem\);/s,
    );
    expect(page).toContain('"--gallery-index-estimate": estimate');
    expect(page).toContain('"--gallery-index-estimate-narrow": narrowEstimate');
    expect(css).not.toMatch(
      /\.gallery-index-work:nth-child\([^)]*\)\s+\.gallery-index-work__visual/,
    );
    expect(css).not.toMatch(
      /@media \(max-width:\s*21\.875rem\)[\s\S]*?\.gallery-index-work__visual\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1;/,
    );
    expect(selectRule).toMatch(/font(?:-size)?\s*:[^;]*\b1rem\b/);
    expect(selectRule).toContain("appearance: none");
    expect(selectRule).toContain("-webkit-appearance: none");
    expect(selectRule).toContain("border: 1px solid var(--gallery-control-rule)");
    expect(selectRule).toContain("background-color: var(--gallery-field)");
    expect(css).toMatch(
      /\.gallery-mobile-filter__control > svg\s*\{[^}]*pointer-events:\s*none;/s,
    );
    expect(css).toMatch(
      /\.gallery-mobile-filters select:disabled,[\s\S]*?opacity:\s*0\.62;/,
    );
    expect(css).toMatch(
      /\.gallery-status-filter button:disabled,[\s\S]*?\.gallery-collection-filter button:disabled\s*\{[^}]*opacity:\s*0\.62;/,
    );
    expect(ledgerRule).toContain("font-size: 0.7rem");
    expect(ledgerRule).toContain("letter-spacing: 0.06em");
    expect(ledgerRule).toContain("line-height: 1.45");
    expect(statusRule).toContain("font-size: 0.75rem");
    expect(statusRule).toContain("letter-spacing: 0.07em");
    expect(statusRule).toContain("line-height: 1.4");
    expect(viewRule).toContain("font-size: 0.8rem");
    expect(viewRule).toContain("letter-spacing: 0.08em");
    expect(viewRule).toContain("line-height: 1.35");
    expect(pendingArchiveRule).toContain("display: none");
    expect(desktopLayout).toMatch(
      /html\[data-gallery-layout="stream"\]:not\(\[data-hydration-stalled="true"\]\) \.gallery-mobile-index,[\s\S]*?\.gallery-progressive-details\s*\{[^}]*display:\s*none;/,
    );
    expect(desktopLayout).toMatch(
      /html\[data-gallery-layout="stream"\]:not\(\[data-hydrated="true"\]\):not\(\[data-hydration-stalled="true"\]\)\s*\.gallery-archive > \.gallery-archive__pending\s*\{[\s\S]*?display:\s*grid;/,
    );
    expect(desktopLayout).not.toContain(".gallery-archive:not(:has(.gallery-stream))");
    expect(desktopLayout).toMatch(/\.gallery-mobile-filters\s*\{[^}]*display:\s*none;/);
    expect(desktopIndexRule).not.toContain("display: none");
    expect(desktopIndexRule).toMatch(/grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(16rem,\s*18rem\)\);/);
    expect(css).toMatch(/\.artwork-dialog__work-navigation button\s*\{[\s\S]*?font-size:\s*clamp\(0\.75rem,\s*3\.2vw,\s*0\.82rem\);/);
    expect(css).toMatch(/\.artwork-dialog__work-navigation button span\s*\{[\s\S]*?overflow-wrap:\s*anywhere;/);
    expect(css).toMatch(/\.artwork-dialog__carousel-controls\s*\{[\s\S]*?bottom:\s*1\.75rem;[\s\S]*?width:\s*min\([\s\S]*?grid-template-columns:\s*44px minmax\(0,\s*1fr\) 44px;/);
    expect(css).toMatch(/\.artwork-surface__recovery\s*\{[\s\S]*?z-index:\s*5;[\s\S]*?pointer-events:\s*none;/);
    expect(css).toMatch(/\.artwork-surface__recovery button\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;[\s\S]*?pointer-events:\s*auto;/);
    expect(css).toMatch(/\.gallery-index-work__preview-error\s*\{[\s\S]*?pointer-events:\s*none;/);
    expect(css).toMatch(/\.artwork-dialog__carousel-controls\s*\{[\s\S]*?z-index:\s*6;/);
    expect(css).toMatch(/\.artwork-dialog__carousel-controls p\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?overflow-wrap:\s*anywhere;/);
    expect(narrowMobileLayout).toMatch(
      /\.gallery-index-work\s*\{[^}]*contain-intrinsic-size:\s*auto var\(--gallery-index-estimate-narrow,\s*28rem\);/,
    );
    expect(workNavigationReflow).toContain(".artwork-dialog__work-navigation {");
    expect(workNavigationReflow).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(workNavigationReflow).toContain(".artwork-dialog__work-navigation > p {");
    expect(workNavigationReflow).toContain("grid-column: 1 / -1;");
  });

  it("keeps the mobile seam bounded and defines a real Paper gallery palette", async () => {
    const [css, page] = await Promise.all([
      galleryCssPromise,
      galleryPagePromise,
    ]);

    expect(page).toContain('gallery-seam-mobile.webp');
    expect(page).toContain('gallery-seam-desktop.webp');
    expect(page).toContain('width="645"');
    expect(page).toContain('height="369"');
    expect(page).toContain('loading="eager"');
    expect(page).toContain('fetchPriority="auto"');
    expect(page).not.toContain("MaterialSeamRun");
    expect(css).toMatch(/\.gallery-material-seam img\s*\{[\s\S]*?height:\s*auto;/);
    expect(css).toContain(':root[data-theme="paper"] .page-gallery');
    expect(css).toContain("--gallery-ground: #ded3c5");
    expect(css).toMatch(/\.page-gallery\.site-frame--immersive \.site-header\s*\{[^}]*color:\s*var\(--gallery-ink\)/s);
    expect(css).toMatch(/\.artwork-dialog\[data-stay-fully-revealed="true"\] \.artwork-narrative__reveal\s*\{[^}]*display:\s*none/s);
  });

  it("keeps compact desktop chrome clear of the material seam", async () => {
    const css = await galleryCssPromise;
    const compactDesktopLayout = extractCssBlock(
      css,
      "@media (min-width: 760px) and (max-height: 700px) and (orientation: landscape)",
    );

    expect(compactDesktopLayout).toMatch(/\.gallery-intro\s*\{[^}]*min-height:\s*19rem;/);
    expect(compactDesktopLayout).toMatch(/\.gallery-intro__index\s*\{[^}]*display:\s*none;/);
    expect(compactDesktopLayout).toMatch(/\.gallery-controls\s*\{[^}]*padding-block:\s*2\.5rem 1rem;/);
    expect(compactDesktopLayout).toMatch(/\.gallery-work\s*\{[^}]*align-items:\s*start;/);
  });
});
