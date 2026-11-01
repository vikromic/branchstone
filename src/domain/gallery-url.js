import { normalizeArtworkId, normalizeCollection } from "./catalog.js";

// Pure Gallery URL helpers. State lives in the query string (`collection`,
// `availability`, `art`) plus the `#artwork-details-<id>` progressive anchor.

export function relativeUrl(url) {
  return `${url.pathname}${url.search}${url.hash}`;
}

// Applies `update` to a copy of `href`'s search params and returns the relative URL.
export function galleryUrl(href, update) {
  const url = new URL(href);
  update(url.searchParams);
  return relativeUrl(url);
}

export function findArtwork(catalog, value) {
  if (!value) return null;
  let id;
  try {
    id = normalizeArtworkId(decodeURIComponent(String(value)));
  } catch {
    return null;
  }
  return catalog.find((artwork) => artwork.id === id) ?? null;
}

export function safeNormalizeCollection(value) {
  try {
    return normalizeCollection(value);
  } catch {
    return "all";
  }
}

export function normalizeAvailability(value) {
  return value === "available" || value === "collected" ? value : "all";
}

// Grid link for one work. Before hydration it targets the static details anchor;
// afterwards it is the canonical deep link the enhanced view opens in place.
export function artworkHref(artworkId, collection, availability, progressiveOnly = false) {
  if (progressiveOnly) return `#artwork-details-${artworkId}`;
  const search = new URLSearchParams();
  if (collection !== "all") search.set("collection", collection);
  if (availability !== "all") search.set("availability", availability);
  search.set("art", artworkId);
  return `?${search}#artwork-details-${artworkId}`;
}
