import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookmarkSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  X,
} from "@phosphor-icons/react";
import { useSite } from "../../app/SiteContext.jsx";
import { useModalLayer } from "../../app/useModalLayer.js";
import { artworkCopy } from "../../content/copy/artwork.js";
import { storyParagraphs } from "../../domain/catalog.js";
import { artworkContactHref } from "../../domain/inquiry.js";
import { localeHref } from "../../domain/locale.js";
import { useArtworkZoom } from "./useArtworkZoom.js";
import "./artwork-dialog.css";

// The detail image animates out of the grid tile that opened it.
export const ARTWORK_TRANSITION_NAME = "artwork-focus";

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

function artworkLocaleHref(
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

// One artwork image with an honest load state: pending, ready, or error. A long
// wait offers a retry that refetches the same source with a cache-busting query.
function ArtworkImage({
  artwork,
  src,
  srcSet,
  sizes,
  width,
  height,
  alt,
  onImageSettled,
  imageStyle,
  zoomState,
  children,
}) {
  const copy = artworkCopy[artwork.locale];
  const imageRef = useRef(null);
  const retryButtonRef = useRef(null);
  const onImageSettledRef = useRef(onImageSettled);
  onImageSettledRef.current = onImageSettled;
  const [imageRecovery, setImageRecovery] = useState(() => initialImageRecovery(src));
  const activeRecovery = imageRecovery.source === src ? imageRecovery : initialImageRecovery(src);
  const imageKey = `${src}:${activeRecovery.attempt}`;
  const [loadState, setLoadState] = useState({ key: imageKey, state: "pending" });
  const imageState = loadState.key === imageKey ? loadState.state : "pending";
  const unavailable = imageState === "error";
  const recoveryVisible = activeRecovery.stalled || activeRecovery.retrying || unavailable;
  const recoveryMessage = activeRecovery.retrying
    ? copy.imageRetrying
    : unavailable
      ? copy.imageUnavailable
      : copy.imageLongWait;
  const [imageAnnouncement, setImageAnnouncement] = useState("");
  const announcementSourceRef = useRef(src);
  const pendingAnnouncementPublishedRef = useRef(false);

  const settle = useCallback((state) => {
    setLoadState({ key: imageKey, state });
  }, [imageKey]);

  useEffect(() => {
    setImageRecovery((current) => (current.source === src ? current : initialImageRecovery(src)));
  }, [src]);

  // An image that finished before hydration never fires onLoad for React.
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete) settle(image.naturalWidth > 0 ? "ready" : "error");
  }, [imageKey, settle]);

  useEffect(() => {
    if (imageState !== "pending") onImageSettledRef.current?.(imageState);
  }, [imageState, src]);

  useEffect(() => {
    if (imageState !== "pending") return undefined;
    const source = src;
    const attempt = activeRecovery.attempt;
    const recoveryId = globalThis.setTimeout(() => {
      setImageRecovery((current) => {
        const matching = current.source === source ? current : initialImageRecovery(source);
        if (matching.attempt !== attempt) return current;
        return { ...matching, stalled: true, retrying: false };
      });
    }, imageRecoveryDelayMs);
    return () => globalThis.clearTimeout(recoveryId);
  }, [activeRecovery.attempt, imageState, src]);

  useEffect(() => {
    if (announcementSourceRef.current !== src) {
      announcementSourceRef.current = src;
      pendingAnnouncementPublishedRef.current = false;
      setImageAnnouncement("");
    }
    if (activeRecovery.retrying) {
      pendingAnnouncementPublishedRef.current = true;
      setImageAnnouncement(copy.imageRetrying);
      return undefined;
    }
    if (activeRecovery.stalled && imageState === "pending") {
      pendingAnnouncementPublishedRef.current = true;
      setImageAnnouncement(copy.imageLongWait);
      return undefined;
    }
    if (imageState === "pending") {
      const announcementId = globalThis.setTimeout(() => {
        pendingAnnouncementPublishedRef.current = true;
        setImageAnnouncement(copy.imagePending);
      }, pendingImageAnnouncementDelayMs);
      return () => globalThis.clearTimeout(announcementId);
    }
    if (imageState === "error") {
      pendingAnnouncementPublishedRef.current = false;
      setImageAnnouncement(copy.imageUnavailable);
      return undefined;
    }
    if (pendingAnnouncementPublishedRef.current) {
      pendingAnnouncementPublishedRef.current = false;
      setImageAnnouncement(copy.imageReady);
    } else {
      setImageAnnouncement("");
    }
    return undefined;
  }, [activeRecovery.retrying, activeRecovery.stalled, copy, imageState, src]);

  const restoreFocusAfterRecovery = () => {
    const retryButton = retryButtonRef.current;
    if (!retryButton || retryButton.ownerDocument.activeElement !== retryButton) return;
    const dialog = retryButton.closest(".artwork-dialog");
    const stableControl = dialog?.querySelector(".artwork-dialog__carousel-controls button")
      ?? dialog?.querySelector("[data-modal-close]");
    globalThis.queueMicrotask?.(() => stableControl?.focus?.({ preventScroll: true }));
  };

  const handleImageLoad = () => {
    restoreFocusAfterRecovery();
    settle("ready");
    setImageRecovery((current) => (
      current.source === src ? { ...current, stalled: false, retrying: false } : current
    ));
  };

  const handleImageError = () => {
    settle("error");
    setImageRecovery((current) => (
      current.source === src ? { ...current, stalled: false, retrying: false } : current
    ));
  };

  const retryImage = () => {
    if (activeRecovery.retrying) return;
    const attempt = activeRecovery.attempt + 1;
    const selectedSource = imageRef.current?.currentSrc
      || imageRef.current?.src
      || activeRecovery.requestSource
      || src;
    setImageRecovery({
      source: src,
      attempt,
      requestSource: retryImageSource(selectedSource, attempt),
      stalled: false,
      retrying: true,
    });
  };

  return (
    <div
      className="artwork-surface"
      data-image-state={imageState}
      data-image-recovery={recoveryVisible ? (
        activeRecovery.retrying ? "retrying" : unavailable ? "error" : "stalled"
      ) : "idle"}
      data-zoom={zoomState?.zoomed ? "zoomed" : zoomState?.zoomable ? "ready" : "off"}
      data-zoom-motion={zoomState?.motion}
    >
      <img
        key={imageKey}
        ref={imageRef}
        src={activeRecovery.requestSource}
        srcSet={activeRecovery.attempt > 0 ? undefined : srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={unavailable ? "" : alt}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable="false"
        style={{ viewTransitionName: ARTWORK_TRANSITION_NAME, ...imageStyle }}
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
        {imageState === "pending" ? <span className="artwork-surface__loading">{copy.imagePending}</span> : null}
      </div>
      {recoveryVisible ? (
        <div className="artwork-surface__recovery">
          <p>{recoveryMessage}</p>
          <button
            ref={retryButtonRef}
            className="button"
            type="button"
            onClick={retryImage}
            aria-disabled={activeRecovery.retrying ? "true" : undefined}
          >
            {copy.imageRetry}
          </button>
        </div>
      ) : null}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {imageAnnouncement}
      </span>
      {children}
    </div>
  );
}

