import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookmarkSimple,
  EnvelopeSimple,
  Eye,
  X,
} from "@phosphor-icons/react";
import { useSite } from "../app/SiteContext.jsx";
import { useModalLayer } from "../app/useModalLayer.js";
import { contactInquiryHref } from "../domain/content.js";
import {
  StayArtworkImage,
  StayPhase,
  StayReveal,
  useStayRevealContext,
} from "./stay/index.js";

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

export function storyParagraphs(story) {
  return String(story)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function ArtworkSurface({
  artwork,
  src,
  alt,
  className = "",
  loading = "lazy",
  fetchPriority = "auto",
  onImageSettled,
  onOpen,
  openId,
  children,
}) {
  const { artworkImageState: imageState } = useStayRevealContext();
  const onImageSettledRef = useRef(onImageSettled);
  onImageSettledRef.current = onImageSettled;
  const unavailable = imageState === "error";
  const phaseClassName = ["artwork-surface", className].filter(Boolean).join(" ");

  useEffect(() => {
    if (imageState !== "pending") onImageSettledRef.current?.(imageState);
  }, [imageState, src]);

  return (
    <StayPhase
      as="div"
      phase="artwork"
      className={phaseClassName}
      data-image-state={imageState}
    >
      <StayArtworkImage
        src={src}
        alt={unavailable ? "" : alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        draggable="false"
      />
      <div
        className="artwork-surface__placeholder"
        role={unavailable ? "img" : undefined}
        aria-label={unavailable ? artwork.name : undefined}
        aria-hidden={unavailable ? undefined : "true"}
      >
        {imageState === "pending" ? (
          <span className="artwork-surface__loading">
            {artwork.locale === "uk" ? "Матеріал проявляється" : "Material coming into view"}
          </span>
        ) : null}
        {unavailable ? (
          <span className="artwork-surface__error">
            {artwork.locale === "uk" ? "Зображення тимчасово недоступне" : "Image temporarily unavailable"}
          </span>
        ) : null}
      </div>
      {onOpen ? (
        <button
          id={openId}
          className="artwork-surface__open"
          type="button"
          onClick={onOpen}
          aria-label={`${artwork.viewLabel}: ${artwork.name}`}
        >
          <span className="sr-only">{artwork.viewLabel}</span>
        </button>
      ) : null}
      {children}
    </StayPhase>
  );
}

export function ArtworkNarrative({
  artwork,
  locale,
  t,
  isFavorite,
  onFavorite,
  onReveal,
  onOpen,
  titleId,
  descriptionId,
  mode = "stream",
}) {
  const materialsId = `${titleId}-materials`;
  const availabilityId = `${titleId}-availability`;
  const status = artwork.sold ? t.common.collected : t.common.available;
  const story = storyParagraphs(artwork.story);
  const hasStory = story.length > 0;
  const revealLabel = locale === "uk" ? "Дати роботі проявитися" : "Let the work settle";
  const controlledPhases = [materialsId, hasStory ? descriptionId : null, availabilityId]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`artwork-narrative artwork-narrative--${mode}`}>
      <header className="artwork-narrative__identity">
        <div className="artwork-narrative__ledger">
          <span>{String(artwork.index + 1).padStart(2, "0")}</span>
          <p>{artwork.collection}</p>
          <span>{artwork.year}</span>
        </div>
        <div className="artwork-narrative__title-row">
          <h2 id={titleId}>{artwork.name}</h2>
          <button
            className="artwork-narrative__reveal"
            type="button"
            onClick={onReveal}
            aria-controls={controlledPhases}
            data-stay-reveal-control=""
          >
            <span>{revealLabel}</span>
            <ArrowDown aria-hidden="true" />
          </button>
        </div>
      </header>

      <StayPhase
        as="section"
        phase="materials"
        id={materialsId}
        className="artwork-narrative__phase artwork-narrative__materials"
        aria-labelledby={`${materialsId}-label`}
      >
        <p id={`${materialsId}-label`} className="artwork-narrative__label">
          {locale === "uk" ? "Матеріали" : "Materials"}
        </p>
        <p className="artwork-narrative__material-copy">{artwork.materials}</p>
        <dl className="artwork-narrative__facts">
          <div>
            <dt>{locale === "uk" ? "Розмір" : "Dimensions"}</dt>
            <dd>{artwork.dimensions}</dd>
          </div>
          <div>
            <dt>{locale === "uk" ? "Рік" : "Year"}</dt>
            <dd>{artwork.year}</dd>
          </div>
        </dl>
      </StayPhase>

      {hasStory ? (
        <StayPhase
          as="section"
          phase="story"
          id={descriptionId}
          className="artwork-narrative__phase artwork-narrative__story"
          aria-labelledby={`${descriptionId}-label`}
        >
          <p id={`${descriptionId}-label`} className="artwork-narrative__label">
            {locale === "uk" ? "Історія" : "Story"}
          </p>
          <div className="artwork-narrative__story-copy">
            {story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </StayPhase>
      ) : null}

      <StayPhase
        as="section"
        phase="availability"
        id={availabilityId}
        className="artwork-narrative__phase artwork-narrative__availability"
        aria-labelledby={`${availabilityId}-label`}
      >
        <div>
          <p id={`${availabilityId}-label`} className="artwork-narrative__label">
            {locale === "uk" ? "Доступність" : "Availability"}
          </p>
          <p className="gallery-status" data-sold={artwork.sold ? "true" : "false"}>{status}</p>
          {!artwork.sold && artwork.price ? <strong>USD {artwork.price}</strong> : null}
        </div>
        <div className="artwork-narrative__actions">
          <button
            className="gallery-save"
            type="button"
            aria-pressed={isFavorite}
            onClick={() => onFavorite(artwork.id)}
            aria-label={`${isFavorite ? t.common.saved : t.common.save}: ${artwork.name}`}
          >
            <BookmarkSimple weight={isFavorite ? "fill" : "regular"} aria-hidden="true" />
            <span>{isFavorite ? t.common.saved : t.common.save}</span>
          </button>
          {onOpen ? (
            <button className="artwork-narrative__view" type="button" onClick={onOpen}>
              <Eye aria-hidden="true" />
              {t.common.view}
            </button>
          ) : null}
          {!artwork.sold || artwork.prints ? (
            <a
              className="artwork-narrative__inquire"
              href={artworkContactHref(artwork, locale, artwork.sold ? "print" : "original")}
            >
              <EnvelopeSimple aria-hidden="true" />
              {artwork.sold
                ? locale === "uk" ? "Запитати про принт" : "Ask about a print"
                : locale === "uk" ? "Запитати про оригінал" : "Inquire about the original"}
              <ArrowUpRight aria-hidden="true" />
            </a>
          ) : (
            <p className="artwork-narrative__collected-note">
              {locale === "uk" ? "Робота у приватній колекції." : "This work is held in a private collection."}
            </p>
          )}
        </div>
      </StayPhase>
    </div>
  );
}

export function ArtworkModal({ artwork, onClose }) {
  const { locale, t, favorites, toggleFavorite } = useSite();
  const [imageIndex, setImageIndex] = useState(0);
  const scrollLayerRef = useRef(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const controllerRef = useRef(null);
  const gestureStartRef = useRef(null);
  const [settledImageKey, setSettledImageKey] = useState(null);
  const titleId = useId();
  const descriptionId = useId();
  const isFavorite = favorites.includes(artwork.id);
  const displayImages = useMemo(
    () => [artwork.streamPrimary, ...artwork.images.filter((image) => image !== artwork.streamPrimary)],
    [artwork.images, artwork.streamPrimary],
  );
  const imageCount = displayImages.length;
  const currentImageIndex = Math.min(imageIndex, Math.max(imageCount - 1, 0));
  const currentImage = displayImages[currentImageIndex];
  const currentImageKey = `${artwork.id}:${currentImageIndex}:${currentImage}`;

  useEffect(() => {
    setImageIndex(0);
  }, [artwork.id]);

  useModalLayer({
    containerRef: dialogRef,
    initialFocusRef: closeRef,
    onClose,
    lockClass: "gallery-modal-open",
    restoreFocus: false,
  });

  useEffect(() => {
    if (
      imageCount < 2
      || settledImageKey !== currentImageKey
      || typeof Image !== "function"
    ) return undefined;
    const previous = new Image();
    const next = new Image();
    previous.fetchPriority = "low";
    next.fetchPriority = "low";
    previous.src = displayImages[(currentImageIndex - 1 + imageCount) % imageCount];
    next.src = displayImages[(currentImageIndex + 1) % imageCount];
    return () => {
      previous.src = "";
      next.src = "";
    };
  }, [currentImageIndex, currentImageKey, displayImages, imageCount, settledImageKey]);

  const stepImage = useCallback((direction) => {
    if (imageCount < 2) return;
    controllerRef.current?.motion.begin("carousel");
    setImageIndex((current) => (current + direction + imageCount) % imageCount);
  }, [imageCount]);

  const onPointerDown = (event) => {
    if (
      event.isPrimary === false
      || gestureStartRef.current
      || (event.pointerType === "mouse" && event.button !== 0)
    ) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gestureStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  };

  const finishGesture = (event) => {
    const start = gestureStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return null;
    gestureStartRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    return start;
  };

  const onPointerUp = (event) => {
    const start = finishGesture(event);
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;
    stepImage(deltaX > 0 ? -1 : 1);
  };

  const artworkForSurface = {
    ...artwork,
    locale,
    viewLabel: t.common.view,
  };

  return (
    <div
      ref={scrollLayerRef}
      className="artwork-dialog-layer"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <StayReveal
        as="section"
        ref={dialogRef}
        controllerRef={controllerRef}
        className="artwork-dialog"
        activeKey={`${artwork.id}:${currentImageIndex}`}
        active
        settleOnMount
        waitForArtwork
        scrollTargetRef={scrollLayerRef}
        phasePresence={{ materials: true, story: storyParagraphs(artwork.story).length > 0, availability: true }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="artwork-dialog__header">
          <p className="artwork-dialog__position">
            {t.shell.archiveIndex} / {String(artwork.index + 1).padStart(2, "0")}
          </p>
          <button
            ref={closeRef}
            className="artwork-dialog__close"
            type="button"
            data-modal-close
            onClick={onClose}
            aria-label={t.common.close}
          >
            <X aria-hidden="true" />
            <span>{t.common.close}</span>
          </button>
        </header>

        <div className="artwork-dialog__body">
          <ArtworkSurface
            artwork={artworkForSurface}
            src={currentImage}
            alt={`${artwork.name}, ${currentImageIndex + 1} / ${imageCount}`}
            className="artwork-dialog__visual"
            loading="eager"
            fetchPriority="high"
            onImageSettled={() => {
              setSettledImageKey(currentImageKey);
              controllerRef.current?.motion.settle("carousel");
            }}
          >
            <div
              className="artwork-dialog__gesture-surface"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={(event) => {
                finishGesture(event);
              }}
              onLostPointerCapture={(event) => {
                if (gestureStartRef.current?.pointerId === event.pointerId) {
                  gestureStartRef.current = null;
                }
              }}
              aria-hidden="true"
            />
            {imageCount > 1 ? (
              <div className="artwork-dialog__carousel-controls">
                <button type="button" onClick={() => stepImage(-1)} aria-label={locale === "uk" ? "Попереднє зображення" : "Previous image"}>
                  <ArrowLeft aria-hidden="true" />
                </button>
                <p aria-live="polite" aria-atomic="true">
                  {String(currentImageIndex + 1).padStart(2, "0")} / {String(imageCount).padStart(2, "0")}
                </p>
                <button type="button" onClick={() => stepImage(1)} aria-label={locale === "uk" ? "Наступне зображення" : "Next image"}>
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </ArtworkSurface>

          <div className="artwork-dialog__record">
            <ArtworkNarrative
              artwork={artwork}
              locale={locale}
              t={t}
              isFavorite={isFavorite}
              onFavorite={toggleFavorite}
              onReveal={() => controllerRef.current?.settle()}
              titleId={titleId}
              descriptionId={descriptionId}
              mode="modal"
            />
          </div>
        </div>
      </StayReveal>
    </div>
  );
}
