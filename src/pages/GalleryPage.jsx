import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CaretDown } from "@phosphor-icons/react";
import { SiteShell } from "../app/SiteShell.jsx";
import {
  artworkContactHref,
  artworkImageUnavailableLabel,
  ArtworkModal,
  ArtworkNarrative,
  ArtworkSurface,
  storyParagraphs,
} from "../features/ArtworkModal.jsx";
import { StayReveal, useViewportArtworkSelection } from "../features/stay/index.js";
import {
  catalogStats,
  catalogStatsFor,
  collectionLabel,
  collections,
  normalizeArtworkId,
  normalizeCollection,
} from "../domain/catalog.js";
import { safeMatchMedia, subscribeMediaQuery } from "../domain/media-query.js";
import { useSite } from "../app/SiteContext.jsx";
import gallerySeamMobile from "../assets/material-stage/gallery-seam-mobile.webp";
import gallerySeamDesktop from "../assets/material-stage/gallery-seam-desktop.webp";
import "../styles/gallery.css";

const modalHistoryKey = "branchstoneArtworkModal";
const desktopGalleryQuery = "(min-width: 760px)";
const galleryIndexMinAspect = 4 / 5;
const galleryIndexMaxAspect = 5 / 4;
const galleryCountRules = {
  en: new Intl.PluralRules("en"),
  uk: new Intl.PluralRules("uk"),
};

function subscribeDesktopGallery(callback) {
  if (typeof window === "undefined") return () => {};
  return subscribeMediaQuery(safeMatchMedia(desktopGalleryQuery, window), callback);
}

function desktopGallerySnapshot() {
  return typeof window !== "undefined"
    && Boolean(safeMatchMedia(desktopGalleryQuery, window)?.matches);
}

function useDesktopGallery() {
  return useSyncExternalStore(
    subscribeDesktopGallery,
    desktopGallerySnapshot,
    () => false,
  );
}

function relativeUrl(url) {
  return `${url.pathname}${url.search}${url.hash}`;
}

function galleryUrl(update) {
  const url = new URL(window.location.href);
  update(url.searchParams);
  return relativeUrl(url);
}

function findArtwork(catalog, value) {
  if (!value) return null;
  let id;
  try {
    id = normalizeArtworkId(decodeURIComponent(String(value)));
  } catch {
    return null;
  }
  return catalog.find((artwork) => artwork.id === id) ?? null;
}

function safeNormalizeCollection(value) {
  try {
    return normalizeCollection(value);
  } catch {
    return "all";
  }
}

function normalizeAvailability(value) {
  return value === "available" || value === "collected" ? value : "all";
}

function galleryIndexAspect(artwork) {
  const width = artwork.streamPrimaryWidth;
  const height = artwork.streamPrimaryHeight;
  if (
    !Number.isFinite(width)
    || width <= 0
    || !Number.isFinite(height)
    || height <= 0
  ) {
    throw new Error(`Invalid Gallery preview dimensions: ${artwork.id}`);
  }

  const ratio = width / height;
  if (ratio <= galleryIndexMinAspect) return "4 / 5";
  if (ratio >= galleryIndexMaxAspect) return "5 / 4";
  return `${width} / ${height}`;
}

function galleryIndexStyle(artwork) {
  const aspect = galleryIndexAspect(artwork);
  const ratio = artwork.streamPrimaryWidth / artwork.streamPrimaryHeight;
  const orientation = ratio <= galleryIndexMinAspect
    ? "portrait"
    : ratio >= galleryIndexMaxAspect
      ? "landscape"
      : "square";
  const estimates = {
    portrait: ["24rem", "31rem"],
    square: ["21rem", "26rem"],
    landscape: ["19rem", "23rem"],
  };
  const [estimate, narrowEstimate] = estimates[orientation];

  return {
    "--gallery-index-aspect": aspect,
    "--gallery-index-estimate": estimate,
    "--gallery-index-estimate-narrow": narrowEstimate,
  };
}

