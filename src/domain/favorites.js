import { isBareLegacyPrefix, legacyArtworkId, normalizeArtworkId } from "./catalog.js";

// `knownArtworks` is any collection answering `has(id)` for published artwork ids.
export function normalizeFavoriteValues(values, knownArtworks) {
  if (!Array.isArray(values)) throw new Error("invalid favorites");
  const known = new Set();
  const unknown = new Set();
  let corrupted = false;
  for (const value of values) {
    if (typeof value !== "string") {
      corrupted = true;
      continue;
    }
    if (isBareLegacyPrefix(value)) {
      corrupted = true;
      continue;
    }
    const id = normalizeArtworkId(value);
    if (knownArtworks.has(id)) known.add(id);
    else unknown.add(value);
  }
  return { known: [...known], unknown: [...unknown], corrupted };
}

export function decodeFavoriteStorage(raw, knownArtworks) {
  if (!raw) return { known: [], unknown: [], corrupted: false, discard: false };
  try {
    return { ...normalizeFavoriteValues(JSON.parse(raw), knownArtworks), discard: false };
  } catch {
    return { known: [], unknown: [], corrupted: true, discard: true };
  }
}

export function encodeFavoriteStorage(known, unknown = []) {
  return JSON.stringify([...unknown, ...known.map(legacyArtworkId)]);
}
