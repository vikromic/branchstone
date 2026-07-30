import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function ruleFor(css, selector) {
  return css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]+)\\}`))?.[1] ?? "";
}

describe("material art direction", () => {
  it("preserves the source aspect ratio for the About separator and Contact seam", async () => {
    const [editorial, contact] = await Promise.all([
      readFile(resolve(root, "src/styles/editorial.css"), "utf8"),
      readFile(resolve(root, "src/styles/contact.css"), "utf8"),
    ]);

    expect(ruleFor(editorial, ".material-separator img")).toContain("object-fit: cover");
    expect(ruleFor(editorial, ".material-separator img")).not.toContain("object-fit: fill");
    expect(ruleFor(contact, ".contact-hero__material")).toContain("object-fit: cover");
    expect(ruleFor(contact, ".contact-hero__material")).not.toContain("object-fit: fill");
  });

  it("serves bounded material surfaces without putting desktop seams on the mobile path", async () => {
    const mobileAssets = [
      "gallery-seam-mobile.webp",
      "memory-seam-mobile.webp",
      "bottom-strata-mobile.webp",
    ];
    const [about, exhibitions, contact, gallery, generator, desktopGalleryStat, ...mobileAssetStats] = await Promise.all([
      readFile(resolve(root, "src/pages/AboutPage.jsx"), "utf8"),
      readFile(resolve(root, "src/pages/ExhibitionsPage.jsx"), "utf8"),
      readFile(resolve(root, "src/pages/ContactPage.jsx"), "utf8"),
      readFile(resolve(root, "src/pages/GalleryPage.jsx"), "utf8"),
      readFile(resolve(root, "scripts/generate-mobile-materials.mjs"), "utf8"),
      stat(resolve(root, "src/assets/material-stage/gallery-seam-desktop.webp")),
      ...mobileAssets.map((filename) => stat(resolve(
        root,
        "src/assets/material-stage",
        filename,
      ))),
    ]);

    for (const page of [about, exhibitions, contact]) {
      expect(page).toContain('media="(max-width: 759px)"');
      expect(page).toContain('loading="lazy"');
      expect(page).toContain('fetchPriority="low"');
    }
    expect(about).toContain("bottom-strata-mobile.webp");
    expect(exhibitions).toContain("bottom-strata-mobile.webp");
    expect(contact).toContain("memory-seam-mobile.webp");
    expect(gallery).toContain("gallery-seam-mobile.webp");
    expect(gallery).toContain("gallery-seam-desktop.webp");
    expect(gallery).toContain('width="645"');
    expect(gallery).toContain('loading="eager"');
    expect(gallery).toContain('fetchPriority="auto"');
    expect(gallery).toContain('fetchPriority={position < 2 ? "high" : "auto"}');
    expect(generator).toContain('"gallery-seam-desktop.webp"');
    expect(generator).toContain('"645"');
    expect(generator).toContain('"1290"');
    expect(generator).toContain('"1817"');
    expect(desktopGalleryStat.size).toBeLessThanOrEqual(100 * 1024);
    expect(mobileAssetStats.every(({ size }) => size <= 180 * 1024)).toBe(true);
  });

  it("uses one unified geological edge on mobile and desktop", async () => {
    const home = await readFile(resolve(root, "src/styles/home.css"), "utf8");
    const mobileTop = ruleFor(home, ".home-material-layer--top");

    expect(mobileTop).toContain("top: 0");
    expect(mobileTop).toContain("width: 142%");
    expect(mobileTop).toContain("height: auto");
    expect(home).not.toContain(".home-memory-seam");
    expect(home).not.toContain("memory-seam-desktop-alpha.webp");
    expect(home).toMatch(/@media \(min-width: 560px\) and \(max-width: 699px\) and \(min-height: 621px\)[\s\S]*?\.home-stay-details\s*\{[\s\S]*?top: 42%;/);
    expect(home).toMatch(/@media \(min-width: 700px\)[\s\S]*?\.home-material-layer--top\s*\{[\s\S]*?width: 100%;/);
    expect(home).toMatch(/@media \(min-width: 1681px\)[\s\S]*?\.home-material-frame__bottom-bound\s*\{[\s\S]*?width: min\(100%, 120rem\);[\s\S]*?overflow: hidden;/);
    expect(home).toMatch(/@media \(min-width: 1681px\)[\s\S]*?\.home-stay-details\s*\{[\s\S]*?top: 31%;[\s\S]*?right: max\(3rem, calc\(\(100vw - min\(72vw, 68rem\)\) \/ 2 - 14\.5rem\)\);/);
    expect(home).toMatch(/@media \(max-height: 620px\) and \(orientation: landscape\)[\s\S]*?\.home-stay-details\s*\{[\s\S]*?top: 24%;/);
    expect(home).toMatch(/@media \(min-width: 700px\) and \(max-height: 620px\) and \(orientation: landscape\)[\s\S]*?\.home-stay-details\s*\{[\s\S]*?top: 36%;/);
    expect(home).toMatch(/@media \(min-width: 700px\) and \(max-height: 620px\) and \(min-aspect-ratio: 9 \/ 4\)[\s\S]*?\.home-stay-details\s*\{[\s\S]*?top: 42%;/);
    expect(home).toMatch(/@media \(max-width: 699px\) and \(max-height: 620px\) and \(orientation: landscape\)[\s\S]*?\.home-material-layer--top\s*\{[\s\S]*?width: 108%;/);
  });

  it("uses one header-height contract for every full-viewport editorial field", async () => {
    const [editorial, index, commissions, contact] = await Promise.all([
      readFile(resolve(root, "src/styles/editorial.css"), "utf8"),
      readFile(resolve(root, "src/styles/index.css"), "utf8"),
      readFile(resolve(root, "src/styles/commissions.css"), "utf8"),
      readFile(resolve(root, "src/styles/contact.css"), "utf8"),
    ]);

    expect(index).toContain("--site-header-height: 5rem");
    expect(index).toMatch(/@media \(min-width: 760px\)[\s\S]*?:root\s*\{\s*--site-header-height:\s*6rem;/);
    expect(index).toMatch(/@media \(min-width: 1100px\)[\s\S]*?:root\s*\{\s*--site-header-height:\s*6\.4rem;/);
    expect(ruleFor(index, ".site-header")).toContain("min-height: var(--site-header-height)");
    expect(ruleFor(editorial, ".about-hero")).toContain("calc(100svh - var(--site-header-height))");
    expect(ruleFor(editorial, ".not-found-page")).toContain("calc(100svh - var(--site-header-height))");
    expect(ruleFor(commissions, ".commission-hero")).toContain("calc(100svh - var(--site-header-height))");
    expect(ruleFor(contact, ".contact-hero")).toContain("calc(100svh - var(--site-header-height))");
  });

  it("keeps the desktop index content-sized and grounded by a real material asset", async () => {
    const [shell, index] = await Promise.all([
      readFile(resolve(root, "src/app/SiteShell.jsx"), "utf8"),
      readFile(resolve(root, "src/styles/index.css"), "utf8"),
    ]);

    expect(shell).toContain('bottom-strata-alpha.webp');
    expect(shell).toContain('className="site-index__material"');
    expect(index).toMatch(/@media \(min-width: 760px\)[\s\S]*?grid-template-rows: auto auto;/);
    expect(index).not.toContain("grid-template-rows: auto 1fr");
    expect(ruleFor(index, ".site-index__routes")).toContain("align-content: start");
    expect(ruleFor(index, ".site-index")).toContain("overflow-x: clip");
    expect(index).toContain("mask-image: linear-gradient(90deg");
  });

  it("gives Paper a visible index focus color and a light 404 surface", async () => {
    const [index, editorial, notFound] = await Promise.all([
      readFile(resolve(root, "src/styles/index.css"), "utf8"),
      readFile(resolve(root, "src/styles/editorial.css"), "utf8"),
      readFile(resolve(root, "src/pages/NotFoundPage.jsx"), "utf8"),
    ]);

    expect(index).toMatch(/:root\[data-theme="paper"\][\s\S]*?--mineral: #3c606c;/);
    expect(editorial).toContain(':root[data-theme="paper"] .legal-page');
    expect(editorial).toContain(':root[data-theme="paper"] .not-found-page');
    expect(notFound).toContain('alt="" aria-hidden="true"');
  });
});
