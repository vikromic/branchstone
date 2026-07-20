import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const galleryCssUrl = new URL("../src/styles/gallery.css", import.meta.url);
const galleryPageUrl = new URL("../src/pages/GalleryPage.jsx", import.meta.url);
const galleryCssPromise = readFile(galleryCssUrl, "utf8");
const galleryPagePromise = readFile(galleryPageUrl, "utf8");

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

  it("uses the full organic seam asset and defines a real Paper gallery palette", async () => {
    const [css, page] = await Promise.all([
      galleryCssPromise,
      galleryPagePromise,
    ]);

    expect(page).toContain('home-top-composite-alpha.webp');
    expect(page).toContain('home-top-vault-desktop-short-alpha.webp');
    expect(page).not.toContain("MaterialSeamRun");
    expect(css).toMatch(/\.gallery-material-seam img\s*\{[\s\S]*?height:\s*auto;/);
    expect(css).toContain(':root[data-theme="paper"] .page-gallery');
    expect(css).toContain("--gallery-ground: #ded3c5");
    expect(css).toMatch(/\.page-gallery\.site-frame--immersive \.site-header\s*\{[^}]*color:\s*var\(--gallery-ink\)/s);
    expect(css).toMatch(/\.artwork-dialog\[data-stay-fully-revealed="true"\] \.artwork-narrative__reveal\s*\{[^}]*display:\s*none/s);
  });

  it("keeps compact desktop chrome clear of the material seam", async () => {
    const css = await galleryCssPromise;

    expect(css).toMatch(/@media \(min-width: 760px\) and \(max-height: 700px\) and \(orientation: landscape\)[\s\S]*?\.gallery-intro\s*\{[\s\S]*?min-height:\s*19rem;/);
    expect(css).toMatch(/@media \(min-width: 760px\) and \(max-height: 700px\) and \(orientation: landscape\)[\s\S]*?\.gallery-intro__index\s*\{[\s\S]*?display:\s*none;/);
    expect(css).toMatch(/@media \(min-width: 760px\) and \(max-height: 700px\) and \(orientation: landscape\)[\s\S]*?\.gallery-controls\s*\{[\s\S]*?padding-block:\s*2\.5rem 1rem;/);
    expect(css).toMatch(/@media \(min-width: 760px\) and \(max-height: 700px\) and \(orientation: landscape\)[\s\S]*?\.gallery-work\s*\{[\s\S]*?align-items:\s*start;/);
  });
});
