import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { shellCopy } from "../content/copy/shell.js";
import { artworkById, getCatalog } from "../content/artworks.js";
import { decodeFavoriteStorage, encodeFavoriteStorage } from "../domain/favorites.js";
import { localeHref, normalizeLocale, resolveLocale } from "../domain/locale.js";
import { storageKeys } from "../domain/storage.js";
import { safeMatchMedia, subscribeMediaQuery } from "../platform/media-query.js";
import { purgeExpiredEnvelopes, safeRead, safeRemove, safeWrite } from "../platform/local-storage.js";
import { applyDocumentTheme, themeFromStoredValue, themeToStoredValue, updateDocumentMetadata } from "./document-head.js";

const SiteContext = createContext(null);

function browserLanguages() {
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

function readLocale() {
  return resolveLocale({
    pathname: window.location.pathname,
    search: window.location.search,
    prerendered: document.getElementById("root")?.dataset.initialLocale,
    stored: safeRead(storageKeys.language),
    languages: browserLanguages(),
  });
}

function readFavorites() {
  const raw = safeRead(storageKeys.favorites);
  const { known, unknown, corrupted, discard } = decodeFavoriteStorage(raw, artworkById);
  if (discard) safeRemove(storageKeys.favorites);
  else if (corrupted) safeWrite(storageKeys.favorites, encodeFavoriteStorage(known, unknown));
  return { known, unknown, corrupted };
}

export function SiteProvider({ children, initialLocale = "en" }) {
  const [locale, setLocaleState] = useState(normalizeLocale(initialLocale));
  const [theme, setThemeState] = useState("soil");
  const [favorites, setFavorites] = useState([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [favoriteMigrationNotice, setFavoriteMigrationNotice] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const unknownFavorites = useRef([]);
  const themeIsExplicit = useRef(false);
  const localeRef = useRef(normalizeLocale(initialLocale));
  const catalog = useMemo(() => getCatalog(locale), [locale]);

  // The one locale-apply sequence: state, document language and head, stored
  // preference, and the canonical localized URL (replaced only when it differs).
  const applyLocale = useCallback((nextLocale) => {
    localeRef.current = nextLocale;
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    updateDocumentMetadata(nextLocale);
    if (!safeWrite(storageKeys.language, nextLocale)) setStorageUnavailable(true);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const normalizedUrl = localeHref(currentUrl, nextLocale);
    if (normalizedUrl !== currentUrl) window.history.replaceState(window.history.state, "", normalizedUrl);
  }, []);

  useEffect(() => {
    purgeExpiredEnvelopes();
    applyLocale(readLocale());
    const storedTheme = themeFromStoredValue(safeRead(storageKeys.theme));
    const colorScheme = safeMatchMedia("(prefers-color-scheme: light)", window);
    const nextTheme = storedTheme ?? (colorScheme?.matches ? "paper" : "soil");
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
    return subscribeMediaQuery(colorScheme, followSystemTheme);
  }, [applyLocale]);

  useEffect(() => {
    const synchronizeLocaleFromHistory = () => applyLocale(localeRef.current);

    window.addEventListener("popstate", synchronizeLocaleFromHistory);
    return () => window.removeEventListener("popstate", synchronizeLocaleFromHistory);
  }, [applyLocale]);

  const setLocale = useCallback(
    (nextLocale) => applyLocale(normalizeLocale(nextLocale)),
    [applyLocale],
  );

  const setTheme = useCallback((nextTheme) => {
    const normalized = nextTheme === "paper" ? "paper" : "soil";
    themeIsExplicit.current = true;
    setThemeState(normalized);
    applyDocumentTheme(normalized);
    if (!safeWrite(storageKeys.theme, themeToStoredValue(normalized))) {
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
      t: shellCopy[locale],
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
