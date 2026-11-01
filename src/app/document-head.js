import { getPageMetadata } from "../content/metadata.js";
import { localeHref } from "../domain/locale.js";

// Document-head writes for runtime locale and theme changes. The static head in
// each page entry and the prerender step provide the same values before hydration.

const themeColors = Object.freeze({ paper: "#e9e0d3", soil: "#15110e" });

export function updateDocumentMetadata(locale) {
  const metadata = getPageMetadata(document.body.dataset.page, locale);
  document.title = metadata.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = metadata.description;
  const openGraphTitle = document.querySelector('meta[property="og:title"]');
  if (openGraphTitle) openGraphTitle.content = metadata.title;
  const openGraphDescription = document.querySelector('meta[property="og:description"]');
  if (openGraphDescription) openGraphDescription.content = metadata.description;
  const localizedPath = localeHref(window.location.pathname, locale);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = new URL(localizedPath, window.location.origin).href;
  const openGraphUrl = document.querySelector('meta[property="og:url"]');
  if (openGraphUrl) openGraphUrl.content = new URL(localizedPath, window.location.origin).href;
}

export function applyDocumentTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === "paper" ? themeColors.paper : themeColors.soil;
}

// Maps the stored preference ("light"/"paper", "dark"/"soil") to a theme name.
// The pre-paint inline script in each page entry applies the same mapping.
export function themeFromStoredValue(raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value === "light" || value === "paper") return "paper";
    if (value === "dark" || value === "soil") return "soil";
    return null;
  } catch {
    return null;
  }
}

export function themeToStoredValue(theme) {
  return JSON.stringify(theme === "paper" ? "light" : "dark");
}
