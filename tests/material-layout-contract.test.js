import { readFile } from "node:fs/promises";
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

  it("subtracts the matching header height from the 404 field at every desktop breakpoint", async () => {
    const editorial = await readFile(resolve(root, "src/styles/editorial.css"), "utf8");

    expect(editorial).toContain("min-height: max(39rem, calc(100svh - 5rem))");
    expect(editorial).toMatch(/@media \(min-width: 760px\)[\s\S]*?\.not-found-page\s*\{\s*min-height: max\(39rem, calc\(100svh - 6rem\)\)/);
    expect(editorial).toMatch(/@media \(min-width: 1100px\)[\s\S]*?\.not-found-page\s*\{\s*min-height: max\(39rem, calc\(100svh - 6\.4rem\)\)/);
  });
});
