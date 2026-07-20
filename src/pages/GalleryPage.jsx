import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SiteShell } from "../app/SiteShell.jsx";
import {
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
import { useSite } from "../app/SiteContext.jsx";
import gallerySeamMobile from "../assets/material-stage/home-top-composite-alpha.webp";
import gallerySeamDesktop from "../assets/material-stage/home-top-vault-desktop-short-alpha.webp";
import "../styles/gallery.css";

const modalHistoryKey = "branchstoneArtworkModal";

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
        alt={artwork.name}
        className="gallery-work__visual"
        loading={position === 0 ? "eager" : "lazy"}
        fetchPriority={position === 0 ? "high" : "auto"}
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

  return (
    <div className="gallery-stream">
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
  const [collection, setCollection] = useState("all");
  const [availability, setAvailability] = useState("all");
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
    const canonicalMatch = findArtwork(catalog, canonicalArtwork);
    const legacyMatch = findArtwork(catalog, legacyArtwork);
    const artwork = canonicalMatch || legacyMatch;
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

    if (legacyArtwork) {
      if (artwork) url.searchParams.set("art", artwork.id);
      else url.searchParams.delete("art");
      url.searchParams.delete("artwork");
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
    const onPopState = (event) => synchronizeFromUrl(event.state);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [synchronizeFromUrl]);

  useEffect(() => {
    const closedArtworkId = previousModalId.current;
    previousModalId.current = modalId;
    if (!closedArtworkId || modalId) return;
    requestAnimationFrame(() => {
      const savedTrigger = triggerRef.current;
      const target = savedTrigger?.id === closedArtworkId && savedTrigger.node?.isConnected
        ? savedTrigger.node
        : document.getElementById("works-title");
      target?.focus?.({ preventScroll: true });
      triggerRef.current = null;
    });
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
    if (modalId === id) return;
    const href = galleryUrl((search) => {
      search.delete("artwork");
      search.set("art", id);
    });
    const nextState = { ...(window.history.state || {}), [modalHistoryKey]: id };
    window.history.pushState(nextState, "", href);
    setModalId(id);
  }, [modalId]);

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
    window.history.replaceState(window.history.state, "", href);
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
              ? "Рухайтеся архівом. Зупинка обирає роботу: спершу проявляються матеріали, потім історія і лише тоді — доступність."
              : "Move through the archive. Your stop selects the work: materials appear first, then the story, and only then availability."}
          </p>
        </div>
        <dl className="gallery-intro__counts" aria-label={locale === "uk" ? "Стан архіву" : "Archive status"}>
          <div><dt>{locale === "uk" ? "Усього" : "All works"}</dt><dd>{availabilityStats.total}</dd></div>
          <div><dt>{t.common.available}</dt><dd>{availabilityStats.available}</dd></div>
          <div><dt>{t.common.collected}</dt><dd>{availabilityStats.collected}</dd></div>
        </dl>
      </section>

      <div className="gallery-material-seam" aria-hidden="true">
        <picture>
          <source media="(min-width: 760px)" srcSet={gallerySeamDesktop} />
          <img src={gallerySeamMobile} alt="" draggable="false" decoding="async" />
        </picture>
      </div>

      <section className="gallery-controls" aria-labelledby="filters-title">
        <div className="gallery-controls__heading">
          <h2 id="filters-title">{locale === "uk" ? "Знайти роботу" : "Find a work"}</h2>
          <p aria-live="polite">{String(visibleWorks.length).padStart(2, "0")} {locale === "uk" ? "робіт" : "works"}</p>
        </div>

        <div className="gallery-status-filter" role="group" aria-label={locale === "uk" ? "Фільтр за доступністю" : "Filter by availability"}>
          {[
            ["all", t.common.all, collectionWorks.length],
            ["available", t.common.available, availabilityStats.available],
            ["collected", t.common.collected, availabilityStats.collected],
          ].map(([id, label, count]) => (
            <button key={id} type="button" aria-pressed={availability === id} onClick={() => selectAvailability(id)}>
              <span>{label}</span><small>{String(count).padStart(2, "0")}</small>
            </button>
          ))}
        </div>

        <div className="gallery-collection-filter" role="group" aria-label={locale === "uk" ? "Фільтр за колекцією" : "Filter by collection"}>
          <button type="button" aria-pressed={collection === "all"} onClick={() => selectCollection("all")}>
            <span>00</span>{t.common.all}
          </button>
          {collections.map((record, index) => (
            <button key={record.id} type="button" aria-pressed={collection === record.id} onClick={() => selectCollection(record.id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{collectionLabel(record.id, locale)}
            </button>
          ))}
        </div>
      </section>

      <section className="gallery-archive" aria-label={locale === "uk" ? "Архів робіт" : "Artwork archive"}>
        {visibleWorks.length ? (
          <GalleryStream
            artworks={visibleWorks}
            favoriteIds={favoriteIds}
            locale={locale}
            onFavorite={toggleFavorite}
            onOpen={openArtwork}
            t={t}
          />
        ) : (
          <div className="gallery-empty" role="status">
            <p>{locale === "uk" ? "У цьому шарі поки немає робіт." : "No works sit in this layer yet."}</p>
            <button type="button" onClick={() => { selectCollection("all"); selectAvailability("all"); }}>
              {locale === "uk" ? "Показати весь архів" : "Show the full archive"}
            </button>
          </div>
        )}
      </section>

      {modalArtwork ? <ArtworkModal artwork={modalArtwork} onClose={closeArtwork} /> : null}
    </SiteShell>
  );
}
