import { artworkById, normalizeArtworkId } from "./catalog.js";

export function normalizeFavoriteValues(values) {
  if (!Array.isArray(values)) throw new Error("invalid favorites");
  const known = new Set();
  const unknown = new Set();
  let corrupted = false;
  for (const value of values) {
    if (typeof value !== "string") {
      corrupted = true;
      continue;
    }
    if (value === "artwork-") {
      corrupted = true;
      continue;
    }
    const id = normalizeArtworkId(value);
    if (artworkById.has(id)) known.add(id);
    else unknown.add(value);
  }
  return { known: [...known], unknown: [...unknown], corrupted };
}

export function decodeFavoriteStorage(raw) {
  if (!raw) return { known: [], unknown: [], corrupted: false, discard: false };
  try {
    return { ...normalizeFavoriteValues(JSON.parse(raw)), discard: false };
  } catch {
    return { known: [], unknown: [], corrupted: true, discard: true };
  }
}

export function encodeFavoriteStorage(known, unknown = []) {
  return JSON.stringify([...unknown, ...known.map((id) => `artwork-${id}`)]);
}
