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

// The immersive gallery needs art-first photographs, while `main_image` and
// `images` remain the published catalog/carousel contract. Keep this mapping
// explicit so a new catalog entry cannot silently fall back to a room mockup.
export const streamPrimaryPaths = Object.freeze({
  "born-of-burn": "img/born_of_burn/3.webp",
  "by-marks-and-fire": "img/by_marks_and_fire/3.webp",
  "christmas-joy": "img/christmass_joy/1.jpeg",
  core: "img/core/2.webp",
  full: "img/full/full.jpeg",
  "july-pines": "img/july_pines/4.jpeg",
  moonglow: "img/moonglow/1.webp",
  "navy-of-the-dreamland": "img/navy_of_the_dreamland/navy.webp",
  "of-ash-and-flowers": "img/of_ash_and_flowers/of_ash.webp",
  prolisok: "img/prolisok/1.webp",
  "rise-in-blue": "img/rise_in_blue/2.webp",
  spectral: "img/spectral/2.webp",
  whales: "img/whales/whale.webp",
  winds: "img/winds/winds.webp",
  "spring-fire": "img/spring_fire/4.jpeg",
  "mermaid-s-dream": "img/mermaids_dream/4.jpeg",
  "golden-monstera": "img/golden_monstera/1.jpeg",
  "fragments-of-light": "img/fragments_of_light/5.jpeg",
  "november-forest": "img/november_forest/EEDFEC9D-738E-4534-BCA2-33C772BC0AB6_4_5005_c.jpeg",
  "their-shore": "img/their_shore/2.jpeg",
  "the-place-that-stays": "img/the_place_that_stays/the_place.jpeg",
  compass: "img/following_her_steps/iris_1/2.jpeg",
  choice: "img/following_her_steps/iris_2/1.jpeg",
  return: "img/following_her_steps/iris_3/1.jpeg",
  light: "img/following_her_steps/iris_4/light.jpeg",
  dreaming: "img/following_her_steps/iris_5/1.jpeg",
  grounded: "img/following_her_steps/iris_6/grounded.jpeg",
  after: "img/following_her_steps/iris_7/3.jpeg",
  release: "img/following_her_steps/iris_8/2.jpeg",
  clarity: "img/following_her_steps/iris_9/3.jpeg",
  "texas-storm": "img/texas_storm/2.jpeg",
  magnet: "img/magnet/3.jpeg",
});

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
  const streamPrimaryPath = streamPrimaryPaths[id];
  if (!streamPrimaryPath) throw new Error(`Missing stream primary for artwork: ${id}`);
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
    streamPrimaryPath,
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

export const catalogStats = Object.freeze({
  total: artworkRecords.length,
  available: artworkRecords.filter((artwork) => !artwork.sold).length,
  collected: artworkRecords.filter((artwork) => artwork.sold).length,
  highlightedAvailable: artworkRecords.filter((artwork) => artwork.highlighted && !artwork.sold).length,
});