function galleryWorkCount(count, locale) {
  const normalizedLocale = locale === "uk" ? "uk" : "en";
  const forms = normalizedLocale === "uk"
    ? { one: "робота", few: "роботи", many: "робіт", other: "роботи" }
    : { one: "work", other: "works" };
  const category = galleryCountRules[normalizedLocale].select(count);
  return `${String(count).padStart(2, "0")} ${forms[category] ?? forms.other}`;
}

function mobileArtworkHref(artworkId, collection, availability, progressiveOnly = false) {
  if (progressiveOnly) return `#artwork-details-${artworkId}`;
  const search = new URLSearchParams();
  if (collection !== "all") search.set("collection", collection);
  if (availability !== "all") search.set("availability", availability);
  search.set("art", artworkId);
  return `?${search}#artwork-details-${artworkId}`;
}

function ProgressiveArtworkDetails({ artworks, locale, t }) {
  return (
    <section
      className="gallery-progressive-details"
      aria-label={locale === "uk" ? "Деталі робіт" : "Artwork details"}
    >
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
              <p>
                {String(artwork.index + 1).padStart(2, "0")}
                {" / "}
                {artwork.collection}
                {" / "}
                {artwork.year}
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
              <div>
                <dt>{locale === "uk" ? "Матеріали" : "Materials"}</dt>
                <dd>{artwork.materials}</dd>
              </div>
              <div>
                <dt>{locale === "uk" ? "Розмір" : "Dimensions"}</dt>
                <dd>{artwork.dimensions}</dd>
              </div>
              <div>
                <dt>{locale === "uk" ? "Доступність" : "Availability"}</dt>
                <dd>
                  {status}
                  {!artwork.sold && artwork.price ? ` · USD ${artwork.price}` : ""}
                </dd>
              </div>
            </dl>
            {story.length ? (
              <div className="gallery-progressive-detail__story">
                <h3>{locale === "uk" ? "Історія" : "Story"}</h3>
                {story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            ) : null}
            {artwork.sold ? (
              <p className="gallery-progressive-detail__collected-note">
                {locale === "uk"
                  ? "Робота у приватній колекції."
                  : "This work is held in a private collection."}
              </p>
            ) : null}
            <footer>
              {!artwork.sold || artwork.prints ? (
                <a href={artworkContactHref(artwork, locale, artwork.sold ? "print" : "original")}>
                  {artwork.sold
                    ? locale === "uk" ? "Запитати про принт" : "Ask about a print"
                    : locale === "uk" ? "Запитати про оригінал" : "Inquire about the original"}
                </a>
              ) : null}
              <a href={`#artwork-open-${artwork.id}`}>
                {locale === "uk" ? "Назад до архіву" : "Back to the archive"}
              </a>
            </footer>
          </article>
        );
      })}
    </section>
  );
}

