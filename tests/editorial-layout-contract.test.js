import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const root = process.cwd();
let editorialCss;
let commissionCss;
let indexCss;
let commissionPage;

describe("desktop editorial layout contract", () => {
  beforeAll(async () => {
    [editorialCss, commissionCss, indexCss, commissionPage] = await Promise.all([
      readFile(resolve(root, "src/styles/editorial.css"), "utf8"),
      readFile(resolve(root, "src/styles/commissions.css"), "utf8"),
      readFile(resolve(root, "src/styles/index.css"), "utf8"),
      readFile(resolve(root, "src/pages/CommissionsPage.jsx"), "utf8"),
    ]);
  });

  it("tracks the compact desktop header and preserves visible Commission focus", () => {
    expect(indexCss).toMatch(/@media \(max-height: 620px\) and \(orientation: landscape\)[\s\S]*?:root\s*\{\s*--site-header-height:\s*4\.25rem;/);
    expect(editorialCss).toMatch(/\.about-hero\s*{[^}]*min-height:\s*calc\(100svh - var\(--site-header-height\)\)/s);
    expect(commissionCss).toMatch(/\.commission-hero\s*{[^}]*min-height:\s*calc\(100svh - var\(--site-header-height\)\)/s);
    expect(commissionCss).toMatch(/\.commission-step h3:focus\s*{[^}]*outline:\s*2px solid var\(--paper-ink\)/s);
  });

  it("keeps small form states above the previous low-contrast values", () => {
    expect(commissionCss).toContain("color-mix(in srgb, var(--paper-ink) 65%, transparent)");
    expect(commissionCss).toContain("color-mix(in srgb, var(--paper-ink) 66%, transparent)");
    expect(commissionCss).toContain("color-mix(in srgb, var(--paper-ink) 68%, transparent)");
    expect(commissionCss).toContain("--error: #7b2d24");
  });

  it("serves a focused mobile Commission hero without downloading the desktop source", () => {
    expect(commissionPage).toContain('commission-soil-hero-mobile.webp');
    expect(commissionPage).toMatch(/<source media="\(max-width: 759px\)" srcSet=\{commissionMaterialMobile\}/);
  });
});
