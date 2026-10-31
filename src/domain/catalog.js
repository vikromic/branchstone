// Pure catalog rules: collection taxonomy, id normalization, record assembly,
// locale projection, home selection, story text and statistics. Source data,
// preview assets and URL resolution are supplied by `content/artworks.js`.

const slugify = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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

export function collectionLabel(id, locale = "en") {
  return collections.find((collection) => collection.id === id)?.[locale] ?? id;
}

const LEGACY_ID_PREFIX = "artwork-";
const artworkAliases = new Map([["mermaids-dream", "mermaid-s-dream"]]);

export const legacyArtworkId = (id) => `${LEGACY_ID_PREFIX}${id}`;
export const isBareLegacyPrefix = (value) => value === LEGACY_ID_PREFIX;

export function normalizeArtworkId(value) {
  const raw = String(value || "");
  const id = raw.startsWith(LEGACY_ID_PREFIX) ? raw.slice(LEGACY_ID_PREFIX.length) : raw;
  return artworkAliases.get(id) ?? id;
}

// Joins the English source, its Ukrainian counterpart (matched by main image),
// the explicit primary media and the generated preview into one record per work.
export function buildArtworkRecords({ englishArtworks, ukrainianArtworks, primaryMedia, previews }) {
  const ukrainianByImage = new Map(
    ukrainianArtworks.map((artwork) => [artwork.main_image, artwork]),
  );
  return englishArtworks.map((english, index) => {
    const ukrainian = ukrainianByImage.get(english.main_image) ?? english;
    const id = slugify(english.name);
    const collectionId = normalizeCollection(english.collection);
    const directory = english.main_image.slice(0, english.main_image.lastIndexOf("/") + 1);
    const imagePaths = [english.main_image, ...(english.images ?? []).map((image) => `${directory}${image}`)];
    const streamPrimary = primaryMedia[id];
    if (!streamPrimary) throw new Error(`Missing stream primary for artwork: ${id}`);
    const streamPreview = previews[id];
    if (!streamPreview) throw new Error(`Missing stream preview for artwork: ${id}`);
    const streamPreviewWidth = Math.min(720, streamPrimary.width);
    return {
      id,
      legacyId: legacyArtworkId(id),
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
}

function localizeArtwork(record, locale, toAssetUrl) {
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
    streamPrimary: toAssetUrl(record.streamPrimaryPath),
    streamPreview: record.streamPreview,
    streamSrcSet: record.streamPreviewWidth < record.streamPrimaryWidth
      ? `${record.streamPreview} ${record.streamPreviewWidth}w, ${toAssetUrl(record.streamPrimaryPath)} ${record.streamPrimaryWidth}w`
      : undefined,
    mainImage: toAssetUrl(record.imagePaths[0]),
    images: record.imagePaths.map(toAssetUrl),
  };
}

export function localizeCatalog(records, locale, toAssetUrl) {
  return records.map((record) => localizeArtwork(record, locale, toAssetUrl));
}

export const HOME_PINNED_ARTWORK_ID = "july-pines";

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

// Story text is authored as paragraphs separated by blank lines. The home
// excerpt reads only the first non-empty line, so it splits on any line break.
export function storyParagraphs(story, minimumBreak = 2) {
  return String(story)
    .split(new RegExp(`\\n{${minimumBreak},}`))
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function storyExcerpt(story, limit = 190) {
  const [paragraph = ""] = storyParagraphs(story, 1);
  if (paragraph.length <= limit) return paragraph;
  const clipped = paragraph.slice(0, limit + 1).replace(/\s+\S*$/, "").trim();
  return `${clipped || paragraph.slice(0, limit).trim()}…`;
}

export function catalogStatsFor(artworks) {
  return artworks.reduce((stats, artwork) => {
    stats.total += 1;
    stats[artwork.sold ? "collected" : "available"] += 1;
    if (artwork.highlighted && !artwork.sold) stats.highlightedAvailable += 1;
    return stats;
  }, { total: 0, available: 0, collected: 0, highlightedAvailable: 0 });
}