function MobileGalleryIndex({
  artworks,
  availability,
  collection,
  locale,
  onOpen,
  t,
}) {
  const [showProgressiveDetails, setShowProgressiveDetails] = useState(true);
  const [failedPreviews, setFailedPreviews] = useState(() => new Set());

  useEffect(() => {
    setShowProgressiveDetails(false);
  }, []);

  const setPreviewFailed = useCallback((artworkId, failed) => {
    setFailedPreviews((current) => {
      if (current.has(artworkId) === failed) return current;
      const next = new Set(current);
      if (failed) next.add(artworkId);
      else next.delete(artworkId);
      return next;
    });
  }, []);

  return (
    <>
      <ol className="gallery-mobile-index" role="list">
        {artworks.map((artwork, position) => {
          const titleId = `gallery-index-${artwork.id}-title`;
          const statusId = `gallery-index-${artwork.id}-status`;
          const viewId = `gallery-index-${artwork.id}-view`;
          const status = artwork.sold ? t.common.collected : t.common.available;
          const previewFailed = failedPreviews.has(artwork.id);
          return (
            <li
              key={artwork.id}
              className="gallery-index-work"
              data-sold={artwork.sold ? "true" : "false"}
              style={galleryIndexStyle(artwork)}
            >
              <article aria-labelledby={titleId}>
                <a
                  id={`artwork-open-${artwork.id}`}
                  className="gallery-index-work__link"
                  href={mobileArtworkHref(
                    artwork.id,
                    collection,
                    availability,
                    showProgressiveDetails,
                  )}
                  aria-haspopup={showProgressiveDetails ? undefined : "dialog"}
                  aria-labelledby={`${titleId} ${statusId} ${viewId}`}
                  onClick={(event) => {
                    if (
                      event.button !== 0
                      || event.metaKey
                      || event.ctrlKey
                      || event.shiftKey
                      || event.altKey
                    ) return;
                    event.preventDefault();
                    onOpen(artwork.id, event.currentTarget);
                  }}
                >
                  <span
                    className="gallery-index-work__visual"
                    data-preview-error={previewFailed ? "true" : "false"}
                  >
                    <img
                      src={artwork.streamPreview}
                      alt=""
                      width={artwork.streamPreviewWidth}
                      height={artwork.streamPreviewHeight}
                      loading={position < 2 ? "eager" : "lazy"}
                      fetchPriority={position < 2 ? "high" : "auto"}
                      decoding="async"
                      draggable="false"
                      onLoad={() => setPreviewFailed(artwork.id, false)}
                      onError={() => setPreviewFailed(artwork.id, true)}
                    />
                    {previewFailed ? (
                      <span className="gallery-index-work__preview-error">
                        {artworkImageUnavailableLabel(locale)}
                      </span>
                    ) : null}
                  </span>
                  <span className="gallery-index-work__ledger">
                    <span>{String(artwork.index + 1).padStart(2, "0")}</span>
                    <span>{artwork.collection}</span>
                    <span>{artwork.year}</span>
                  </span>
                  <div className="gallery-index-work__identity">
                    <h2 id={titleId}>{artwork.name}</h2>
                    <span
                      id={statusId}
                      className="gallery-index-work__status"
                      data-sold={artwork.sold ? "true" : "false"}
                    >
                      {status}
                    </span>
                  </div>
                  <span id={viewId} className="gallery-index-work__view">
                    {t.common.view}
                    <span aria-hidden="true">+</span>
                  </span>
                </a>
              </article>
            </li>
          );
        })}
      </ol>
      {showProgressiveDetails ? (
        <ProgressiveArtworkDetails artworks={artworks} locale={locale} t={t} />
      ) : null}
    </>
  );
}

