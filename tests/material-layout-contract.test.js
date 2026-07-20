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

  it("subtracts the matching header height from the 404 field at every desktop breakpoint", async () => {
    const editorial = await readFile(resolve(root, "src/styles/editorial.css"), "utf8");

    expect(editorial).toContain("min-height: max(39rem, calc(100svh - 5rem))");
    expect(editorial).toMatch(/@media \(min-width: 760px\)[\s\S]*?\.not-found-page\s*\{\s*min-height: max\(39rem, calc\(100svh - 6rem\)\)/);
    expect(editorial).toMatch(/@media \(min-width: 1100px\)[\s\S]*?\.not-found-page\s*\{\s*min-height: max\(39rem, calc\(100svh - 6\.4rem\)\)/);
  });
});
