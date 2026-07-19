import englishSource from "../../docs/json_data/artworks.json";
import ukrainianSource from "../../docs/json_data/ukr/artworks_uk.json";

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
  return {
    ...record,
    name: cleanInline(copy.name || record.en.name),
    collection:
      cleanInline(
        collections.find((collection) => collection.id === record.collectionId)?.[locale] ??
        copy.collection ??
        record.en.collection,
      ),
    description: cleanText(copy.description || record.en.description),
    materials: cleanInline(copy.materials || record.en.materials),
    dimensions: cleanInline(copy.dimensions || record.en.dimensions),
    year: cleanInline(copy.year || record.en.year),
    mainImage: assetUrl(record.imagePaths[0]),
    images: record.imagePaths.map(assetUrl),
  };
}

export function getCatalog(locale = "en") {
  return artworkRecords.map((record) => localizeArtwork(record, locale));
}

export function assetUrl(path) {
  const clean = String(path).replace(/^\/+/, "");
  return import.meta.env.DEV ? `/docs/${clean}` : `/${clean}`;
}

export function collectionLabel(id, locale = "en") {
  return collections.find((collection) => collection.id === id)?.[locale] ?? id;
}

export const catalogStats = Object.freeze({
  total: artworkRecords.length,
  available: artworkRecords.filter((artwork) => !artwork.sold).length,
  collected: artworkRecords.filter((artwork) => artwork.sold).length,
  highlightedAvailable: artworkRecords.filter((artwork) => artwork.highlighted && !artwork.sold).length,
});
