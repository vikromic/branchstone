import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import { artworkCopy } from "../../content/copy/artwork.js";
import { ARTWORK_TRANSITION_NAME } from "../artwork/index.js";
import "./works-grid.css";

function previewRatio(artwork) {
  const width = artwork.streamPreviewWidth;
  const height = artwork.streamPreviewHeight;
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error(`Invalid artwork preview dimensions: ${artwork.id}`);
  }
  return width / height;
}

function isPlainActivation(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

// Runs `update` inside a View Transition that morphs `source`'s image into the
// detail view. Without support, or with reduced motion, the update runs directly.
export function withArtworkTransition(source, update) {
  const doc = source?.ownerDocument;
  const reduced = doc?.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const image = source?.querySelector?.("img");
  if (!doc?.startViewTransition || reduced || !image) {
    update();
    return;
  }
  image.style.viewTransitionName = ARTWORK_TRANSITION_NAME;
  doc.startViewTransition(() => {
    image.style.viewTransitionName = "";
    flushSync(update);
  });
}

// Justified rows: every tile keeps its full composition and a row shares one
// height. Flex growth proportional to the aspect ratio does the justification
// in CSS, so the server-rendered grid is already final.
export function WorksGrid({
  artworks,
  locale,
  t,
  hrefFor,
  onOpen,
  heading: Heading = "h2",
  eagerCount = 4,
  className = "",
}) {
  const [failedPreviews, setFailedPreviews] = useState(() => new Set());
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
    <ol className={["works-grid", className].filter(Boolean).join(" ")} role="list">
      {artworks.map((artwork, position) => {
        const ratio = previewRatio(artwork);
        const failed = failedPreviews.has(artwork.id);
        const status = artwork.sold ? t.common.collected : t.common.available;
        return (
          <li
            key={artwork.id}
            className="works-grid__item"
            data-sold={artwork.sold ? "true" : "false"}
            style={{ "--ar": ratio, flexGrow: ratio }}
          >
            <a
              id={`artwork-open-${artwork.id}`}
              className="works-grid__link"
              href={hrefFor(artwork)}
              aria-haspopup={onOpen ? "dialog" : undefined}
              onClick={onOpen ? (event) => {
                if (!isPlainActivation(event)) return;
                event.preventDefault();
                onOpen(artwork.id, event.currentTarget);
              } : undefined}
            >
              <span className="works-grid__frame" data-preview-error={failed ? "true" : "false"}>
                <img
                  src={artwork.streamPreview}
                  alt=""
                  width={artwork.streamPreviewWidth}
                  height={artwork.streamPreviewHeight}
                  loading={position < eagerCount ? "eager" : "lazy"}
                  fetchPriority={position < 2 ? "high" : "auto"}
                  decoding="async"
                  draggable="false"
                  onLoad={() => setPreviewFailed(artwork.id, false)}
                  onError={() => setPreviewFailed(artwork.id, true)}
                />
                {failed ? (
                  <span className="works-grid__preview-error" aria-hidden="true">{artworkCopy[locale].imageUnavailable}</span>
                ) : null}
              </span>
              <span className="works-grid__caption">
                <Heading className="works-grid__title">{artwork.name}</Heading>
                <span className="works-grid__meta">
                  <span className="status-dot" data-sold={artwork.sold ? "true" : "false"}>
                    <span className="sr-only">{status}</span>
                  </span>
                  {artwork.year}
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