const WorkRecord = memo(function WorkRecord({
  artwork,
  position,
  isActive,
  isFavorite,
  onActivate,
  onRegister,
  onOpen,
  onFavorite,
  locale,
  t,
}) {
  const articleRef = useRef(null);
  const controllerRef = useRef(null);
  const explicitRevealRef = useRef(false);
  const [stayAnnouncement, setStayAnnouncement] = useState("");
  const titleId = `gallery-work-${artwork.id}-title`;
  const descriptionId = `gallery-work-${artwork.id}-story`;

  const setArticleRef = useCallback((node) => {
    articleRef.current = node;
    onRegister(artwork.id, node);
  }, [artwork.id, onRegister]);

  useEffect(() => {
    if (!isActive) {
      setStayAnnouncement("");
      return;
    }
    const focusedInside = articleRef.current?.contains(document.activeElement);
    if (!explicitRevealRef.current && !focusedInside) return;
    explicitRevealRef.current = false;
    controllerRef.current?.settle();
  }, [isActive]);

  const activate = () => onActivate(artwork.id);

  const reveal = () => {
    if (isActive) {
      controllerRef.current?.settle();
      return;
    }
    explicitRevealRef.current = true;
    activate();
  };

  const surfaceArtwork = {
    ...artwork,
    locale,
    viewLabel: t.common.view,
  };

  return (
    <StayReveal
      as="article"
      ref={setArticleRef}
      controllerRef={controllerRef}
      className="gallery-work"
      activeKey={artwork.id}
      active={isActive}
      observeWindowScroll={isActive}
      waitForArtwork
      phasePresence={{ materials: true, story: storyParagraphs(artwork.story).length > 0, availability: true }}
      onPhaseChange={(phase, state) => {
        if (state !== "resolved" || !isActive) return;
        const phaseLabels = locale === "uk"
          ? { materials: "Матеріали відкрито.", story: "Історію відкрито.", availability: "Доступність відкрито." }
          : { materials: "Materials revealed.", story: "Story revealed.", availability: "Availability revealed." };
        if (phaseLabels[phase]) setStayAnnouncement(phaseLabels[phase]);
      }}
      data-artwork-id={artwork.id}
      data-gallery-active={isActive ? "true" : "false"}
      data-sold={artwork.sold ? "true" : "false"}
      aria-labelledby={titleId}
    >
      <ArtworkSurface
        artwork={surfaceArtwork}
        src={artwork.streamPrimary}
        srcSet={artwork.streamSrcSet}
        sizes="(min-width: 1180px) 58vw, (min-width: 760px) 54vw, 100vw"
        width={artwork.streamPrimaryWidth}
        height={artwork.streamPrimaryHeight}
        alt={artwork.name}
        className="gallery-work__visual"
        loading={position === 0 ? "eager" : "lazy"}
        fetchPriority={position === 0 ? "high" : "auto"}
        recoverable={isActive}
        onOpen={(event) => onOpen(artwork.id, event.currentTarget)}
        openId={`artwork-open-${artwork.id}`}
      />

      <ArtworkNarrative
        artwork={artwork}
        locale={locale}
        t={t}
        isFavorite={isFavorite}
        onFavorite={onFavorite}
        onReveal={reveal}
        onOpen={(event) => onOpen(artwork.id, event.currentTarget)}
        titleId={titleId}
        descriptionId={descriptionId}
      />
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {isActive ? stayAnnouncement : ""}
      </span>
    </StayReveal>
  );
});

function GalleryStream({ artworks, favoriteIds, locale, onFavorite, onOpen, t }) {
  const {
    activeId,
    activateArtwork,
    registerArtwork,
  } = useViewportArtworkSelection(artworks);
  const recoveryFocusOwnerRef = useRef(null);

  useLayoutEffect(() => {
    const recoveryOwner = recoveryFocusOwnerRef.current;
    if (!recoveryOwner || recoveryOwner === activeId) return;
    recoveryFocusOwnerRef.current = null;

    const activeElement = document.activeElement;
    const focusWasLost = !activeElement
      || activeElement === document.body
      || !activeElement.isConnected;
    if (!focusWasLost || !activeId) return;
    document.getElementById(`artwork-open-${activeId}`)
      ?.focus?.({ preventScroll: true });
  }, [activeId]);

  return (
    <div
      className="gallery-stream"
      onFocusCapture={(event) => {
        const retry = event.target.closest?.(".artwork-surface__recovery button");
        if (!retry) return;
        recoveryFocusOwnerRef.current = retry
          .closest("[data-artwork-id]")
          ?.dataset.artworkId ?? null;
      }}
    >
      {artworks.map((artwork, position) => (
        <WorkRecord
          key={artwork.id}
          artwork={artwork}
          position={position}
          isActive={activeId === artwork.id}
          isFavorite={favoriteIds.has(artwork.id)}
          onActivate={activateArtwork}
          onRegister={registerArtwork}
          onOpen={onOpen}
          onFavorite={onFavorite}
          locale={locale}
          t={t}
        />
      ))}
    </div>
  );
}

