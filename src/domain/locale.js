const ukrainianLanguage = /^uk(?:-|$)/i;

function isLocale(value) {
  return value === "uk" || value === "en";
}

export function normalizeLocale(value) {
  return value === "uk" ? "uk" : "en";
}

export function isUkrainianPath(pathname) {
  return pathname === "/uk" || pathname.startsWith("/uk/");
}

export function localePathname(pathname, locale) {
  const isLocalized = isUkrainianPath(pathname);
  if (locale === "uk" && !isLocalized) return pathname === "/" ? "/uk/" : `/uk${pathname}`;
  if (locale !== "uk" && isLocalized) return pathname === "/uk" || pathname === "/uk/" ? "/" : pathname.slice(3);
  return pathname;
}

export function localeHref(path, locale) {
  const url = new URL(path, "https://branchstone.art");
  url.pathname = localePathname(url.pathname, locale);
  url.searchParams.delete("lang");
  return `${url.pathname}${url.search}${url.hash}`;
}

// Single precedence for every runtime locale decision: Ukrainian path, explicit
// ?lang=, the prerendered page locale, a stored preference, then browser
// languages. Callers that must not consult a signal (the hydration-time initial
// locale ignores storage and browser languages) simply leave it undefined.
export function resolveLocale({ pathname, search = "", prerendered, stored, languages = [] }) {
  if (isUkrainianPath(pathname)) return "uk";
  const fromUrl = new URLSearchParams(search).get("lang");
  if (isLocale(fromUrl)) return fromUrl;
  if (isLocale(prerendered)) return prerendered;
  if (isLocale(stored)) return stored;
  return languages.some((language) => ukrainianLanguage.test(language)) ? "uk" : "en";
}
