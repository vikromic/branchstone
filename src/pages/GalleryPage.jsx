import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, BookmarkSimple, Eye, SlidersHorizontal } from "@phosphor-icons/react";
import { SiteShell } from "../app/SiteShell.jsx";
import { ArtworkModal, artworkContactHref } from "../features/ArtworkModal.jsx";
import {
  catalogStats,
  collectionLabel,
  collections,
  normalizeArtworkId,
  normalizeCollection,
} from "../domain/catalog.js";
import { useSite } from "../app/SiteContext.jsx";
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

function WorkRecord({ artwork, position, isFavorite, onOpen, onFavorite, locale, t }) {
  return (
    <article className="gallery-work" data-sold={artwork.sold ? "true" : "false"}>
      <header className="gallery-work__ledger">
        <span>{String(position + 1).padStart(2, "0")}</span>
        <p>{artwork.collection}</p>
        <span>{artwork.year}</span>
      </header>
      <div className="gallery-work__visual">
        <img
          src={artwork.mainImage}
          alt={artwork.name}
          loading={position === 0 ? "eager" : "lazy"}
          fetchPriority={position === 0 ? "high" : "auto"}
        />
        <button
          id={`artwork-open-${artwork.id}`}
          className="gallery-work__open"
          type="button"
          onClick={(event) => onOpen(artwork.id, event.currentTarget)}
          aria-label={`${t.common.view}: ${artwork.name}`}
        >
          <Eye aria-hidden="true" />
          <span>{t.common.view}</span>
        </button>
        <button
          className="gallery-save"
          type="button"
          aria-pressed={isFavorite}
          onClick={() => onFavorite(artwork.id)}
          aria-label={`${isFavorite ? t.common.saved : t.common.save}: ${artwork.name}`}
        >
          <BookmarkSimple weight={isFavorite ? "fill" : "regular"} aria-hidden="true" />
        </button>
      </div>
      <footer className="gallery-work__caption">
        <div>
          <h2>{artwork.name}</h2>
          <p>{artwork.materials}</p>
          {!artwork.sold && (
            <a className="gallery-work__inquire" href={artworkContactHref(artwork, locale, "original")}>
              {t.common.inquire}<ArrowUpRight aria-hidden="true" />
            </a>
          )}
        </div>
        <p className="gallery-status" data-sold={artwork.sold ? "true" : "false"}>
          {artwork.sold ? t.common.collected : t.common.available}
        </p>
      </footer>
    </article>
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
    setCollection(normalizedCollection);

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
      const target = triggerRef.current?.isConnected
        ? triggerRef.current
        : document.getElementById(`artwork-open-${closedArtworkId}`) ?? document.getElementById("works-title");
      target?.focus?.({ preventScroll: true });
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

  const openArtwork = (id, trigger) => {
    triggerRef.current = trigger;
    if (modalId === id) return;
    const href = galleryUrl((search) => {
      search.delete("artwork");
      search.set("art", id);
    });
    const nextState = { ...(window.history.state || {}), [modalHistoryKey]: id };
    window.history.pushState(nextState, "", href);
    setModalId(id);
  };

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

  const visibleWorks = useMemo(
    () => catalog.filter((artwork) => {
      const inCollection = collection === "all" || artwork.collectionId === collection;
      const inAvailability =
        availability === "all" ||
        (availability === "available" && !artwork.sold) ||
        (availability === "collected" && artwork.sold);
      return inCollection && inAvailability;
    }),
    [availability, catalog, collection],
  );

  const modalArtwork = modalId ? findArtwork(catalog, modalId) : null;

  return (
    <SiteShell page="gallery">
      <section className="gallery-intro" aria-labelledby="works-title">
        <p className="kicker">{locale === "uk" ? "ЖИВИЙ АРХІВ МАТЕРІАЛІВ / 2019—ДОТЕПЕР" : "LIVING MATERIAL ARCHIVE / 2019—NOW"}</p>
        <div className="gallery-intro__title">
          <h1 id="works-title" tabIndex="-1">{locale === "uk" ? "Роботи, що несуть землю" : "Works that carry the ground"}</h1>
          <p>
            {locale === "uk"
              ? "Живопис, дерево, попіл і знайдені матеріали — не декор, а свідки місця та пам’яті."
              : "Paint, wood, ash, and found matter—not decoration, but witnesses to place and memory."}
          </p>
        </div>
        <dl className="gallery-intro__counts" aria-label={locale === "uk" ? "Стан архіву" : "Archive status"}>
          <div><dt>{locale === "uk" ? "Усього" : "All works"}</dt><dd>{catalogStats.total}</dd></div>
          <div><dt>{t.common.available}</dt><dd>{catalogStats.available}</dd></div>
          <div><dt>{t.common.collected}</dt><dd>{catalogStats.collected}</dd></div>
        </dl>
      </section>

      <section className="gallery-controls" aria-labelledby="filters-title">
        <div className="gallery-controls__heading">
          <SlidersHorizontal aria-hidden="true" />
          <h2 id="filters-title">{locale === "uk" ? "Шари архіву" : "Archive layers"}</h2>
          <p aria-live="polite">{String(visibleWorks.length).padStart(2, "0")} {locale === "uk" ? "робіт" : "works"}</p>
        </div>

        <div className="gallery-status-filter" role="group" aria-label={locale === "uk" ? "Фільтр за доступністю" : "Filter by availability"}>
          {[
            ["all", t.common.all, catalogStats.total],
            ["available", t.common.available, catalogStats.available],
            ["collected", t.common.collected, catalogStats.collected],
          ].map(([id, label, count]) => (
            <button key={id} type="button" aria-pressed={availability === id} onClick={() => setAvailability(id)}>
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
          <div className="gallery-archive__grid">
            {visibleWorks.map((artwork) => (
              <WorkRecord
                key={artwork.id}
                artwork={artwork}
                position={artwork.index}
                isFavorite={favorites.includes(artwork.id)}
                onOpen={openArtwork}
                onFavorite={toggleFavorite}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="gallery-empty" role="status">
            <p>{locale === "uk" ? "У цьому шарі поки немає робіт." : "No works sit in this layer yet."}</p>
            <button type="button" onClick={() => { selectCollection("all"); setAvailability("all"); }}>
              {locale === "uk" ? "Показати весь архів" : "Show the full archive"}
            </button>
          </div>
        )}
      </section>

      {modalArtwork && <ArtworkModal artwork={modalArtwork} onClose={closeArtwork} />}
    </SiteShell>
  );
}
