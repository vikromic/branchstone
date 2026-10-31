import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { sitePages } from "../../site-pages.js";
import bottomStrataAlpha from "../../src/assets/material-stage/bottom-strata-alpha.webp";
import bottomStrataMobile from "../../src/assets/material-stage/bottom-strata-mobile.webp";
import commissionMaterial from "../../src/assets/material-stage/commission-soil-hero.webp";
import commissionMaterialMobile from "../../src/assets/material-stage/commission-soil-hero-mobile.webp";
import gallerySeamDesktop from "../../src/assets/material-stage/gallery-seam-desktop.webp";
import gallerySeamMobile from "../../src/assets/material-stage/gallery-seam-mobile.webp";
import julyPinesStage from "../../src/assets/material-stage/july-pines-stage.webp";
import memorySeamAlpha from "../../src/assets/material-stage/memory-seam-alpha.webp";
import memorySeamMobile from "../../src/assets/material-stage/memory-seam-mobile.webp";
import { renderPage } from "../../src/entry-server.jsx";

const MOBILE_ONLY = "(max-width: 759px)";
const DESKTOP_UP = "(min-width: 760px)";
const locales = ["en", "uk"];

// Parse the real prerender output without installing browser globals, so the
// server entry runs exactly as it does in scripts/prerender.mjs.
function prerender(page, locale) {
  return new JSDOM(renderPage(page, locale)).window.document;
}

function pictureFor(document, sourceSrcSet) {
  const sources = [...document.querySelectorAll("picture > source")]
    .filter((source) => source.getAttribute("srcset") === sourceSrcSet);
  expect(sources).toHaveLength(1);
  const picture = sources[0].parentElement;
  return { source: sources[0], image: picture.querySelector("img") };
}

// Each row: the <source> carries one derivative behind a media query, and the
// <img> fallback carries the other, so each viewport fetches exactly one asset.
const materialPictures = [
  {
    name: "Gallery seam: desktop source, mobile fallback",
    page: "gallery",
    sourceAsset: gallerySeamDesktop,
    sourceMedia: DESKTOP_UP,
    imageAsset: gallerySeamMobile,
    loading: "eager",
    fetchpriority: "auto",
  },
  {
    name: "Contact seam: mobile source, desktop fallback",
    page: "contact",
    sourceAsset: memorySeamMobile,
    sourceMedia: MOBILE_ONLY,
    imageAsset: memorySeamAlpha,
    loading: "lazy",
    fetchpriority: "low",
  },
  {
    name: "Practice separator: mobile source, desktop fallback",
    page: "about",
    sourceAsset: bottomStrataMobile,
    sourceMedia: MOBILE_ONLY,
    imageAsset: bottomStrataAlpha,
    loading: "lazy",
    fetchpriority: "low",
  },
  {
    name: "Exhibitions separator: mobile source, desktop fallback",
    page: "exhibitions",
    sourceAsset: bottomStrataMobile,
    sourceMedia: MOBILE_ONLY,
    imageAsset: bottomStrataAlpha,
    loading: "lazy",
    fetchpriority: "low",
  },
  {
    name: "Commission hero: mobile source, desktop fallback",
    page: "commissions",
    sourceAsset: commissionMaterialMobile,
    sourceMedia: MOBILE_ONLY,
    imageAsset: commissionMaterial,
    loading: null,
    fetchpriority: "high",
  },
];

describe.each(locales)("prerendered pages (%s)", (locale) => {
  it.each(sitePages.map(({ id }) => id))("%s has one h1 and one main landmark", (page) => {
    const document = prerender(page, locale);

    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1").textContent.trim()).not.toBe("");
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(document.querySelector("main").contains(document.querySelector("h1"))).toBe(true);
  });

  it.each(materialPictures)("$name", ({ page, sourceAsset, sourceMedia, imageAsset, loading, fetchpriority }) => {
    const { source, image } = pictureFor(prerender(page, locale), sourceAsset);

    expect(source.getAttribute("media")).toBe(sourceMedia);
    expect(image.getAttribute("src")).toBe(imageAsset);
    expect(image.getAttribute("src")).not.toBe(sourceAsset);
    expect(image.getAttribute("alt")).toBe("");
    expect(image.getAttribute("loading")).toBe(loading);
    expect(image.getAttribute("fetchpriority")).toBe(fetchpriority);
  });

  it("hides the decorative 404 material from assistive technology", () => {
    const image = prerender("notFound", locale).querySelector(`img[src="${julyPinesStage}"]`);

    expect(image.getAttribute("alt")).toBe("");
    expect(image.getAttribute("aria-hidden")).toBe("true");
  });
});