function ArtworkRecord({ artwork, locale, t, titleId, isFavorite, onFavorite }) {
  const copy = artworkCopy[locale];
  const status = artwork.sold ? t.common.collected : t.common.available;
  const story = storyParagraphs(artwork.story);
  return (
    <div className="artwork-record">
      <p className="kicker">{artwork.collection} · {artwork.year}</p>
      <h2 id={titleId} className="display artwork-record__title">{artwork.name}</h2>
      {story.length ? (
        <section className="artwork-record__story" aria-label={copy.story}>
          {story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ) : null}
      <dl className="artwork-record__facts">
        <div><dt>{copy.materials}</dt><dd>{artwork.materials}</dd></div>
        <div><dt>{copy.dimensions}</dt><dd>{artwork.dimensions}</dd></div>
        <div><dt>{copy.year}</dt><dd>{artwork.year}</dd></div>
        <div>
          <dt>{copy.availability}</dt>
          <dd>
            <span className="status-dot" data-sold={artwork.sold ? "true" : "false"}>{status}</span>
            {!artwork.sold && artwork.price ? <> · USD {artwork.price}</> : null}
          </dd>
        </div>
      </dl>
      {artwork.sold ? <p className="artwork-record__note">{copy.collectedNote}</p> : null}
      <div className="artwork-record__actions">
        {!artwork.sold || artwork.prints ? (
          <a
            className="button button--bone"
            href={artworkContactHref(artwork, locale, artwork.sold ? "print" : "original")}
          >
            {artwork.sold ? copy.askAboutPrint : copy.inquireAboutOriginal}
            <ArrowUpRight aria-hidden="true" />
          </a>
        ) : null}
        <button
          className="button"
          type="button"
          aria-pressed={isFavorite}
          onClick={() => onFavorite(artwork.id)}
          aria-label={`${isFavorite ? t.common.saved : t.common.save}: ${artwork.name}`}
        >
          <BookmarkSimple weight={isFavorite ? "fill" : "regular"} aria-hidden="true" />
          {isFavorite ? t.common.saved : t.common.save}
        </button>
      </div>
    </div>
  );
}

export function ArtworkModal({
  artwork,
  onClose,
  onStepWork,
  workCount = 1,
  workPosition = 1,
}) {
  const { locale, t, favorites, toggleFavorite } = useSite();
  const alternateLocale = locale === "uk" ? "en" : "uk";
  const modalCopy = artworkCopy[locale];
  const [imageSelection, setImageSelection] = useState(() => ({ artworkId: artwork.id, index: 0 }));
  const asideRef = useRef(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const gestureStartRef = useRef(null);
  const gestureSurfaceRef = useRef(null);
  const [settledImageKey, setSettledImageKey] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ key: null, width: 0, height: 0 });
  const titleId = useId();
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
  const canStepWorks = workCount > 1 && Boolean(onStepWork);
  const isPrimaryImage = currentImage === artwork.streamPrimary;
  const imageReady = settledImageKey === currentImageKey && naturalSize.key === currentImageKey;
  const zoom = useArtworkZoom({
    targetRef: gestureSurfaceRef,
    natural: !imageReady
      ? { width: 0, height: 0 }
      : isPrimaryImage
        ? { width: artwork.streamPrimaryWidth, height: artwork.streamPrimaryHeight }
        : naturalSize,
    resetKey: currentImageKey,
  });

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
    dialogRef.current?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    asideRef.current?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  }, [artwork.id]);

  useModalLayer({
    containerRef: dialogRef,
    initialFocusRef: closeRef,
    onClose,
    lockClass: "gallery-modal-open",
    restoreFocus: false,
  });

  // Warm the next carousel image only after the current one has arrived.
  useEffect(() => {
    if (imageCount < 2 || settledImageKey !== currentImageKey || typeof Image !== "function") return undefined;
    const next = new Image();
    next.fetchPriority = "low";
    next.src = displayImages[(currentImageIndex + 1) % imageCount];
    return () => {
      next.src = "";
    };
  }, [currentImageIndex, currentImageKey, displayImages, imageCount, settledImageKey]);

  const stepImage = useCallback((direction) => {
    if (imageCount < 2) return;
    setImageSelection((current) => {
      const currentIndex = current.artworkId === artwork.id ? current.index : 0;
      return { artworkId: artwork.id, index: (currentIndex + direction + imageCount) % imageCount };
    });
  }, [artwork.id, imageCount]);

  const onPointerDown = (event) => {
    if (zoom.onPointerDown(event)) {
      // A pinch or a pan owns this gesture, so the pending carousel swipe ends.
      // The swipe's pointer keeps its capture: it is now the pinch's first finger.
      if (gestureStartRef.current?.pointerId !== event.pointerId) gestureStartRef.current = null;
      return;
    }
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
    const zoomConsumed = zoom.onPointerUp(event);
    const start = finishGesture(event);
    if (zoomConsumed || !start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;
    stepImage(deltaX > 0 ? -1 : 1);
  };

  // While zoomed, keys move the image. Otherwise arrow keys browse works, as in
  // a gallery viewer. Form fields keep their keys.
  const onKeyDown = (event) => {
    if (zoom.onKeyDown(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!canStepWorks || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest?.("input, textarea, select")) return;
    if (event.key === "ArrowLeft") onStepWork(-1);
    else if (event.key === "ArrowRight") onStepWork(1);
  };

  return (
    <div
      className="artwork-dialog-layer"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        className="artwork-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <header className="artwork-dialog__header">
          <button
            ref={closeRef}
            className="button artwork-dialog__close"
            type="button"
            data-modal-close
            onClick={onClose}
          >
            <X aria-hidden="true" />
            {t.common.close}
          </button>
          <p className="artwork-dialog__position" aria-hidden="true">
            {canStepWorks
              ? `${String(workPosition).padStart(2, "0")} / ${String(workCount).padStart(2, "0")}`
              : `${t.shell.archiveIndex} / ${String(artwork.index + 1).padStart(2, "0")}`}
          </p>
          <a
            className="button artwork-dialog__locale"
            href={artworkLocaleHref(artwork.id, alternateLocale)}
            aria-label={`${modalCopy.alternateLanguageChip}, ${modalCopy.switchLanguage}`}
            lang={alternateLocale}
          >
            {modalCopy.alternateLanguageChip}
          </a>
        </header>

        <div className="artwork-dialog__stage">
          <ArtworkImage
            artwork={{ ...artwork, locale }}
            src={currentImage}
            srcSet={currentImage === artwork.streamPrimary && !zoom.fullResolution ? artwork.streamSrcSet : undefined}
            sizes="(min-width: 960px) 60vw, calc(100vw - 2.5rem)"
            width={currentImage === artwork.streamPrimary ? artwork.streamPrimaryWidth : undefined}
            height={currentImage === artwork.streamPrimary ? artwork.streamPrimaryHeight : undefined}
            alt={`${artwork.name}, ${currentImageIndex + 1} / ${imageCount}`}
            onImageSettled={(state) => {
              if (state !== "ready") return;
              const image = dialogRef.current?.querySelector(".artwork-surface img");
              setNaturalSize({
                key: currentImageKey,
                width: image?.naturalWidth ?? 0,
                height: image?.naturalHeight ?? 0,
              });
              setSettledImageKey(currentImageKey);
            }}
            imageStyle={zoom.imageStyle}
            zoomState={zoom}
          >
            <div
              ref={gestureSurfaceRef}
              className="artwork-dialog__gesture-surface"
              onPointerDown={onPointerDown}
              onPointerMove={zoom.onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={(event) => {
                zoom.onPointerCancel(event);
                finishGesture(event);
              }}
              onLostPointerCapture={(event) => {
                zoom.onPointerCancel(event);
                if (gestureStartRef.current?.pointerId === event.pointerId) gestureStartRef.current = null;
              }}
              title={zoom.zoomable ? modalCopy.zoomHint : undefined}
              aria-hidden="true"
            />
          </ArtworkImage>
          {imageCount > 1 || zoom.zoomable ? (
            <div className="artwork-dialog__carousel-controls">
              {imageCount > 1 ? (
                <>
                  <button className="icon-control" type="button" onClick={() => stepImage(-1)} aria-label={modalCopy.previousImage}>
                    <ArrowLeft aria-hidden="true" />
                  </button>
                  <p aria-live="polite" aria-atomic="true">
                    <span className="sr-only">{modalCopy.image} </span>
                    {currentImageIndex + 1} / {imageCount}
                  </p>
                  <button className="icon-control" type="button" onClick={() => stepImage(1)} aria-label={modalCopy.nextImage}>
                    <ArrowRight aria-hidden="true" />
                  </button>
                </>
              ) : null}
              {zoom.zoomable ? (
                <span className="artwork-dialog__zoom">
                  <button
                    className="icon-control"
                    type="button"
                    aria-pressed={zoom.zoomed}
                    aria-label={modalCopy.zoom}
                    title={modalCopy.zoomHint}
                    onClick={() => zoom.toggle()}
                  >
                    {zoom.zoomed ? <MagnifyingGlassMinus aria-hidden="true" /> : <MagnifyingGlassPlus aria-hidden="true" />}
                  </button>
                  {zoom.zoomed ? <span className="artwork-dialog__zoom-level" aria-hidden="true">{zoom.percent}%</span> : null}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div ref={asideRef} className="artwork-dialog__aside">
          <div key={artwork.id} className="artwork-dialog__record">
            <ArtworkRecord
              artwork={artwork}
              locale={locale}
              t={t}
              titleId={titleId}
              isFavorite={isFavorite}
              onFavorite={toggleFavorite}
            />
          </div>
          {canStepWorks ? (
            <nav className="artwork-dialog__work-navigation" aria-label={modalCopy.browseWorks}>
              <button className="button" type="button" onClick={() => onStepWork(-1)} aria-label={modalCopy.previousWork}>
                <ArrowLeft aria-hidden="true" />
                <span aria-hidden="true">{modalCopy.previousWorkShort}</span>
              </button>
              <button className="button" type="button" onClick={() => onStepWork(1)} aria-label={modalCopy.nextWork}>
                <span aria-hidden="true">{modalCopy.nextWorkShort}</span>
                <ArrowRight aria-hidden="true" />
              </button>
              <span className="sr-only" aria-live="polite" aria-atomic="true">
                {modalCopy.workAnnouncement(artwork.name, workPosition, workCount)}
              </span>
            </nav>
          ) : null}
        </div>
      </section>
    </div>
  );
}
