import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookmarkSimple, List, MoonStars, Sun, X } from "@phosphor-icons/react";
import { CONTACT_EMAIL, INSTAGRAM_URL, localeHref } from "../domain/content.js";
import { storageKeys, writeEnvelope } from "../domain/storage.js";
import { useSite } from "./SiteContext.jsx";
import { useModalLayer } from "./useModalLayer.js";
import { pagePathById } from "../../site-pages.js";

const routes = ["home", "gallery", "about", "commissions", "contact"]
  .map((id) => [id, pagePathById[id]]);

function FocusTrap({ active, containerRef, onClose }) {
  useModalLayer({ active, containerRef, onClose });
  return null;
}

function FavoritesDrawer({ onClose }) {
  const panelRef = useRef(null);
  const { locale, t, catalog, favorites, removeFavorite, clearFavorites } = useSite();
  const saved = favorites.map((id) => catalog.find((artwork) => artwork.id === id)).filter(Boolean);

  const inquire = () => {
    const inquiry = {
      artworks: saved.map(({ id, name }) => ({ id, name })),
    };
    if (writeEnvelope(storageKeys.pendingInquiry, inquiry)) {
      window.location.href = localeHref("/contact.html", locale);
      return;
    }
    const url = new URL(localeHref("/contact.html", locale), window.location.origin);
    url.searchParams.set("message", locale === "uk"
      ? `Вітаю, мене цікавлять ці роботи: ${saved.map(({ name }) => name).join(", ")}.`
      : `Hello, I’m interested in these works: ${saved.map(({ name }) => name).join(", ")}.`);
    if (saved[0]) url.searchParams.set("art", saved[0].id);
    window.location.href = `${url.pathname}${url.search}`;
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
          <button className="icon-control" type="button" onClick={onClose} aria-label={t.shell.close}><X aria-hidden="true" /></button>
        </header>
        {saved.length ? (
          <>
            <div className="saved-ledger">
              {saved.map((artwork, index) => (
                <article className="saved-row" key={artwork.id}>
                  <span className="ledger-number">{String(index + 1).padStart(2, "0")}</span>
                  <img src={artwork.mainImage} alt="" />
                  <div><h3>{artwork.name}</h3><p>{artwork.collection}</p></div>
                  <button type="button" onClick={() => removeFavorite(artwork.id)} aria-label={`${t.common.close}: ${artwork.name}`}><X aria-hidden="true" /></button>
                </article>
              ))}
            </div>
            <div className="drawer-actions">
              <button className="button button--bone" type="button" onClick={inquire}>{t.common.inquire} / {saved.length}</button>
              <button className="text-action" type="button" onClick={() => window.confirm(locale === "uk" ? "Очистити всі збережені роботи?" : "Clear every saved work?") && clearFavorites()}>{locale === "uk" ? "Очистити архів" : "Clear archive"}</button>
            </div>
          </>
        ) : (
          <div className="drawer-empty">
            <p>{locale === "uk" ? "Тут з’являться роботи, які ви захочете зберегти." : "Works you want to carry forward will appear here."}</p>
            <a className="button button--bone" href={localeHref("/gallery.html", locale)}>{t.nav.gallery}</a>
          </div>
        )}
      </aside>
    </div>
  );
}

