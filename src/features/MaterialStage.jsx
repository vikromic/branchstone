import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  ArrowsLeftRight,
  BookmarkSimple,
  X,
} from "@phosphor-icons/react";
import { useSite } from "../app/SiteContext.jsx";
import { useModalLayer } from "../app/useModalLayer.js";
import { normalizeArtworkId } from "../domain/catalog.js";
import { localeHref } from "../domain/content.js";
import bottomStrata from "../assets/material-stage/bottom-strata.webp";
import memorySeam from "../assets/material-stage/memory-seam.webp";
import topStrata from "../assets/material-stage/top-strata.webp";

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
const clampReveal = (value) => clamp(value, 0, 100);
const clampLayerShift = (value) => clamp(value, -24, 24);

const stageCopy = {
  en: {
    archive: "Living material archive",
    archiveIndex: "ARCHIVE",
    allWorks: "All works",
    allWorksLabel: "Open the complete works index",
    available: "Available work",
    collected: "Held in a private collection",
    closeIndex: "Close the works index",
    field: "Material field",
    gesture: "Move through the ground",
    gestureNote: "Drag vertically to shift the strata. Draw horizontally to uncover a mineral seam.",
    indexNote: "Every work remains reachable here without motion or gesture.",
    next: "Next featured work",
    previous: "Previous featured work",
    release: "Release the seam",
    rub: "Rub the seam",
    save: "Save this work",
    saveShort: "Save",
    saved: "Remove this work from saved works",
    savedShort: "Saved",
    select: "Bring this work into the material field",
    statement: "What the earth releases, I carry.",
    view: "Enter work",
    works: "Works",
    shiftDown: "Shift the material layers down",
    shiftUp: "Shift the material layers up",
    instructions:
      "Drag vertically, or use the up and down arrow keys, to shift the material layers. Drag horizontally, or use the left and right arrow keys, to reveal the older seam.",
  },
  uk: {
    archive: "Живий архів матеріалів",
    archiveIndex: "АРХІВ",
    allWorks: "Усі роботи",
    allWorksLabel: "Відкрити повний індекс робіт",
    available: "Доступна робота",
    collected: "У приватній колекції",
    closeIndex: "Закрити індекс робіт",
    field: "Матеріальне поле",
    gesture: "Рух крізь ґрунт",
    gestureNote: "Тягніть вертикально, щоб змістити шари. Проведіть горизонтально, щоб відкрити мінеральний шов.",
    indexNote: "Кожна робота доступна тут без руху чи жестів.",
    next: "Наступна вибрана робота",
    previous: "Попередня вибрана робота",
    release: "Закрити шов",
    rub: "Відкрити шов",
    save: "Зберегти цю роботу",
    saveShort: "Зберегти",
    saved: "Вилучити цю роботу зі збережених",
    savedShort: "Збережено",
    select: "Перенести цю роботу в матеріальне поле",
    statement: "Те, що відпускає земля, я несу далі.",
    view: "Увійти в роботу",
    works: "Роботи",
    shiftDown: "Змістити матеріальні шари вниз",
    shiftUp: "Змістити матеріальні шари вгору",
    instructions:
      "Тягніть вертикально або використовуйте клавіші вгору та вниз, щоб зміщувати матеріальні шари. Тягніть горизонтально або використовуйте клавіші ліворуч і праворуч, щоб відкривати давніший шов.",
  },
};

function artworkHref(id, locale) {
  return localeHref(`/gallery.html?art=${encodeURIComponent(id)}`, locale);
}

