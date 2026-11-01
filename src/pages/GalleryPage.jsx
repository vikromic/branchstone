import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { catalogStats } from "../content/artworks.js";
import { artworkCopy } from "../content/copy/artwork.js";
import { galleryCopy } from "../content/copy/gallery.js";
import { ArtworkModal } from "../features/artwork/index.js";
import { WorksGrid, withArtworkTransition } from "../features/works/index.js";
import {
  catalogStatsFor,
  collectionLabel,
  collections,
  storyParagraphs,
} from "../domain/catalog.js";
import {
  artworkHref,
  findArtwork,
  galleryUrl,
  normalizeAvailability,
  relativeUrl,
  safeNormalizeCollection,
} from "../domain/gallery-url.js";
import { artworkContactHref } from "../domain/inquiry.js";
import { normalizeLocale } from "../domain/locale.js";
import "../styles/gallery.css";

const modalHistoryKey = "branchstoneArtworkModal";
const galleryCountRules = {
  en: new Intl.PluralRules("en"),
  uk: new Intl.PluralRules("uk"),
};

function currentGalleryUrl(update) {
  return galleryUrl(window.location.href, update);
}

function galleryWorkCount(count, locale) {
  const normalizedLocale = normalizeLocale(locale);
  const forms = galleryCopy[normalizedLocale].workForms;
  const category = galleryCountRules[normalizedLocale].select(count);
  return `${String(count).padStart(2, "0")} ${forms[category] ?? forms.other}`;
}

