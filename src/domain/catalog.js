import englishSource from "../../docs/json_data/artworks.json";
import ukrainianSource from "../../docs/json_data/ukr/artworks_uk.json";
import {
  streamPrimaryMedia,
  streamPrimaryPaths,
} from "./artwork-media.js";

const streamPreviewModules = import.meta.glob(
  "../assets/artwork-index/*.webp",
  { eager: true, import: "default", query: "?url" },
);

export const slugify = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const englishArtworks = englishSource.artworks;
const ukrainianByImage = new Map(
  ukrainianSource.artworks.map((artwork) => [artwork.main_image, artwork]),
);

export { streamPrimaryPaths };

const collectionRecords = [
  ["deep-ocean", "Deep Ocean", "Велика Вода"],
  ["following-her-steps", "Following Her Steps", "По її слідах"],
  ["golden", "Golden", "Золото"],
  ["magnet", "Magnet", "Магніт"],
  ["of-ash-and-flowers", "Of Ash and Flowers", "Про Попіл і Квіти"],
  ["storms", "Storms", "Бурі"],
  ["the-calm-of-the-forest", "The Calm of the Forest", "Спокій Лісу"],
];

export const collections = collectionRecords.map(([id, en, uk]) => ({ id, en, uk }));

const collectionAliases = new Map();
for (const collection of collections) {
  for (const value of [collection.id, collection.en, collection.uk, slugify(collection.en)]) {
    collectionAliases.set(String(value).toLowerCase(), collection.id);
  }
}
collectionAliases.set("deepocean", "deep-ocean");
collectionAliases.set("followinghersteps", "following-her-steps");
collectionAliases.set("ofashandflowers", "of-ash-and-flowers");
collectionAliases.set("calmoftheforest", "the-calm-of-the-forest");
collectionAliases.set("глибокий океан", "deep-ocean");
collectionAliases.set("слідом за нею", "following-her-steps");
collectionAliases.set("золота", "golden");
collectionAliases.set("тиша лісу", "the-calm-of-the-forest");

export function normalizeCollection(value) {
  if (!value || value === "all") return "all";
  return collectionAliases.get(decodeURIComponent(String(value)).toLowerCase()) ?? "all";
}

const normalized = englishArtworks.map((english, index) => {
  const ukrainian = ukrainianByImage.get(english.main_image) ?? english;
  const id = slugify(english.name);
  const collectionId = normalizeCollection(english.collection);
  const directory = english.main_image.slice(0, english.main_image.lastIndexOf("/") + 1);
  const imagePaths = [english.main_image, ...(english.images ?? []).map((image) => `${directory}${image}`)];
  const streamPrimary = streamPrimaryMedia[id];
  if (!streamPrimary) throw new Error(`Missing stream primary for artwork: ${id}`);
  const streamPreview = streamPreviewModules[`../assets/artwork-index/${id}.webp`];
  if (!streamPreview) throw new Error(`Missing stream preview for artwork: ${id}`);
  const streamPreviewWidth = Math.min(720, streamPrimary.width);
  return {
    id,
    legacyId: `artwork-${id}`,
    index,
    collectionId,
    sold: Boolean(english.sold),
    highlighted: Boolean(english.highlighted),
    prints: Boolean(english.prints),
    price: english.price,
    scale: english.scale,
    streamPrimaryPath: streamPrimary.path,
    streamPrimaryWidth: streamPrimary.width,
    streamPrimaryHeight: streamPrimary.height,
    streamPreview,
    streamPreviewWidth,
    streamPreviewHeight: Math.round(streamPrimary.height * streamPreviewWidth / streamPrimary.width),
    imagePaths: [...new Set(imagePaths)],
    en: english,
    uk: ukrainian,
  };
});

export const artworkRecords = Object.freeze(normalized);
export const artworkById = new Map(artworkRecords.map((artwork) => [artwork.id, artwork]));
const artworkAliases = new Map([["mermaids-dream", "mermaid-s-dream"]]);

export function normalizeArtworkId(value) {
  const id = String(value || "").replace(/^artwork-/, "");
  return artworkAliases.get(id) ?? id;
}

export function localizeArtwork(record, locale = "en") {
  const copy = locale === "uk" ? record.uk : record.en;
  const cleanInline = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const cleanText = (value) => String(value ?? "").split("\n").map((line) => line.trim()).join("\n").trim();
  const name = cleanInline(copy.name || record.en.name);
  const collection = cleanInline(
    collections.find((candidate) => candidate.id === record.collectionId)?.[locale]
      ?? copy.collection
      ?? record.en.collection,
  );
  const description = cleanText(copy.description || record.en.description);
  const year = cleanInline(copy.year || record.en.year);
  return {
    ...record,
    name,
    collection,
    description,
    story: description,
    materials: cleanInline(copy.materials || record.en.materials),
    dimensions: cleanInline(copy.dimensions || record.en.dimensions),
    year,
    streamPrimary: assetUrl(record.streamPrimaryPath),
    streamPreview: record.streamPreview,
    streamSrcSet: record.streamPreviewWidth < record.streamPrimaryWidth
      ? `${record.streamPreview} ${record.streamPreviewWidth}w, ${assetUrl(record.streamPrimaryPath)} ${record.streamPrimaryWidth}w`
      : undefined,
    mainImage: assetUrl(record.imagePaths[0]),
    images: record.imagePaths.map(assetUrl),
  };
}

export function getCatalog(locale = "en") {
  return artworkRecords.map((record) => localizeArtwork(record, locale));
}

const HOME_PINNED_ARTWORK_ID = "july-pines";

export function selectHomeArtworks(catalog) {
  const pinned = catalog.find((artwork) => artwork.id === HOME_PINNED_ARTWORK_ID);
  const availableStories = catalog.filter((artwork) => (
    artwork.id !== HOME_PINNED_ARTWORK_ID
    && artwork.highlighted
    && !artwork.sold
    && artwork.story.trim()
  ));
  return pinned ? [pinned, ...availableStories] : availableStories;
}

export function assetUrl(path) {
  const clean = String(path).replace(/^\/+/, "");
  return import.meta.env.DEV ? `/docs/${clean}` : `/${clean}`;
}

export function collectionLabel(id, locale = "en") {
  return collections.find((collection) => collection.id === id)?.[locale] ?? id;
}

export function catalogStatsFor(artworks) {
  return artworks.reduce((stats, artwork) => {
    stats.total += 1;
    stats[artwork.sold ? "collected" : "available"] += 1;
    if (artwork.highlighted && !artwork.sold) stats.highlightedAvailable += 1;
    return stats;
  }, { total: 0, available: 0, collected: 0, highlightedAvailable: 0 });
}

export const catalogStats = Object.freeze(catalogStatsFor(artworkRecords));
