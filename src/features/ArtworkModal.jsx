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
import { contactInquiryHref, localeHref } from "../domain/content.js";
import {
  StayArtworkImage,
  StayPhase,
  StayReveal,
  useStayRevealContext,
} from "./stay/index.js";

const pendingImageAnnouncementDelayMs = 500;
const imageRecoveryDelayMs = 15000;

function initialImageRecovery(source) {
  return {
    source,
    attempt: 0,
    requestSource: source,
    stalled: false,
    retrying: false,
  };
}

function retryImageSource(source, attempt) {
  try {
    const url = new URL(source, globalThis.location?.href ?? "https://branchstone.art/");
    url.searchParams.set("branchstone-retry", `${attempt}-${Date.now()}`);
    return url.href;
  } catch {
    const separator = String(source).includes("?") ? "&" : "?";
    return `${source}${separator}branchstone-retry=${attempt}-${Date.now()}`;
  }
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

export function artworkLocaleHref(
  artworkId,
  locale,
  href = globalThis.location?.href,
) {
  const url = new URL(href ?? "/gallery.html", "https://branchstone.art");
  url.pathname = "/gallery.html";
  url.searchParams.delete("artwork");
  url.searchParams.set("art", artworkId);
  url.hash = "";
  return localeHref(`${url.pathname}${url.search}`, locale);
}

export function storyParagraphs(story) {
  return String(story)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function artworkImageUnavailableLabel(locale) {
  return locale === "uk"
    ? "Зображення тимчасово недоступне"
    : "Image temporarily unavailable";
}

export function ArtworkSurface({
  artwork,
  src,
  alt,
  className = "",
  loading = "lazy",
  fetchPriority = "auto",
  height,
  announcePending = false,
  recoverable = false,
  onImageSettled,
  onOpen,
  openId,
  sizes,
  srcSet,
  width,
  children,
}) {
  const {
    artworkImageState: imageState,
    retryArtworkImage,
  } = useStayRevealContext();
  const imageRef = useRef(null);
  const retryButtonRef = useRef(null);
  const onImageSettledRef = useRef(onImageSettled);
  onImageSettledRef.current = onImageSettled;
  const announcementSourceRef = useRef(src);
  const pendingAnnouncementPublishedRef = useRef(false);
  const [imageRecovery, setImageRecovery] = useState(() => initialImageRecovery(src));
  const activeRecovery = imageRecovery.source === src
    ? imageRecovery
    : initialImageRecovery(src);
  const unavailable = imageState === "error";
  const pendingLabel = artwork.locale === "uk"
    ? "Матеріал проявляється"
    : "Material coming into view";
  const unavailableLabel = artworkImageUnavailableLabel(artwork.locale);
  const longWaitLabel = artwork.locale === "uk"
    ? "Зображення завантажується довше, ніж очікувалося. Можна продовжити чекати або спробувати ще раз."
    : "This image is taking longer than expected. You can keep waiting or try again.";
  const retryLabel = artwork.locale === "uk" ? "Спробувати ще раз" : "Try again";
  const retryingLabel = artwork.locale === "uk"
    ? "Пробуємо завантажити зображення ще раз…"
    : "Trying the image again…";
  const recoveryVisible = recoverable && (
    activeRecovery.stalled
    || activeRecovery.retrying
    || unavailable
  );
  const recoveryMessage = activeRecovery.retrying
    ? retryingLabel
    : unavailable
      ? unavailableLabel
      : longWaitLabel;
  const [imageAnnouncement, setImageAnnouncement] = useState("");
  const phaseClassName = ["artwork-surface", className].filter(Boolean).join(" ");

  useEffect(() => {
    setImageRecovery((current) => (
      current.source === src ? current : initialImageRecovery(src)
    ));
  }, [src]);

  useEffect(() => {
    if (imageState !== "pending") onImageSettledRef.current?.(imageState);
  }, [imageState, src]);

  useEffect(() => {
    if (!recoverable || imageState !== "pending") return undefined;
    const source = src;
    const attempt = activeRecovery.attempt;
    const recoveryId = globalThis.setTimeout(() => {
      setImageRecovery((current) => {
        const matching = current.source === source
          ? current
          : initialImageRecovery(source);
        if (matching.attempt !== attempt) return current;
        return { ...matching, stalled: true, retrying: false };
      });
    }, imageRecoveryDelayMs);
    return () => globalThis.clearTimeout(recoveryId);
  }, [activeRecovery.attempt, imageState, recoverable, src]);

  useEffect(() => {
    if (!announcePending) return undefined;
    if (announcementSourceRef.current !== src) {
      announcementSourceRef.current = src;
      pendingAnnouncementPublishedRef.current = false;
      setImageAnnouncement("");
    }
    if (activeRecovery.retrying) {
      pendingAnnouncementPublishedRef.current = true;
      setImageAnnouncement(retryingLabel);
      return undefined;
    }
    if (activeRecovery.stalled && imageState === "pending") {
      pendingAnnouncementPublishedRef.current = true;
      setImageAnnouncement(longWaitLabel);
      return undefined;
    }
    if (imageState === "pending") {
      const announcementId = globalThis.setTimeout(() => {
        pendingAnnouncementPublishedRef.current = true;
        setImageAnnouncement(pendingLabel);
      }, pendingImageAnnouncementDelayMs);
      return () => globalThis.clearTimeout(announcementId);
    }
    if (imageState === "error") {
      pendingAnnouncementPublishedRef.current = false;
      setImageAnnouncement(unavailableLabel);
      return undefined;
    }
    if (pendingAnnouncementPublishedRef.current) {
      pendingAnnouncementPublishedRef.current = false;
      setImageAnnouncement(
        artwork.locale === "uk" ? "Зображення завантажено" : "Image ready",
      );
    } else {
      setImageAnnouncement("");
    }
    return undefined;
  }, [
    activeRecovery.retrying,
    activeRecovery.stalled,
    announcePending,
    artwork.locale,
    imageState,
    longWaitLabel,
    pendingLabel,
    retryingLabel,
    src,
    unavailableLabel,
  ]);

  const restoreFocusAfterRecovery = () => {
    const retryButton = retryButtonRef.current;
    if (!retryButton || retryButton.ownerDocument.activeElement !== retryButton) return;
    const root = retryButton.closest("[data-stay-root]");
    const stableControl = root?.querySelector(".artwork-dialog__carousel-controls button")
      ?? root?.querySelector("[data-modal-close]")
      ?? root?.querySelector(".artwork-surface__open");
    globalThis.queueMicrotask?.(() => stableControl?.focus?.({ preventScroll: true }));
  };

  const handleImageLoad = () => {
    restoreFocusAfterRecovery();
    setImageRecovery((current) => {
      if (current.source !== src) return current;
      return { ...current, stalled: false, retrying: false };
    });
  };

  const handleImageError = () => {
    setImageRecovery((current) => {
      if (current.source !== src) return current;
      return { ...current, stalled: false, retrying: false };
    });
  };

  const retryImage = () => {
    if (activeRecovery.retrying) return;
    const attempt = activeRecovery.attempt + 1;
    const selectedSource = imageRef.current?.currentSrc
      || imageRef.current?.src
      || activeRecovery.requestSource
      || src;
    retryArtworkImage();
    setImageRecovery({
      source: src,
      attempt,
      requestSource: retryImageSource(selectedSource, attempt),
      stalled: false,
      retrying: true,
    });
  };

  return (
    <StayPhase
      as="div"
      phase="artwork"
      className={phaseClassName}
      data-image-state={imageState}
      data-image-recovery={recoveryVisible ? (
        activeRecovery.retrying ? "retrying" : unavailable ? "error" : "stalled"
      ) : "idle"}
    >
      <StayArtworkImage
        key={`${src}:${activeRecovery.attempt}`}
        ref={imageRef}
        src={activeRecovery.requestSource}
        alt={unavailable ? "" : alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        height={height}
        draggable="false"
        sizes={sizes}
        srcSet={activeRecovery.attempt > 0 ? undefined : srcSet}
        width={width}
        data-image-request-attempt={activeRecovery.attempt}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      <div
        className="artwork-surface__placeholder"
        role={unavailable ? "img" : undefined}
        aria-label={unavailable ? artwork.name : undefined}
        aria-hidden={unavailable ? undefined : "true"}
      >
        {imageState === "pending" ? (
          <span className="artwork-surface__loading">
            {pendingLabel}
          </span>
        ) : null}
        {unavailable && !recoverable ? (
          <span className="artwork-surface__error">
            {unavailableLabel}
          </span>
        ) : null}
      </div>
      {recoveryVisible ? (
        <div
          className="artwork-surface__recovery"
          role={announcePending ? undefined : "status"}
          aria-live={announcePending ? undefined : "polite"}
          aria-atomic={announcePending ? undefined : "true"}
        >
          <p>{recoveryMessage}</p>
          <button
            ref={retryButtonRef}
            type="button"
            onClick={retryImage}
            aria-disabled={activeRecovery.retrying ? "true" : undefined}
          >
            {retryLabel}
          </button>
        </div>
      ) : null}
      {announcePending ? (
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {imageAnnouncement}
        </span>
      ) : null}
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
          ) : null}
          {artwork.sold ? (
            <p className="artwork-narrative__collected-note">
              {locale === "uk" ? "Робота у приватній колекції." : "This work is held in a private collection."}
            </p>
          ) : null}
        </div>
      </StayPhase>
    </div>
  );
}

export function ArtworkModal({
  artwork,
  forceResolved = false,
  onClose,
  onStepWork,
  workCount = 1,
  workPosition = 1,
}) {
  const { locale, t, favorites, toggleFavorite } = useSite();
  const alternateLocale = locale === "uk" ? "en" : "uk";
  const languageLabel = locale === "uk"
    ? "Перейти на англійську"
    : "Switch to Ukrainian";
  const [imageSelection, setImageSelection] = useState(() => ({
    artworkId: artwork.id,
    index: 0,
  }));
  const scrollLayerRef = useRef(null);
  const recordRef = useRef(null);
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
  const imageIndex = imageSelection.artworkId === artwork.id ? imageSelection.index : 0;
  const currentImageIndex = Math.min(imageIndex, Math.max(imageCount - 1, 0));
  const currentImage = displayImages[currentImageIndex];
  const currentImageKey = `${artwork.id}:${currentImageIndex}:${currentImage}`;

  useEffect(() => {
    setImageSelection((current) => (
      current.artworkId === artwork.id && current.index === 0
        ? current
        : { artworkId: artwork.id, index: 0 }
    ));
    setSettledImageKey(null);
    const activeGesture = gestureStartRef.current;
    if (activeGesture?.surface?.hasPointerCapture?.(activeGesture.pointerId)) {
      activeGesture.surface.releasePointerCapture?.(activeGesture.pointerId);
    }
    gestureStartRef.current = null;
    scrollLayerRef.current?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    recordRef.current?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
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
    const next = new Image();
    next.fetchPriority = "low";
    next.src = displayImages[(currentImageIndex + 1) % imageCount];
    return () => {
      next.src = "";
    };
  }, [currentImageIndex, currentImageKey, displayImages, imageCount, settledImageKey]);

  const stepImage = useCallback((direction) => {
    if (imageCount < 2) return;
    controllerRef.current?.motion.begin("carousel");
    setImageSelection((current) => {
      const currentIndex = current.artworkId === artwork.id ? current.index : 0;
      return {
        artworkId: artwork.id,
        index: (currentIndex + direction + imageCount) % imageCount,
      };
    });
  }, [artwork.id, imageCount]);

  const onPointerDown = (event) => {
    if (
      event.isPrimary === false
      || gestureStartRef.current
      || (event.pointerType === "mouse" && event.button !== 0)
    ) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gestureStartRef.current = {
      artworkId: artwork.id,
      surface: event.currentTarget,
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  };

  const finishGesture = (event) => {
    const start = gestureStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return null;
    gestureStartRef.current = null;
    if (start.surface?.hasPointerCapture?.(event.pointerId)) {
      start.surface.releasePointerCapture?.(event.pointerId);
    }
    if (start.artworkId !== artwork.id) return null;
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
        forceResolved={forceResolved}
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
          <div className="artwork-dialog__actions">
            <a
              className="artwork-dialog__locale"
              href={artworkLocaleHref(artwork.id, alternateLocale)}
              aria-label={languageLabel}
            >
              {alternateLocale === "uk" ? "УКР" : "EN"}
            </a>
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
          </div>
        </header>

        <div className="artwork-dialog__body">
          <div className="artwork-dialog__art-column">
            <ArtworkSurface
              artwork={artworkForSurface}
              src={currentImage}
              srcSet={currentImage === artwork.streamPrimary ? artwork.streamSrcSet : undefined}
              sizes="(min-width: 1180px) 56vw, (min-width: 760px) 52vw, calc(100vw - 2rem)"
              width={currentImage === artwork.streamPrimary ? artwork.streamPrimaryWidth : undefined}
              height={currentImage === artwork.streamPrimary ? artwork.streamPrimaryHeight : undefined}
              alt={`${artwork.name}, ${currentImageIndex + 1} / ${imageCount}`}
              className="artwork-dialog__visual"
              loading="eager"
              fetchPriority="high"
              announcePending
              recoverable
              onImageSettled={(state) => {
                if (state === "ready") setSettledImageKey(currentImageKey);
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
                    <span>{locale === "uk" ? "Зображення" : "Image"}</span>
                    <span>
                      {String(currentImageIndex + 1).padStart(2, "0")}
                      {" / "}
                      {String(imageCount).padStart(2, "0")}
                    </span>
                  </p>
                  <button type="button" onClick={() => stepImage(1)} aria-label={locale === "uk" ? "Наступне зображення" : "Next image"}>
                    <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </ArtworkSurface>
            {workCount > 1 && onStepWork ? (
              <nav
                className="artwork-dialog__work-navigation"
                aria-label={locale === "uk" ? "Перехід між роботами" : "Browse works"}
              >
                <button
                  type="button"
                  onClick={() => onStepWork(-1)}
                  aria-label={locale === "uk" ? "Назад до попередньої роботи" : "Previous work"}
                >
                  <ArrowLeft aria-hidden="true" />
                  <span>{locale === "uk" ? "Назад" : "Prev"}</span>
                </button>
                <p aria-hidden="true">
                  <span>{locale === "uk" ? "Робота" : "Work"}</span>
                  <span>
                    {String(workPosition).padStart(2, "0")}
                    {" / "}
                    {String(workCount).padStart(2, "0")}
                  </span>
                </p>
                <span className="sr-only" aria-live="polite" aria-atomic="true">
                  {locale === "uk"
                    ? `${artwork.name} — робота ${workPosition} з ${workCount}`
                    : `${artwork.name} — work ${workPosition} of ${workCount}`}
                </span>
                <button
                  type="button"
                  onClick={() => onStepWork(1)}
                  aria-label={locale === "uk" ? "Далі до наступної роботи" : "Next work"}
                >
                  <span>{locale === "uk" ? "Далі" : "Next"}</span>
                  <ArrowRight aria-hidden="true" />
                </button>
              </nav>
            ) : null}
          </div>

          <div key={artwork.id} ref={recordRef} className="artwork-dialog__record">
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