// Static artwork details for the time before hydration (and if it stalls):
// every grid link resolves to one of these anchors without JavaScript.
function ProgressiveArtworkDetails({ artworks, locale, t }) {
  const detailsCopy = artworkCopy[locale];
  return (
    <section className="gallery-progressive-details" aria-label={galleryCopy[locale].progressiveDetails}>
      {artworks.map((artwork) => {
        const story = storyParagraphs(artwork.story);
        const status = artwork.sold ? t.common.collected : t.common.available;
        return (
          <article
            key={artwork.id}
            id={`artwork-details-${artwork.id}`}
            className="gallery-progressive-detail"
            tabIndex="-1"
          >
            <header>
              <p className="kicker">
                {String(artwork.index + 1).padStart(2, "0")} / {artwork.collection} / {artwork.year}
              </p>
              <h2>{artwork.name}</h2>
            </header>
            <img
              src={artwork.streamPreview}
              alt={artwork.name}
              width={artwork.streamPreviewWidth}
              height={artwork.streamPreviewHeight}
              loading="lazy"
              decoding="async"
            />
            <dl>
              <div><dt>{detailsCopy.materials}</dt><dd>{artwork.materials}</dd></div>
              <div><dt>{detailsCopy.dimensions}</dt><dd>{artwork.dimensions}</dd></div>
              <div>
                <dt>{detailsCopy.availability}</dt>
                <dd>{status}{!artwork.sold && artwork.price ? ` · USD ${artwork.price}` : ""}</dd>
              </div>
            </dl>
            {story.length ? (
              <div className="gallery-progressive-detail__story">
                <h3>{detailsCopy.story}</h3>
                {story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            ) : null}
            {artwork.sold ? <p>{detailsCopy.collectedNote}</p> : null}
            <footer>
              {!artwork.sold || artwork.prints ? (
                <a className="button button--bone" href={artworkContactHref(artwork, locale, artwork.sold ? "print" : "original")}>
                  {artwork.sold ? detailsCopy.askAboutPrint : detailsCopy.inquireAboutOriginal}
                </a>
              ) : null}
              <a className="button" href={`#artwork-open-${artwork.id}`}>
                {galleryCopy[locale].backToArchive}
              </a>
            </footer>
          </article>
        );
      })}
    </section>
  );
}

export function GalleryPage() {
  const { catalog, locale, t } = useSite();
  const pageCopy = galleryCopy[locale];
  const [collection, setCollection] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [filtersReady, setFiltersReady] = useState(false);
  const [modalId, setModalId] = useState(null);
  const historyClosePending = useRef(false);
  const triggerRef = useRef(null);
  const previousModalId = useRef(null);

  const synchronizeFromUrl = useCallback((state = window.history.state) => {
    const url = new URL(window.location.href);
    const rawCollection = url.searchParams.get("collection");
    const normalizedCollection = safeNormalizeCollection(rawCollection);
    const rawAvailability = url.searchParams.get("availability");
    const normalizedAvailability = normalizeAvailability(rawAvailability);
    setCollection(normalizedCollection);
    setAvailability(normalizedAvailability);

    const canonicalArtwork = url.searchParams.get("art");
    const legacyArtwork = url.searchParams.get("artwork");
    const hashArtwork = url.hash.startsWith("#artwork-details-")
      ? url.hash.slice("#artwork-details-".length)
      : null;
    const canonicalMatch = findArtwork(catalog, canonicalArtwork);
    const legacyMatch = findArtwork(catalog, legacyArtwork);
    const hashMatch = findArtwork(catalog, hashArtwork);
    const artwork = canonicalMatch || legacyMatch || hashMatch;
    let changed = false;

    if (rawCollection && normalizedCollection === "all") {
      url.searchParams.delete("collection");
      changed = true;
    } else if (rawCollection && rawCollection !== normalizedCollection) {
      url.searchParams.set("collection", normalizedCollection);
      changed = true;
    }

    if (rawAvailability && normalizedAvailability === "all") {
      url.searchParams.delete("availability");
      changed = true;
    }

    if (legacyArtwork || hashArtwork) {
      if (artwork) url.searchParams.set("art", artwork.id);
      else url.searchParams.delete("art");
      url.searchParams.delete("artwork");
      if (hashArtwork) url.hash = "";
      changed = true;
    } else if (canonicalArtwork && !canonicalMatch) {
      url.searchParams.delete("art");
      changed = true;
    } else if (canonicalArtwork && canonicalArtwork !== canonicalMatch?.id) {
      url.searchParams.set("art", canonicalMatch.id);
      changed = true;
    }

    if (changed) window.history.replaceState(state, "", relativeUrl(url));
    historyClosePending.current = false;
    setModalId(artwork?.id ?? null);
  }, [catalog]);

  useEffect(() => {
    synchronizeFromUrl();
    setFiltersReady(true);
    const onPopState = (event) => synchronizeFromUrl(event.state);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [synchronizeFromUrl]);

  useEffect(() => {
    const closedArtworkId = previousModalId.current;
    previousModalId.current = modalId;
    if (!closedArtworkId || modalId) return undefined;
    const focusFrame = requestAnimationFrame(() => {
      const savedTrigger = triggerRef.current;
      const savedTarget = savedTrigger?.id === closedArtworkId && savedTrigger.node?.isConnected
        ? savedTrigger.node
        : null;
      const archiveTarget = document.getElementById(`artwork-open-${closedArtworkId}`);
      const target = savedTarget || archiveTarget || document.getElementById("works-title");
      target?.focus?.({ preventScroll: Boolean(savedTarget || archiveTarget) });
      if (!savedTarget && archiveTarget) {
        archiveTarget.scrollIntoView?.({ block: "center", behavior: "instant" });
      }
      triggerRef.current = null;
    });
    return () => globalThis.cancelAnimationFrame?.(focusFrame);
  }, [modalId]);

  const selectCollection = (nextCollection) => {
    setCollection(nextCollection);
    const href = currentGalleryUrl((search) => {
      if (nextCollection === "all") search.delete("collection");
      else search.set("collection", nextCollection);
    });
    window.history.replaceState(window.history.state, "", href);
  };

  const selectAvailability = (nextAvailability) => {
    const normalizedAvailability = normalizeAvailability(nextAvailability);
    setAvailability(normalizedAvailability);
    const href = currentGalleryUrl((search) => {
      if (normalizedAvailability === "all") search.delete("availability");
      else search.set("availability", normalizedAvailability);
    });
    window.history.replaceState(window.history.state, "", href);
  };

  const openArtwork = useCallback((id, trigger) => {
    triggerRef.current = { id, node: trigger };
    if (new URL(window.location.href).searchParams.get("art") === id) return;
    const href = currentGalleryUrl((search) => {
      search.delete("artwork");
      search.set("art", id);
    });
    const nextState = { ...(window.history.state || {}), [modalHistoryKey]: id };
    window.history.pushState(nextState, "", href);
    withArtworkTransition(trigger, () => setModalId(id));
  }, []);

  const closeArtwork = useCallback(() => {
    if (historyClosePending.current) return;
    if (window.history.state?.[modalHistoryKey] === modalId) {
      historyClosePending.current = true;
      window.history.back();
      return;
    }
    const href = currentGalleryUrl((search) => {
      search.delete("art");
      search.delete("artwork");
    });
    const url = new URL(href, window.location.href);
    if (url.hash === `#artwork-details-${modalId}`) url.hash = "";
    window.history.replaceState(window.history.state, "", relativeUrl(url));
    setModalId(null);
  }, [modalId]);

  const collectionWorks = useMemo(
    () => collection === "all"
      ? catalog
      : catalog.filter((artwork) => artwork.collectionId === collection),
    [catalog, collection],
  );
  const availabilityStats = useMemo(() => catalogStatsFor(collectionWorks), [collectionWorks]);
  const visibleWorks = useMemo(
    () => availability === "all"
      ? collectionWorks
      : collectionWorks.filter((artwork) => (
        (availability === "available" && !artwork.sold)
        || (availability === "collected" && artwork.sold)
      )),
    [availability, collectionWorks],
  );
  const modalArtwork = modalId ? findArtwork(catalog, modalId) : null;
  const modalSequence = useMemo(
    () => modalArtwork && visibleWorks.some(({ id }) => id === modalArtwork.id)
      ? visibleWorks
      : modalArtwork ? [modalArtwork] : [],
    [modalArtwork, visibleWorks],
  );
  const modalPosition = modalArtwork
    ? modalSequence.findIndex(({ id }) => id === modalArtwork.id)
    : -1;
  const stepModalArtwork = useCallback((direction) => {
    if (modalPosition < 0 || modalSequence.length < 2) return;
    const nextPosition = (modalPosition + direction + modalSequence.length) % modalSequence.length;
    const nextArtwork = modalSequence[nextPosition];
    const href = currentGalleryUrl((search) => {
      search.delete("artwork");
      search.set("art", nextArtwork.id);
    });
    const url = new URL(href, window.location.href);
    if (url.hash.startsWith("#artwork-details-")) {
      url.hash = `#artwork-details-${nextArtwork.id}`;
    }
    const currentState = window.history.state;
    const nextState = Object.prototype.hasOwnProperty.call(currentState ?? {}, modalHistoryKey)
      ? { ...currentState, [modalHistoryKey]: nextArtwork.id }
      : currentState;
    window.history.replaceState(nextState, "", relativeUrl(url));
    setModalId(nextArtwork.id);
  }, [modalPosition, modalSequence]);

  return (
    <SiteShell page="gallery">
      <section className="page-intro works-intro" aria-labelledby="works-title">
        <p className="kicker">{pageCopy.indexEyebrow}</p>
        <h1 id="works-title" className="display" tabIndex="-1">{pageCopy.title}</h1>
        <div className="works-intro__row">
          <p className="lede">{pageCopy.introduction}</p>
          <dl className="facts" aria-label={pageCopy.statusLabel}>
            <div><dt>{pageCopy.allWorks}</dt><dd>{catalogStats.total}</dd></div>
            <div><dt>{t.common.available}</dt><dd>{catalogStats.available}</dd></div>
            <div><dt>{t.common.collected}</dt><dd>{catalogStats.collected}</dd></div>
          </dl>
        </div>
      </section>

      <section className="works-controls" aria-labelledby="filters-title">
        <h2 id="filters-title" className="sr-only">{pageCopy.findWork}</h2>
        <div className="works-controls__scroller">
          <div className="segmented" role="group" aria-label={pageCopy.availabilityFilter}>
            {[
              ["all", t.common.all, collectionWorks.length],
              ["available", t.common.available, availabilityStats.available],
              ["collected", t.common.collected, availabilityStats.collected],
            ].map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                disabled={!filtersReady}
                aria-pressed={availability === id}
                onClick={() => selectAvailability(id)}
              >
                {id === "available" ? <span className="status-dot" data-sold="false" aria-hidden="true" /> : null}
                {label}
                <small>{count}</small>
              </button>
            ))}
          </div>
          <div className="works-controls__collections" role="group" aria-label={pageCopy.collectionFilter}>
            <button
              className="pill"
              type="button"
              disabled={!filtersReady}
              aria-pressed={collection === "all"}
              onClick={() => selectCollection("all")}
            >
              {pageCopy.allCollections}
            </button>
            {collections.map((record) => (
              <button
                key={record.id}
                className="pill"
                type="button"
                disabled={!filtersReady}
                aria-pressed={collection === record.id}
                onClick={() => selectCollection(record.id)}
              >
                {collectionLabel(record.id, locale)}
              </button>
            ))}
          </div>
        </div>
        <p className="works-controls__count" aria-live="polite" aria-atomic="true">
          {galleryWorkCount(visibleWorks.length, locale)}
        </p>
      </section>

      <section className="works-archive" aria-label={pageCopy.archive}>
        {visibleWorks.length ? (
          <WorksGrid
            artworks={visibleWorks}
            locale={locale}
            t={t}
            hrefFor={(artwork) => artworkHref(artwork.id, collection, availability, !filtersReady)}
            onOpen={filtersReady ? openArtwork : undefined}
            eagerCount={6}
          />
        ) : (
          <div className="works-empty" role="status">
            <p>{pageCopy.empty}</p>
            <button className="button" type="button" onClick={() => { selectCollection("all"); selectAvailability("all"); }}>
              {pageCopy.showAll}
            </button>
          </div>
        )}
        {filtersReady ? null : <ProgressiveArtworkDetails artworks={visibleWorks} locale={locale} t={t} />}
      </section>

      {modalArtwork ? (
        <ArtworkModal
          artwork={modalArtwork}
          onClose={closeArtwork}
          onStepWork={stepModalArtwork}
          workCount={modalSequence.length}
          workPosition={modalPosition + 1}
        />
      ) : null}
    </SiteShell>
  );
}
