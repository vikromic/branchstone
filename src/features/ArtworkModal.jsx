import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkSimple,
  EnvelopeSimple,
  X,
} from "@phosphor-icons/react";
import { useSite } from "../app/SiteContext.jsx";
import { useModalLayer } from "../app/useModalLayer.js";
import { localeHref } from "../domain/content.js";

export function artworkContactHref(artwork, locale, kind = "original") {
  const search = new URLSearchParams();
  search.set("art", artwork.id);
  const message = kind === "print"
    ? locale === "uk"
      ? `Вітаю, мене цікавить принт роботи «${artwork.name}».`
      : `Hello, I’m interested in a print of “${artwork.name}.”`
    : locale === "uk"
      ? `Вітаю, мене цікавить оригінал роботи «${artwork.name}». Будь ласка, розкажіть про актуальну доступність та умови придбання.`
      : `Hello, I’m interested in the original work “${artwork.name}.” Please share its current availability and acquisition details.`;
  search.set("message", message);
  return localeHref(`/contact.html?${search.toString()}`, locale);
}

export function ArtworkModal({ artwork, onClose }) {
  const { locale, t, favorites, toggleFavorite } = useSite();
  const [imageIndex, setImageIndex] = useState(0);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const gestureStartRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const isFavorite = favorites.includes(artwork.id);
  const imageCount = artwork.images.length;
  const stepImage = useCallback((direction) => {
    setImageIndex((current) => (current + direction + imageCount) % imageCount);
  }, [imageCount]);

  useEffect(() => {
    setImageIndex(0);
  }, [artwork.id]);

  useModalLayer({ containerRef: dialogRef, initialFocusRef: closeRef, onClose, lockClass: "gallery-modal-open", restoreFocus: false });

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const editsText =
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select") || target.isContentEditable);
      if (editsText || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepImage(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepImage(1);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [stepImage]);

  const previousImage = () => {
    stepImage(-1);
  };

  const nextImage = () => {
    stepImage(1);
  };

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gestureStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event) => {
    const start = gestureStartRef.current;
    gestureStartRef.current = null;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;
    if (deltaX > 0) previousImage();
    else nextImage();
  };

  const status = artwork.sold ? t.common.collected : t.common.available;

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
        aria-describedby={descriptionId}
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
          <div
            className="artwork-dialog__visual"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              gestureStartRef.current = null;
            }}
          >
            <img
              src={artwork.images[imageIndex]}
              alt={`${artwork.name}, ${imageIndex + 1} / ${imageCount}`}
              draggable="false"
            />
            {imageCount > 1 && (
              <div className="artwork-dialog__carousel-controls">
                <button type="button" onClick={previousImage} aria-label={locale === "uk" ? "Попереднє зображення" : "Previous image"}>
                  <ArrowLeft aria-hidden="true" />
                </button>
                <p aria-live="polite" aria-atomic="true">
                  {String(imageIndex + 1).padStart(2, "0")} / {String(imageCount).padStart(2, "0")}
                </p>
                <button type="button" onClick={nextImage} aria-label={locale === "uk" ? "Наступне зображення" : "Next image"}>
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div className="artwork-dialog__record">
            <div className="artwork-dialog__title-row">
              <div>
                <p className="gallery-status" data-sold={artwork.sold ? "true" : "false"}>{status}</p>
                <h2 id={titleId}>{artwork.name}</h2>
                <p className="artwork-dialog__collection">{artwork.collection}</p>
              </div>
              <button
                className="gallery-save gallery-save--modal"
                type="button"
                aria-pressed={isFavorite}
                onClick={() => toggleFavorite(artwork.id)}
                aria-label={`${isFavorite ? t.common.saved : t.common.save}: ${artwork.name}`}
              >
                <BookmarkSimple weight={isFavorite ? "fill" : "regular"} aria-hidden="true" />
                <span>{isFavorite ? t.common.saved : t.common.save}</span>
              </button>
            </div>

            <dl className="artwork-dialog__facts">
              <div><dt>{locale === "uk" ? "Рік" : "Year"}</dt><dd>{artwork.year}</dd></div>
              <div><dt>{locale === "uk" ? "Розмір" : "Dimensions"}</dt><dd>{artwork.dimensions}</dd></div>
              <div><dt>{locale === "uk" ? "Матеріали" : "Materials"}</dt><dd>{artwork.materials}</dd></div>
            </dl>

            <div className="artwork-dialog__description" id={descriptionId}>
              {String(artwork.description || "")
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>

            <div className="artwork-dialog__handoff">
              {!artwork.sold ? (
                <>
                  <div>
                    <p>{locale === "uk" ? "Оригінал доступний" : "Original available"}</p>
                    {artwork.price && <strong>USD {artwork.price}</strong>}
                  </div>
                  <a className="button button--bone" href={artworkContactHref(artwork, locale, "original")}>
                    <EnvelopeSimple aria-hidden="true" />
                    {locale === "uk" ? "Запитати про оригінал" : "Inquire about the original"}
                  </a>
                </>
              ) : artwork.prints ? (
                <>
                  <div>
                    <p>{locale === "uk" ? "Оригінал у приватній колекції" : "Original is collected"}</p>
                    <strong>{locale === "uk" ? "Принти можуть бути доступні" : "Prints may be available"}</strong>
                  </div>
                  <a className="button button--line" href={artworkContactHref(artwork, locale, "print")}>
                    <EnvelopeSimple aria-hidden="true" />
                    {locale === "uk" ? "Запитати про принт" : "Ask about a print"}
                  </a>
                </>
              ) : (
                <p>{locale === "uk" ? "Робота у приватній колекції." : "This work is held in a private collection."}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
