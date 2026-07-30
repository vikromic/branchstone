import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const root = process.cwd();
let indexCss;
let homeCss;
let contactCss;
let commissionCss;
let editorialCss;
let galleryCss;
let shellPage;
let contactPage;

function extractCssBlock(css, prelude) {
  const start = css.indexOf(prelude);
  if (start < 0) return "";
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

function luminance(rgb) {
  const [red, green, blue] = rgb
    .map((value) => value / 255)
    .map((value) => (
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4
    ));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrast(first, second) {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function blend(foreground, background, opacity) {
  return foreground.map((channel, index) => (
    Math.round((channel * opacity) + (background[index] * (1 - opacity)))
  ));
}

describe("mobile shell release contract", () => {
  beforeAll(async () => {
    [
      indexCss,
      homeCss,
      contactCss,
      commissionCss,
      editorialCss,
      galleryCss,
      shellPage,
      contactPage,
    ] = await Promise.all([
      readFile(resolve(root, "src/styles/index.css"), "utf8"),
      readFile(resolve(root, "src/styles/home.css"), "utf8"),
      readFile(resolve(root, "src/styles/contact.css"), "utf8"),
      readFile(resolve(root, "src/styles/commissions.css"), "utf8"),
      readFile(resolve(root, "src/styles/editorial.css"), "utf8"),
      readFile(resolve(root, "src/styles/gallery.css"), "utf8"),
      readFile(resolve(root, "src/app/SiteShell.jsx"), "utf8"),
      readFile(resolve(root, "src/pages/ContactPage.jsx"), "utf8"),
    ]);
  });

  it("reflows below 320 CSS pixels without hiding broad page overflow", () => {
    expect(indexCss).not.toMatch(/html\s*\{[^}]*min-width:\s*320px/s);
    expect(indexCss).not.toMatch(/body\s*\{[^}]*min-width:\s*320px/s);
    expect(indexCss).toMatch(/\.site-frame\s*\{[^}]*min-width:\s*0;/s);
    expect(indexCss).not.toMatch(/\.site-frame\s*\{[^}]*overflow:\s*clip;/s);
    expect(contactCss).not.toMatch(/\.contact-correspondence\s*\{[^}]*overflow:\s*clip;/s);
    expect(commissionCss).not.toMatch(/\.commission-page\s*\{[^}]*overflow:\s*clip;/s);
  });

  it("keeps a safe-area-aware 44px Index control reachable after mobile scroll", () => {
    expect(indexCss).toMatch(/@media \(max-width: 1039px\)[\s\S]*?\.index-control[\s\S]*?position:\s*fixed;/);
    expect(indexCss).toMatch(/@media \(max-width: 1039px\)[\s\S]*?min-height:\s*2\.75rem;/);
    expect(indexCss).toContain("calc(env(safe-area-inset-top) + 0.5rem)");
    expect(indexCss).toContain("calc(env(safe-area-inset-right) + 0.5rem)");
    expect(indexCss).toMatch(/\.archive-drawer\s*\{[\s\S]*?var\(--safe-gutter-right\)[\s\S]*?var\(--safe-gutter-left\);/);
    expect(indexCss).toMatch(/\.migration-notice\s*\{[^}]*left:\s*var\(--safe-gutter-left\);[^}]*right:\s*var\(--safe-gutter-right\);/s);
  });

  it("stacks the mobile Home archive link below the fixed Index control", () => {
    const homeArchiveRule = indexCss.match(
      /@media \(max-width: 1039px\)[\s\S]*?\.site-frame\.page-home\.site-frame--immersive \.all-works-link\s*\{([^}]*)\}/,
    )?.[1] ?? "";

    expect(homeArchiveRule).toContain("min-height: 2.75rem");
    expect(homeArchiveRule).toContain("margin-block-start: 3.5rem");
  });

  it("reflows the mobile shell at 200% text without shrinking primary touch targets", () => {
    const mobileLayout = extractCssBlock(indexCss, "@media (max-width: 1039px)");
    const immersiveIndexReservation = mobileLayout.match(
      /\.site-frame--immersive \.quiet-index-trigger\s*\{([^}]*)\}/,
    )?.[1] ?? "";
    const wordmarkRule = indexCss.match(/\.wordmark\s*\{([^}]*)\}/)?.[1] ?? "";
    const prehydrateRoutes = indexCss.match(
      /\.prehydrate-index__layer nav a\s*\{([^}]*)\}/,
    )?.[1] ?? "";
    const indexRoutes = indexCss.match(/\.site-index__routes a\s*\{([^}]*)\}/)?.[1] ?? "";
    const secondaryRoutes = indexCss.match(/\.site-index__secondary a\s*\{([^}]*)\}/)?.[1] ?? "";
    const footerRoutes = indexCss.match(/\.footer-ledger a\s*\{([^}]*)\}/)?.[1] ?? "";
    const fullWorkRule = homeCss.match(
      /\.home-stay-detail--availability a\s*\{([^}]*)\}/,
    )?.[1] ?? "";

    expect(wordmarkRule).toContain("min-height: 2.75rem");
    expect(prehydrateRoutes).toContain("grid-template-columns: 2.5rem minmax(0, 1fr)");
    expect(prehydrateRoutes).toContain("overflow-wrap: anywhere");
    expect(indexRoutes).toContain("grid-template-columns: 2.5rem minmax(0, 1fr)");
    expect(indexRoutes).toContain("overflow-wrap: anywhere");
    expect(mobileLayout).toMatch(/\.site-header > \.wordmark\s*\{[^}]*width:\s*auto;[^}]*min-width:\s*0;[^}]*flex:\s*1 1 0;/s);
    expect(mobileLayout).toContain("min-width: clamp(2.75rem, 20vw, 4rem)");
    expect(immersiveIndexReservation).toContain(
      "min-width: calc(clamp(2.75rem, 20vw, 4rem) + 1.4rem + 2px)",
    );
    expect(mobileLayout).toContain("min-width: clamp(2.75rem, 28vw, 5.5rem)");
    expect(mobileLayout).toMatch(/\.site-index__utility-actions > a,[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
    expect(secondaryRoutes).toContain("min-width: 2.75rem");
    expect(secondaryRoutes).toContain("min-height: 2.75rem");
    expect(footerRoutes).toContain("min-width: 2.75rem");
    expect(footerRoutes).toContain("min-height: 2.75rem");
    expect(fullWorkRule).toContain("min-width: 2.75rem");
    expect(fullWorkRule).toContain("min-height: 2.75rem");
    expect(contactCss).toMatch(
      /\.contact-sheet__intro h2,[\s\S]*?\.contact-desk h2,[\s\S]*?\.contact-faq h2\s*\{[^}]*overflow-wrap:\s*anywhere;/s,
    );
    expect(editorialCss).toMatch(
      /\.collector-notes figure\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s,
    );
    expect(editorialCss).toMatch(
      /\.editorial-invitation\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s,
    );
    expect(editorialCss).toMatch(
      /\.editorial-invitation h2\s*\{[^}]*overflow-wrap:\s*anywhere;/s,
    );
    expect(galleryCss).toMatch(
      /\.artwork-dialog__locale\s*\{[^}]*min-width:\s*2\.75rem;[^}]*min-height:\s*2\.75rem;/s,
    );
    expect(galleryCss).toMatch(
      /@media \(max-width: 240px\)[\s\S]*?\.artwork-dialog__close span\s*\{[^}]*display:\s*none;/s,
    );
  });

  it("hands an open pre-hydration Index to React without a stale modal claim", () => {
    expect(indexCss).toContain('html:not([data-hydrated="true"]):has(.prehydrate-index[open])');
    expect(shellPage).toContain('document.querySelector(".prehydrate-index[open]")');
    expect(shellPage).toContain("if (fallbackIndex) fallbackIndex.open = false");
    expect(shellPage).toContain('role="region" aria-label={indexLabel}');
    expect(shellPage).not.toContain('className="prehydrate-index__layer" role="dialog"');
  });

  it("preserves complete artwork compositions in Saved and Contact", () => {
    expect(indexCss).toMatch(/\.saved-row img\s*\{[^}]*object-fit:\s*contain;/s);
    expect(contactCss).toMatch(/\.inquiry-ticket img,[\s\S]*?object-fit:\s*contain;/);
    expect(shellPage).toContain("artwork.streamPreview ?? artwork.mainImage");
    expect(contactPage).toContain("artwork.streamPreview ?? artwork.mainImage");
  });

  it("keeps Contact placeholder text and error indicators above contrast gates", () => {
    const paper = [233, 224, 211];
    const paperInk = [33, 28, 24];
    const placeholder = blend(paperInk, paper, 0.68);
    const error = [123, 45, 36];

    expect(contactCss).toContain("--error: #7b2d24");
    expect(contactCss).toContain("var(--paper-ink) 68%");
    expect(contrast(placeholder, paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(error, paper)).toBeGreaterThanOrEqual(3);
  });

  it("draws an explicit mobile Gallery filter with a compliant Paper boundary", () => {
    const paperGround = [222, 211, 197];
    const paperInk = [36, 30, 26];
    const controlBorder = blend(paperInk, paperGround, 0.62);
    const selectRule = galleryCss.match(
      /\.gallery-mobile-filters select\s*\{([^}]*)\}/,
    )?.[1] ?? "";

    expect(galleryCss).toContain("--gallery-control-rule: rgba(36, 30, 26, 0.62)");
    expect(selectRule).toContain("appearance: none");
    expect(selectRule).toContain("border: 1px solid var(--gallery-control-rule)");
    expect(selectRule).toContain("background-color: var(--gallery-field)");
    expect(galleryCss).toMatch(
      /\.gallery-mobile-filter__control > svg\s*\{[^}]*pointer-events:\s*none;/s,
    );
    expect(contrast(controlBorder, paperGround)).toBeGreaterThanOrEqual(3);
  });
});
