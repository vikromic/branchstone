import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { sitePages } from "../../site-pages.js";
import { renderPage } from "../../src/entry-server.jsx";

const locales = ["en", "uk"];

// Parse the real prerender output without installing browser globals, so the
// server entry runs exactly as it does in scripts/prerender.mjs.
function prerender(page, locale) {
  return new JSDOM(renderPage(page, locale)).window.document;
}

describe.each(locales)("prerendered pages (%s)", (locale) => {
  it.each(sitePages.map(({ id }) => id))("%s has one h1 and one main landmark", (page) => {
    const document = prerender(page, locale);

    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1").textContent.trim()).not.toBe("");
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(document.querySelector("main").contains(document.querySelector("h1"))).toBe(true);
  });

  it("links every Home selection to its Gallery deep link without JavaScript", () => {
    const document = prerender("home", locale);
    const links = [...document.querySelectorAll(".works-grid__link")];

    expect(links.length).toBeGreaterThan(1);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/\/gallery\.html\?art=[a-z0-9-]+$/);
      expect(link.querySelector("img").getAttribute("width")).toMatch(/^\d+$/);
    }
  });
});
