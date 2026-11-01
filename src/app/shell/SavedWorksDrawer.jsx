import { useRef } from "react";
import { X } from "@phosphor-icons/react";
import { useSite } from "../SiteContext.jsx";
import { FocusTrap } from "../useModalLayer.js";
import { quietChromeCopy, savedWorksCopy } from "../../content/copy/shell.js";
import { savedWorksContactHref, savedWorksInquiryPayload } from "../../domain/inquiry.js";
import { localeHref } from "../../domain/locale.js";
import { storageKeys } from "../../domain/storage.js";
import { writeEnvelope } from "../../platform/local-storage.js";

export function SavedWorksDrawer({ onClose }) {
  const panelRef = useRef(null);
  const { locale, t, catalog, favorites, removeFavorite, clearFavorites } = useSite();
  const chrome = quietChromeCopy[locale];
  const savedCopy = savedWorksCopy[locale];
  const saved = favorites.map((id) => catalog.find((artwork) => artwork.id === id)).filter(Boolean);

  const inquire = () => {
    if (writeEnvelope(storageKeys.pendingInquiry, savedWorksInquiryPayload(saved))) {
      window.location.href = localeHref("/contact.html", locale);
      return;
    }
    window.location.href = savedWorksContactHref(saved, locale);
  };

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside ref={panelRef} className="archive-drawer" role="dialog" aria-modal="true" aria-labelledby="saved-title">
        <FocusTrap active containerRef={panelRef} onClose={onClose} />
        <header className="drawer-header">
          <div>
            <p className="kicker">{t.shell.archiveIndex} / {String(saved.length).padStart(2, "0")}</p>
            <h2 id="saved-title">{t.shell.favorites}</h2>
          </div>
          <button className="icon-control" type="button" onClick={onClose} aria-label={chrome.backToIndex}><X aria-hidden="true" /></button>
        </header>
        {saved.length ? (
          <>
            <div className="saved-ledger">
              {saved.map((artwork, index) => (
                <article className="saved-row" key={artwork.id}>
                  <span className="ledger-number">{String(index + 1).padStart(2, "0")}</span>
                  <img
                    src={artwork.streamPreview ?? artwork.mainImage}
                    alt=""
                    width={artwork.streamPreviewWidth}
                    height={artwork.streamPreviewHeight}
                    loading="lazy"
                    decoding="async"
                  />
                  <div><h3>{artwork.name}</h3><p>{artwork.collection}</p></div>
                  <button type="button" onClick={() => removeFavorite(artwork.id)} aria-label={`${chrome.removeSaved}: ${artwork.name}`}><X aria-hidden="true" /></button>
                </article>
              ))}
            </div>
            <div className="drawer-actions">
              <button className="button button--bone" type="button" onClick={inquire}>{t.common.inquire} / {saved.length}</button>
              <button className="text-action" type="button" onClick={() => window.confirm(savedCopy.clearConfirm) && clearFavorites()}>{savedCopy.clearArchive}</button>
            </div>
          </>
        ) : (
          <div className="drawer-empty">
            <p>{savedCopy.empty}</p>
            <a className="button button--bone" href={localeHref("/gallery.html", locale)}>{t.nav.gallery}</a>
          </div>
        )}
      </aside>
    </div>
  );
}