function WorksIndex({ artworks, favorites, locale, onClose, onSelect, onToggleFavorite }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const labels = stageCopy[locale];

  useModalLayer({ containerRef: dialogRef, initialFocusRef: closeRef, onClose, lockClass: "home-index-is-open" });

  return (
    <section
      ref={dialogRef}
      className="home-works-index"
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-works-title"
      tabIndex={-1}
    >
      <header className="home-works-index__header">
        <div>
          <p className="home-stage__kicker">
            BRANCHSTONE / {labels.archive.toUpperCase()} / {String(artworks.length).padStart(2, "0")}
          </p>
          <h2 id="home-works-title">{labels.allWorks}</h2>
        </div>
        <button
          ref={closeRef}
          className="home-stage__icon-button"
          type="button"
          onClick={onClose}
          aria-label={labels.closeIndex}
        >
          <X aria-hidden="true" weight="thin" />
        </button>
      </header>

      <div className="home-works-index__list" role="list">
        {artworks.map((artwork, index) => {
          const isSaved = favorites.includes(artwork.id);
          return (
            <article className="home-work-row" key={artwork.id} role="listitem">
              <span className="home-work-row__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <button
                className="home-work-row__select"
                type="button"
                onClick={() => onSelect(artwork.id)}
                aria-label={`${labels.select}: ${artwork.name}`}
              >
                <img src={artwork.mainImage} alt="" loading="lazy" decoding="async" />
                <span className="home-work-row__copy">
                  <strong>{artwork.name}</strong>
                  <small>{artwork.collection}</small>
                  <small>{artwork.materials}</small>
                </span>
              </button>
              <span className="home-work-row__year">{artwork.year}</span>
              <div className="home-work-row__actions">
                <button
                  className={`home-work-row__save${isSaved ? " is-saved" : ""}`}
                  type="button"
                  onClick={() => onToggleFavorite(artwork.id)}
                  aria-label={`${isSaved ? labels.saved : labels.save}: ${artwork.name}`}
                  aria-pressed={isSaved}
                >
                  <BookmarkSimple aria-hidden="true" weight={isSaved ? "fill" : "thin"} />
                </button>
                <a href={artworkHref(artwork.id, locale)}>
                  {labels.view}<ArrowUpRight aria-hidden="true" weight="thin" />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="home-works-index__footer">
        <p>{labels.indexNote}</p>
        <button type="button" className="home-works-index__close" onClick={onClose}>
          {labels.closeIndex}
        </button>
      </footer>
    </section>
  );
}

export function MaterialStage() {
  const { catalog, favorites, locale, toggleFavorite } = useSite();
  const labels = stageCopy[locale];
  const featured = useMemo(() => {
    const selected = catalog.filter((artwork) => artwork.highlighted && !artwork.sold);
    return selected.length ? selected : catalog.filter((artwork) => !artwork.sold).slice(0, 7);
  }, [catalog]);
  const [activeId, setActiveId] = useState(() => featured[0]?.id ?? catalog[0]?.id ?? "");
  const [indexOpen, setIndexOpen] = useState(false);
  const [layerShift, setLayerShift] = useState(0);
  const [rubReveal, setRubReveal] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragFrameRef = useRef(0);
  const pendingMoveRef = useRef(null);
  const stageRef = useRef(null);
  const worksTriggerRef = useRef(null);

  const activeArtwork = catalog.find((artwork) => artwork.id === activeId) ?? featured[0] ?? catalog[0];
  const activeFeaturedIndex = featured.findIndex((artwork) => artwork.id === activeArtwork?.id);
  const isSaved = activeArtwork ? favorites.includes(activeArtwork.id) : false;

  useEffect(() => {
    const url = new URL(window.location.href);
    const legacyId = url.searchParams.get("artwork");
    if (!legacyId) return;
    const normalized = normalizeArtworkId(legacyId);
    const urlLocale = url.searchParams.get("lang") === "uk" ? "uk" : locale;
    window.location.replace(artworkHref(normalized, urlLocale));
  }, [locale]);

  useEffect(
    () => () => {
      if (dragFrameRef.current) cancelAnimationFrame(dragFrameRef.current);
    },
    [],
  );

  const resetLayers = useCallback(() => {
    setRubReveal(0);
    setLayerShift(0);
  }, []);

  const showArtwork = useCallback(
    (id) => {
      setActiveId(id);
      resetLayers();
    },
    [resetLayers],
  );

  const moveFeatured = useCallback(
    (direction) => {
      if (!featured.length) return;
      const current = featured.findIndex((artwork) => artwork.id === activeArtwork?.id);
      const basis = current >= 0 ? current : 0;
      const next = (basis + direction + featured.length) % featured.length;
      showArtwork(featured[next].id);
    },
    [activeArtwork?.id, featured, showArtwork],
  );

  const applyPendingMove = useCallback(() => {
    dragFrameRef.current = 0;
    const pendingMove = pendingMoveRef.current;
    pendingMoveRef.current = null;
    if (!pendingMove) return;
    const drag = dragRef.current;
    if (!drag?.axis) return;

    if (drag.axis === "horizontal") {
      setRubReveal(clampReveal(pendingMove.startReveal + pendingMove.dx * 0.82));
    } else {
      setLayerShift(clampLayerShift(pendingMove.startShift + pendingMove.dy * 0.12));
    }
  }, []);

  const beginDrag = useCallback(
    (event) => {
      if (event.target.closest("button, a")) return;
      if (!event.isPrimary) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.currentTarget.focus({ preventScroll: true });
      dragRef.current = {
        axis: null,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startShift: layerShift,
        startReveal: rubReveal,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    },
    [layerShift, rubReveal],
  );

  const moveLayers = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;

      if (!drag.axis && Math.hypot(dx, dy) >= 7) {
        drag.axis = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }
      if (!drag.axis) return;

      pendingMoveRef.current = {
        dx,
        dy,
        startReveal: drag.startReveal,
        startShift: drag.startShift,
      };
      if (!dragFrameRef.current) dragFrameRef.current = requestAnimationFrame(applyPendingMove);
    },
    [applyPendingMove],
  );

  const endDrag = useCallback(
    (event) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      if (dragFrameRef.current) cancelAnimationFrame(dragFrameRef.current);
      applyPendingMove();
      dragRef.current = null;
      setIsDragging(false);
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [applyPendingMove],
  );

  const handleStageKeyDown = useCallback(
    (event) => {
      if (indexOpen || event.target !== event.currentTarget) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setRubReveal((value) => clampReveal(value + (event.key === "ArrowRight" ? 12 : -12)));
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        setLayerShift((value) => clampLayerShift(value + (event.key === "ArrowDown" ? 4 : -4)));
      }
    },
    [indexOpen],
  );

  const closeIndexTo = useCallback((focusRef) => {
    setIndexOpen(false);
    requestAnimationFrame(() => focusRef.current?.focus({ preventScroll: true }));
  }, []);

  const closeIndex = useCallback(() => closeIndexTo(worksTriggerRef), [closeIndexTo]);

  const selectFromIndex = useCallback(
    (id) => {
      showArtwork(id);
      closeIndexTo(stageRef);
    },
    [closeIndexTo, showArtwork],
  );

  if (!activeArtwork) return null;

  return (
    <div className="home-experience" aria-label={labels.archive}>
      <h1 className="sr-only">Branchstone by Viktoria — {labels.archive}</h1>
      <section
        ref={stageRef}
        className={`home-material-stage${isDragging ? " is-dragging" : ""}`}
        tabIndex="0"
        role="region"
        aria-label={`${labels.field}: ${activeArtwork.name}`}
        aria-describedby="home-stage-instructions home-stage-description"
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
        onKeyDown={handleStageKeyDown}
        onPointerDown={beginDrag}
        onPointerMove={moveLayers}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        style={{
          "--home-layer-shift": `${layerShift}px`,
          "--home-rub-reveal": `${rubReveal}%`,
        }}
      >
        <p id="home-stage-instructions" className="sr-only">{labels.instructions}</p>
        <p id="home-stage-description" className="sr-only">
          {activeArtwork.name}, {activeArtwork.year}. {activeArtwork.materials}. {labels.statement}
        </p>

        <img className="home-stage-asset home-stage-asset--top" src={topStrata} alt="" />

        <div className="home-memory-seam" aria-hidden="true">
          <img src={memorySeam} alt="" />
        </div>

        <figure className="home-artwork-field">
          <img
            src={activeArtwork.mainImage}
            alt={`${activeArtwork.name}, ${activeArtwork.year}. ${activeArtwork.materials}`}
            draggable="false"
            decoding="async"
          />
          <figcaption className="sr-only">
            {activeArtwork.name}, {activeArtwork.year}. {activeArtwork.collection}.
          </figcaption>
        </figure>

        <div className="home-bottom-layer" aria-hidden="true">
          <img src={bottomStrata} alt="" />
        </div>

        <div className="home-stage__archive-mark" aria-hidden="true">
          <span>{labels.archiveIndex}</span>
          <span>{String(activeArtwork.index + 1).padStart(2, "0")} / {String(catalog.length).padStart(2, "0")}</span>
        </div>

        <div className="home-stage__work-label">
          <p className="home-stage__kicker">
            {activeArtwork.sold ? labels.collected : labels.available} / {activeArtwork.collection}
          </p>
          <a href={artworkHref(activeArtwork.id, locale)}>
            <span>{activeArtwork.name}</span>
            <small>{activeArtwork.year}<ArrowUpRight aria-hidden="true" weight="thin" /></small>
          </a>
          <p>{activeArtwork.materials}</p>
        </div>

        <button
          ref={worksTriggerRef}
          className="home-stage__works-trigger"
          type="button"
          onClick={() => setIndexOpen(true)}
          aria-expanded={indexOpen}
          aria-label={labels.allWorksLabel}
        >
          <span>{labels.allWorks}</span>
          <small>{String(catalog.length).padStart(2, "0")}</small>
        </button>

        <button
          className={`home-stage__favorite${isSaved ? " is-saved" : ""}`}
          type="button"
          onClick={() => toggleFavorite(activeArtwork.id)}
          aria-label={isSaved ? labels.saved : labels.save}
          aria-pressed={isSaved}
        >
          <BookmarkSimple aria-hidden="true" weight={isSaved ? "fill" : "thin"} />
          <span>{isSaved ? labels.savedShort : labels.saveShort}</span>
        </button>

        <div className="home-stage__featured-nav" role="group" aria-label={labels.works}>
          <button type="button" onClick={() => moveFeatured(-1)} aria-label={labels.previous}>
            <ArrowLeft aria-hidden="true" weight="thin" />
          </button>
          <span>{activeFeaturedIndex >= 0 ? String(activeFeaturedIndex + 1).padStart(2, "0") : "—"} / {String(featured.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => moveFeatured(1)} aria-label={labels.next}>
            <ArrowRight aria-hidden="true" weight="thin" />
          </button>
        </div>

        <div className="home-stage__layer-controls" role="group" aria-label={labels.gesture}>
          <button type="button" onClick={() => setLayerShift((value) => clampLayerShift(value - 4))} aria-label={labels.shiftUp}>
            <ArrowUp aria-hidden="true" weight="thin" />
          </button>
          <button type="button" onClick={() => setLayerShift((value) => clampLayerShift(value + 4))} aria-label={labels.shiftDown}>
            <ArrowDown aria-hidden="true" weight="thin" />
          </button>
        </div>

        <p className="home-stage__statement">{labels.statement.toUpperCase()}</p>

        <button
          className="home-stage__seam-trigger"
          type="button"
          onClick={() => setRubReveal((value) => (value > 50 ? 0 : 76))}
          aria-pressed={rubReveal > 50}
        >
          <span>{rubReveal > 50 ? labels.release : labels.rub}</span>
          <ArrowsLeftRight aria-hidden="true" weight="thin" />
        </button>

        <div className="home-stage__gesture-note">
          <p className="home-stage__kicker">{labels.gesture}</p>
          <p>{labels.gestureNote}</p>
        </div>

        <div className="sr-only" aria-live="polite">
          {labels.field}: {activeArtwork.name}. {Math.round(rubReveal)}%.
        </div>
      </section>

      {indexOpen && (
        <WorksIndex
          artworks={catalog}
          favorites={favorites}
          locale={locale}
          onClose={closeIndex}
          onSelect={selectFromIndex}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}