export function SiteShell({ page, children, immersive = false, footer = true }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const menuRef = useRef(null);
  const { locale, setLocale, theme, setTheme, t, favorites, favoritesReady, favoriteMigrationNotice, dismissFavoriteMigrationNotice, storageUnavailable, dismissStorageNotice } = useSite();
  const currentPagePath = pagePathById[page] ?? pagePathById.notFound;

  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);

  return (
    <div className={`site-frame page-${page}${immersive ? " site-frame--immersive" : ""}`}>
      <a className="skip-link" href="#main-content">{t.shell.skip}</a>
      <header className="site-header">
        <a className="wordmark" href={localeHref("/", locale)} aria-label={t.shell.homeLabel}>
          <span>BRANCHSTONE</span><small>BY VIKTORIA</small>
        </a>
        <nav className="desktop-nav" aria-label={t.shell.primaryNavigation}>
          {routes.slice(1).map(([id, href]) => <a key={id} aria-current={page === id ? "page" : undefined} href={localeHref(href, locale)}>{t.nav[id]}</a>)}
        </nav>
        <div className="header-tools">
          <a
            className="language-control"
            href={localeHref(currentPagePath, locale === "en" ? "uk" : "en")}
            aria-label={t.shell.language}
            onClick={(event) => {
              event.preventDefault();
              setLocale(locale === "en" ? "uk" : "en");
            }}
          >
            {locale === "en" ? "UA" : "EN"}
          </a>
          <button className="icon-control" type="button" onClick={() => setTheme(theme === "soil" ? "paper" : "soil")} aria-label={theme === "soil" ? t.shell.themePaper : t.shell.themeSoil}>
            {theme === "soil" ? <Sun aria-hidden="true" /> : <MoonStars aria-hidden="true" />}
          </button>
          <button className="saved-control" type="button" onClick={() => setFavoritesOpen(true)} aria-label={`${t.shell.favorites}: ${favorites.length}`}>
            <BookmarkSimple aria-hidden="true" /><span aria-live="polite">{favoritesReady ? String(favorites.length).padStart(2, "0") : "00"}</span>
          </button>
          <details className="prehydrate-menu">
            <summary aria-label={t.shell.menu}><List aria-hidden="true" /></summary>
            <nav aria-label={t.shell.primaryNavigation}>
              {routes.map(([id, href], index) => (
                <a key={id} aria-current={page === id ? "page" : undefined} href={localeHref(href, locale)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>{t.nav[id]}
                </a>
              ))}
            </nav>
          </details>
          <button className="menu-control" type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-label={t.shell.menu}><List aria-hidden="true" /></button>
        </div>
      </header>

      {favoriteMigrationNotice ? (
        <div className="migration-notice" role="status"><span>{t.shell.savedAgain}</span><button type="button" onClick={dismissFavoriteMigrationNotice}>{t.common.close}</button></div>
      ) : storageUnavailable ? (
        <div className="migration-notice" role="status"><span>{t.shell.storageUnavailable}</span><button type="button" onClick={dismissStorageNotice}>{t.common.close}</button></div>
      ) : null}

      {menuOpen && (
        <div className="drawer-layer drawer-layer--menu" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setMenuOpen(false)}>
          <nav ref={menuRef} className="mobile-menu" aria-label={t.shell.primaryNavigation}>
            <FocusTrap active={menuOpen} containerRef={menuRef} onClose={() => setMenuOpen(false)} />
            <header><p className="kicker">{t.shell.routes}</p><button className="icon-control" type="button" onClick={() => setMenuOpen(false)} aria-label={t.shell.close}><X aria-hidden="true" /></button></header>
            <div className="mobile-menu__routes">
              {routes.map(([id, href], index) => <a key={id} aria-current={page === id ? "page" : undefined} href={localeHref(href, locale)}><span>{String(index + 1).padStart(2, "0")}</span>{t.nav[id]}</a>)}
            </div>
            <p>{t.shell.archive}</p>
          </nav>
        </div>
      )}

      <main id="main-content">{children}</main>

      {footer && (
        <footer className="site-footer">
          <div className="footer-statement"><p className="kicker">{t.shell.footerKicker}</p><h2>{t.shell.footerTitle}</h2></div>
          <a className="button button--line" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram <ArrowUpRight aria-hidden="true" /></a>
          <div className="footer-ledger">
            <p>© 2026 Branchstone by Viktoria</p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href={localeHref("/privacy.html", locale)}>{t.shell.privacy}</a>
            <a href={localeHref("/terms.html", locale)}>{t.shell.terms}</a>
          </div>
        </footer>
      )}
      {favoritesOpen && <FavoritesDrawer onClose={() => setFavoritesOpen(false)} />}
    </div>
  );
}
