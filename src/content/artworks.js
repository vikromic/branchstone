import englishSource from "../../docs/json_data/artworks.json";
import ukrainianSource from "../../docs/json_data/ukr/artworks_uk.json";
import {
  buildArtworkRecords,
  catalogStatsFor,
  localizeCatalog,
} from "../domain/catalog.js";
import { streamPrimaryMedia } from "./artwork-media.js";
import { assetUrl } from "./asset-url.js";

const previewModules = import.meta.glob(
  "../assets/artwork-index/*.webp",
  { eager: true, import: "default", query: "?url" },
);

const previews = Object.fromEntries(
  Object.entries(previewModules).map(([path, url]) => [
    path.slice(path.lastIndexOf("/") + 1, -".webp".length),
    url,
  ]),
);

export const artworkRecords = Object.freeze(buildArtworkRecords({
  englishArtworks: englishSource.artworks,
  ukrainianArtworks: ukrainianSource.artworks,
  primaryMedia: streamPrimaryMedia,
  previews,
}));
export const artworkById = new Map(artworkRecords.map((artwork) => [artwork.id, artwork]));

export function getCatalog(locale = "en") {
  return localizeCatalog(artworkRecords, locale, assetUrl);
}

export const catalogStats = Object.freeze(catalogStatsFor(artworkRecords));
