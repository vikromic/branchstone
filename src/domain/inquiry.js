import { normalizeArtworkId } from "./catalog.js";
import { localeHref } from "./locale.js";

// Inquiries reach the contact page by one of two transports: the `pendingInquiry`
// storage envelope (saved works) or the `art=` / `message=` URL (direct links and
// the storage-unavailable fallback). This module owns both shapes and the
// generated message text.

export function contactInquiryHref(locale, message, artworkIds = []) {
  const search = new URLSearchParams();
  const ids = Array.isArray(artworkIds) ? artworkIds : [artworkIds];
  ids.filter(Boolean).forEach((id) => search.append("art", id));
  search.set("message", message);
  return localeHref(`/contact.html?${search.toString()}`, locale);
}

export function artworkContactHref(artwork, locale, kind = "original") {
  const message = kind === "print"
    ? locale === "uk"
      ? `Вітаю, мене цікавить принт роботи «${artwork.name}».`
      : `Hello, I’m interested in a print of “${artwork.name}.”`
    : locale === "uk"
      ? `Вітаю, мене цікавить оригінал роботи «${artwork.name}». Будь ласка, розкажіть про актуальну доступність та умови придбання.`
      : `Hello, I’m interested in the original work “${artwork.name}.” Please share its current availability and acquisition details.`;
  return contactInquiryHref(locale, message, artwork.id);
}

export function savedWorksInquiryPayload(saved) {
  return { artworks: saved.map(({ id, name }) => ({ id, name })) };
}

export function savedWorksContactHref(saved, locale) {
  const names = saved.map(({ name }) => name).join(", ");
  const message = locale === "uk"
    ? `Вітаю, мене цікавлять ці роботи: ${names}.`
    : `Hello, I’m interested in these works: ${names}.`;
  return contactInquiryHref(locale, message, saved.map(({ id }) => id));
}

// Resolves one stored inquiry entry against the catalog. Older entries carried
// `title` instead of `name`; works that no longer exist keep their stored title.
export function resolveInquiryEntry(entry, catalog) {
  if (!entry || typeof entry !== "object") return null;
  const id = normalizeArtworkId(entry.id);
  const title = String(entry.name || entry.title || "").trim();
  const artwork =
    catalog.find((item) => item.id === id) ??
    catalog.find((item) => title && item.name.toLocaleLowerCase() === title.toLocaleLowerCase());

  if (artwork) return { id: artwork.id, fallbackTitle: title };
  if (!title) return null;
  return {
    id: `unresolved-${title}`,
    fallbackTitle: title,
    fallbackImage: typeof entry.image === "string" ? entry.image : "",
    fallbackCollection: typeof entry.collection === "string" ? entry.collection : "",
  };
}