export function GalleryPage() {
  const { catalog, favorites, locale, t, toggleFavorite } = useSite();
  const desktopGallery = useDesktopGallery();
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
      const inPlace = Boolean(savedTarget);
      target?.focus?.({ preventScroll: Boolean(savedTarget || archiveTarget) });
      if (!inPlace && archiveTarget) {
        archiveTarget.scrollIntoView?.({ block: "center", behavior: "instant" });
      }
      triggerRef.current = null;
    });
    return () => globalThis.cancelAnimationFrame?.(focusFrame);
  }, [modalId]);

  const selectCollection = (nextCollection) => {
    setCollection(nextCollection);
    const href = galleryUrl((search) => {
      if (nextCollection === "all") search.delete("collection");
      else search.set("collection", nextCollection);
    });
    window.history.replaceState(window.history.state, "", href);
  };

  const selectAvailability = (nextAvailability) => {
    const normalizedAvailability = normalizeAvailability(nextAvailability);
    setAvailability(normalizedAvailability);
    const href = galleryUrl((search) => {
      if (normalizedAvailability === "all") search.delete("availability");
      else search.set("availability", normalizedAvailability);
    });
    window.history.replaceState(window.history.state, "", href);
  };

  const openArtwork = useCallback((id, trigger) => {
    triggerRef.current = { id, node: trigger };
    if (new URL(window.location.href).searchParams.get("art") === id) return;
    const href = galleryUrl((search) => {
      search.delete("artwork");
      search.set("art", id);
    });
    const nextState = { ...(window.history.state || {}), [modalHistoryKey]: id };
    window.history.pushState(nextState, "", href);
    setModalId(id);
  }, []);

  const closeArtwork = useCallback(() => {
    if (historyClosePending.current) return;
    if (window.history.state?.[modalHistoryKey] === modalId) {
      historyClosePending.current = true;
      window.history.back();
      return;
    }
    const href = galleryUrl((search) => {
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
  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);
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
    const href = galleryUrl((search) => {
      search.delete("artwork");
      search.set("art", nextArtwork.id);
    });
    const url = new URL(href, window.location.href);
    if (url.hash.startsWith("#artwork-details-")) {
      url.hash = `#artwork-details-${nextArtwork.id}`;
    }
    const currentState = window.history.state;
    const nextState = Object.prototype.hasOwnProperty.call(
      currentState ?? {},
      modalHistoryKey,
    )
      ? { ...currentState, [modalHistoryKey]: nextArtwork.id }
      : currentState;
    window.history.replaceState(nextState, "", relativeUrl(url));
    setModalId(nextArtwork.id);
  }, [modalPosition, modalSequence]);

  return (
    <SiteShell page="gallery" immersive footer={false}>
      <section className="gallery-intro" aria-labelledby="works-title">
        <p className="gallery-intro__index">BRANCHSTONE / {String(catalogStats.total).padStart(2, "0")}</p>
        <div className="gallery-intro__title">
          <p>{locale === "uk" ? "ЖИВИЙ АРХІВ МАТЕРІАЛІВ / 2019—ДОТЕПЕР" : "LIVING MATERIAL ARCHIVE / 2019—NOW"}</p>
          <h1 id="works-title" tabIndex="-1">
            {locale === "uk" ? "Роботи, що несуть землю" : "Works that carry the ground"}
          </h1>
          <p>
            {locale === "uk"
              ? "Переглядайте архів у власному темпі. Відкрийте будь-яку роботу, щоб побачити її матеріали, історію та доступність."
              : "Browse the archive at your own pace. Open any work to see its materials, story, and availability."}
          </p>
        </div>
        <dl className="gallery-intro__counts" aria-label={locale === "uk" ? "Стан архіву" : "Archive status"}>
          <div><dt>{locale === "uk" ? "Усього" : "All works"}</dt><dd>{catalogStats.total}</dd></div>
          <div><dt>{t.common.available}</dt><dd>{catalogStats.available}</dd></div>
          <div><dt>{t.common.collected}</dt><dd>{catalogStats.collected}</dd></div>
        </dl>
      </section>

      <div className="gallery-material-seam" aria-hidden="true">
        <picture>
          <source media="(min-width: 760px)" srcSet={gallerySeamDesktop} />
          <img
            src={gallerySeamMobile}
            alt=""
            width="645"
            height="369"
            draggable="false"
            loading="eager"
            fetchPriority="auto"
            decoding="async"
          />
        </picture>
      </div>

      <section className="gallery-controls" aria-labelledby="filters-title">
        <div className="gallery-controls__heading">
          <h2 id="filters-title">{locale === "uk" ? "Знайти роботу" : "Find a work"}</h2>
          <p aria-live="polite" aria-atomic="true">
            {galleryWorkCount(visibleWorks.length, locale)}
          </p>
        </div>

        <div className="gallery-mobile-filters">
          <label>
            <span>{locale === "uk" ? "Доступність" : "Availability"}</span>
            <span className="gallery-mobile-filter__control">
              <select
                disabled={!filtersReady}
                value={availability}
                onChange={(event) => selectAvailability(event.target.value)}
              >
                <option value="all">{t.common.all} · {collectionWorks.length}</option>
                <option value="available">{t.common.available} · {availabilityStats.available}</option>
                <option value="collected">{t.common.collected} · {availabilityStats.collected}</option>
              </select>
              <CaretDown aria-hidden="true" />
            </span>
          </label>
          <label>
            <span>{locale === "uk" ? "Колекція" : "Collection"}</span>
            <span className="gallery-mobile-filter__control">
              <select
                disabled={!filtersReady}
                value={collection}
                onChange={(event) => selectCollection(event.target.value)}
              >
                <option value="all">{t.common.all}</option>
                {collections.map((record) => (
                  <option key={record.id} value={record.id}>
                    {collectionLabel(record.id, locale)}
                  </option>
                ))}
              </select>
              <CaretDown aria-hidden="true" />
            </span>
          </label>
        </div>

        <div className="gallery-status-filter" role="group" aria-label={locale === "uk" ? "Фільтр за доступністю" : "Filter by availability"}>
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
              <span>{label}</span><small>{String(count).padStart(2, "0")}</small>
            </button>
          ))}
        </div>

        <div className="gallery-collection-filter" role="group" aria-label={locale === "uk" ? "Фільтр за колекцією" : "Filter by collection"}>
          <button
            type="button"
            disabled={!filtersReady}
            aria-pressed={collection === "all"}
            onClick={() => selectCollection("all")}
          >
            <span>00</span>{t.common.all}
          </button>
          {collections.map((record, index) => (
            <button
              key={record.id}
              type="button"
              disabled={!filtersReady}
              aria-pressed={collection === record.id}
              onClick={() => selectCollection(record.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>{collectionLabel(record.id, locale)}
            </button>
          ))}
        </div>
      </section>

      <section className="gallery-archive" aria-label={locale === "uk" ? "Архів робіт" : "Artwork archive"}>
        <p className="gallery-archive__pending" role="status">
          {locale === "uk" ? "Відкриваємо архів…" : "Opening the archive…"}
        </p>
        {visibleWorks.length ? (
          desktopGallery ? (
            <GalleryStream
              artworks={visibleWorks}
              favoriteIds={favoriteIds}
              locale={locale}
              onFavorite={toggleFavorite}
              onOpen={openArtwork}
              t={t}
            />
          ) : (
            <MobileGalleryIndex
              artworks={visibleWorks}
              availability={availability}
              collection={collection}
              locale={locale}
              onOpen={openArtwork}
              t={t}
            />
          )
        ) : (
          <div className="gallery-empty" role="status">
            <p>{locale === "uk" ? "У цьому шарі поки немає робіт." : "No works sit in this layer yet."}</p>
            <button type="button" onClick={() => { selectCollection("all"); selectAvailability("all"); }}>
              {locale === "uk" ? "Показати весь архів" : "Show the full archive"}
            </button>
          </div>
        )}
      </section>

      {modalArtwork ? (
        <ArtworkModal
          artwork={modalArtwork}
          forceResolved={!desktopGallery}
          onClose={closeArtwork}
          onStepWork={stepModalArtwork}
          workCount={modalSequence.length}
          workPosition={modalPosition + 1}
        />
      ) : null}
    </SiteShell>
  );
}
