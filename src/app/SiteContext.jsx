import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { artworkById, getCatalog } from "../domain/catalog.js";
import { copy, isUkrainianPath, localeHref } from "../domain/content.js";
import { decodeFavoriteStorage, encodeFavoriteStorage } from "../domain/favorites.js";
import { getPageMetadata } from "../domain/metadata.js";
import { purgeExpiredEnvelopes, safeRead, safeRemove, safeWrite, storageKeys } from "../domain/storage.js";

const SiteContext = createContext(null);

function readLocale() {
  if (isUkrainianPath(window.location.pathname)) return "uk";
  const fromUrl = new URL(window.location.href).searchParams.get("lang");
  if (fromUrl === "uk" || fromUrl === "en") return fromUrl;
  const prerendered = document.getElementById("root")?.dataset.initialLocale;
  if (prerendered === "uk" || prerendered === "en") return prerendered;
  const stored = safeRead(storageKeys.language);
  if (stored === "uk" || stored === "en") return stored;
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return browserLanguages.some((language) => /^uk(?:-|$)/i.test(language)) ? "uk" : "en";
}

function readStoredTheme() {
  const raw = safeRead(storageKeys.theme);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value === "light" || value === "paper") return "paper";
    if (value === "dark" || value === "soil") return "soil";
    return null;
  } catch {
    return null;
  }
}

function readFavorites() {
  const raw = safeRead(storageKeys.favorites);
  const { known, unknown, corrupted, discard } = decodeFavoriteStorage(raw);
  if (discard) safeRemove(storageKeys.favorites);
  else if (corrupted) safeWrite(storageKeys.favorites, encodeFavoriteStorage(known, unknown));
  return { known, unknown, corrupted };
}

function updateDocumentMetadata(locale) {
  const metadata = getPageMetadata(document.body.dataset.page, locale);
  document.title = metadata.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = metadata.description;
  const openGraphTitle = document.querySelector('meta[property="og:title"]');
  if (openGraphTitle) openGraphTitle.content = metadata.title;
  const openGraphDescription = document.querySelector('meta[property="og:description"]');
  if (openGraphDescription) openGraphDescription.content = metadata.description;
  const localizedPath = localeHref(window.location.pathname, locale);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = new URL(localizedPath, window.location.origin).href;
  const openGraphUrl = document.querySelector('meta[property="og:url"]');
  if (openGraphUrl) openGraphUrl.content = new URL(localizedPath, window.location.origin).href;
}

function updateThemeColor(theme) {
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === "paper" ? "#e9e0d3" : "#15110e";
}

function applyDocumentTheme(theme) {
  document.documentElement.dataset.theme = theme;
  updateThemeColor(theme);
}

export function SiteProvider({ children, initialLocale = "en" }) {
  const [locale, setLocaleState] = useState(initialLocale === "uk" ? "uk" : "en");
  const [theme, setThemeState] = useState("soil");
  const [favorites, setFavorites] = useState([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [favoriteMigrationNotice, setFavoriteMigrationNotice] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const unknownFavorites = useRef([]);
  const themeIsExplicit = useRef(false);
  const catalog = useMemo(() => getCatalog(locale), [locale]);

  useEffect(() => {
    purgeExpiredEnvelopes();
    const nextLocale = readLocale();
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    updateDocumentMetadata(nextLocale);
    if (!safeWrite(storageKeys.language, nextLocale)) setStorageUnavailable(true);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const normalizedUrl = localeHref(currentUrl, nextLocale);
    if (normalizedUrl !== currentUrl) window.history.replaceState(window.history.state, "", normalizedUrl);
    const storedTheme = readStoredTheme();
    const colorScheme = window.matchMedia("(prefers-color-scheme: light)");
    const nextTheme = storedTheme ?? (colorScheme.matches ? "paper" : "soil");
    themeIsExplicit.current = storedTheme !== null;
    setThemeState(nextTheme);
    applyDocumentTheme(nextTheme);
    const stored = readFavorites();
    unknownFavorites.current = stored.unknown;
    setFavorites(stored.known);
    setFavoriteMigrationNotice(stored.corrupted);
    setFavoritesReady(true);
    const followSystemTheme = (event) => {
      if (themeIsExplicit.current) return;
      const systemTheme = event.matches ? "paper" : "soil";
      setThemeState(systemTheme);
      applyDocumentTheme(systemTheme);
    };
    colorScheme.addEventListener?.("change", followSystemTheme);
    return () => colorScheme.removeEventListener?.("change", followSystemTheme);
  }, []);

  const setLocale = useCallback((nextLocale) => {
    const normalized = nextLocale === "uk" ? "uk" : "en";
    setLocaleState(normalized);
    document.documentElement.lang = normalized;
    updateDocumentMetadata(normalized);
    if (!safeWrite(storageKeys.language, normalized)) setStorageUnavailable(true);
    const url = new URL(window.location.href);
    window.history.replaceState(window.history.state, "", localeHref(`${url.pathname}${url.search}${url.hash}`, normalized));
  }, []);

  const setTheme = useCallback((nextTheme) => {
    const normalized = nextTheme === "paper" ? "paper" : "soil";
    themeIsExplicit.current = true;
    setThemeState(normalized);
    applyDocumentTheme(normalized);
    if (!safeWrite(storageKeys.theme, JSON.stringify(normalized === "paper" ? "light" : "dark"))) {
      setStorageUnavailable(true);
    }
  }, []);

  const persistFavorites = useCallback((ids) => {
    const persisted = safeWrite(
      storageKeys.favorites,
      encodeFavoriteStorage(ids, unknownFavorites.current),
    );
    if (!persisted) setStorageUnavailable(true);
    return persisted;
  }, []);

  const toggleFavorite = useCallback((id) => {
    if (!artworkById.has(id)) return;
    const next = favorites.includes(id) ? favorites.filter((entry) => entry !== id) : [...favorites, id];
    persistFavorites(next);
    setFavorites(next);
  }, [favorites, persistFavorites]);

  const removeFavorite = useCallback((id) => {
    const next = favorites.filter((entry) => entry !== id);
    persistFavorites(next);
    setFavorites(next);
  }, [favorites, persistFavorites]);

  const clearFavorites = useCallback(() => {
    unknownFavorites.current = [];
    persistFavorites([]);
    setFavorites([]);
  }, [persistFavorites]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      theme,
      setTheme,
      t: copy[locale],
      catalog,
      favorites,
      favoritesReady,
      favoriteMigrationNotice,
      storageUnavailable,
      dismissFavoriteMigrationNotice: () => setFavoriteMigrationNotice(false),
      dismissStorageNotice: () => setStorageUnavailable(false),
      toggleFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [locale, setLocale, theme, setTheme, catalog, favorites, favoritesReady, favoriteMigrationNotice, storageUnavailable, toggleFavorite, removeFavorite, clearFavorites],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite must be used inside SiteProvider");
  return value;
}
