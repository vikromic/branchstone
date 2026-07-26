import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
import indexMaterial from "../assets/material-stage/bottom-strata-alpha.webp";
import {
  CONTACT_EMAIL,
  INSTAGRAM_URL,
  contactInquiryHref,
  localeHref,
} from "../domain/content.js";
import { storageKeys, writeEnvelope } from "../domain/storage.js";
import { useSite } from "./SiteContext.jsx";
import { useModalLayer } from "./useModalLayer.js";
import { pagePathById } from "../../site-pages.js";

const routes = ["home", "gallery", "exhibitions", "about", "contact"]
  .map((id) => [id, pagePathById[id]]);
const primaryRoutes = routes.filter(([id]) => id !== "home");

const quietChromeCopy = {
  en: {
    allWorks: "all works",
    index: "index",
    openIndex: "Open the site index",
    language: "Language",
    languageValue: "Українська",
    appearance: "Appearance",
    soil: "Soil",
    paper: "Paper",
    correspondence: "Email the studio",
    commissionGuide: "Commission guide",
    studioNotes: "Studio notes / Instagram",
    removeSaved: "Remove from saved works",
    utilities: "Studio and legal links",
  },
  uk: {
    allWorks: "усі роботи",
    index: "індекс",
    openIndex: "Відкрити індекс сайту",
    language: "Мова",
    languageValue: "English",
    appearance: "Вигляд",
    soil: "Ґрунт",
    paper: "Папір",
    correspondence: "Написати до студії",
    commissionGuide: "Гайд із замовлення",
    studioNotes: "Нотатки студії / Instagram",
    removeSaved: "Видалити зі збережених робіт",
    utilities: "Студійні та юридичні посилання",
  },
};

function FocusTrap({ active, containerRef, onClose }) {
  useModalLayer({ active, containerRef, onClose });
  return null;
}

function RouteNavigation({ className, items = routes, locale, numbered = false, page, t }) {
  return (
    <nav className={className} aria-label={t.shell.primaryNavigation}>
      {items.map(([id, href], index) => (
        <a key={id} aria-current={page === id ? "page" : undefined} href={localeHref(href, locale)}>
          {numbered && <span>{String(index + 1).padStart(2, "0")}</span>}
          {t.nav[id]}
        </a>
      ))}
    </nav>
  );
}

function SecondaryLinks({ chrome, locale, page, t }) {
  return (
    <>
      <a href={`mailto:${CONTACT_EMAIL}`}>{chrome.correspondence}</a>
      <a aria-current={page === "commissions" ? "page" : undefined} href={localeHref("/commissions.html", locale)}>{chrome.commissionGuide}</a>
      <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">{chrome.studioNotes}</a>
      <LegalLinks page={page} locale={locale} t={t} />
    </>
  );
}

function IndexMaterial() {
  return (
    <div className="site-index__material" aria-hidden="true">
      <picture>
        <source media="(min-width: 760px)" srcSet={indexMaterial} />
        <img alt="" decoding="async" />
      </picture>
    </div>
  );
}

function LegalLinks({ page, locale, t }) {
  return (
    <>
      <a aria-current={page === "privacy" ? "page" : undefined} href={localeHref("/privacy.html", locale)}>{t.shell.privacy}</a>
      <a aria-current={page === "terms" ? "page" : undefined} href={localeHref("/terms.html", locale)}>{t.shell.terms}</a>
    </>
  );
}

function FavoritesDrawer({ onClose }) {
  const panelRef = useRef(null);
  const { locale, t, catalog, favorites, removeFavorite, clearFavorites } = useSite();
  const chrome = quietChromeCopy[locale];
  const saved = favorites.map((id) => catalog.find((artwork) => artwork.id === id)).filter(Boolean);

  const inquire = () => {
    const inquiry = {
      artworks: saved.map(({ id, name }) => ({ id, name })),
    };
    if (writeEnvelope(storageKeys.pendingInquiry, inquiry)) {
      window.location.href = localeHref("/contact.html", locale);
      return;
    }
    const message = locale === "uk"
      ? `Вітаю, мене цікавлять ці роботи: ${saved.map(({ name }) => name).join(", ")}.`
      : `Hello, I’m interested in these works: ${saved.map(({ name }) => name).join(", ")}.`;
    window.location.href = contactInquiryHref(locale, message, saved.map(({ id }) => id));
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
                  <img src={artwork.mainImage} alt="" loading="lazy" decoding="async" />
                  <div><h3>{artwork.name}</h3><p>{artwork.collection}</p></div>
                  <button type="button" onClick={() => removeFavorite(artwork.id)} aria-label={`${chrome.removeSaved}: ${artwork.name}`}><X aria-hidden="true" /></button>
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
  const indexControlRef = useRef(null);
  const { locale, setLocale, theme, setTheme, t, favorites, favoritesReady, favoriteMigrationNotice, dismissFavoriteMigrationNotice, storageUnavailable, dismissStorageNotice } = useSite();
  const currentPagePath = pagePathById[page] ?? pagePathById.notFound;
  const chrome = quietChromeCopy[locale];
  const indexLabel = chrome.index;
  const indexAriaLabel = chrome.openIndex;
  const alternateLocale = locale === "en" ? "uk" : "en";
  const savedCount = favoritesReady ? String(favorites.length).padStart(2, "0") : "00";
  const closeFavorites = () => {
    setFavoritesOpen(false);
    requestAnimationFrame(() => indexControlRef.current?.focus?.({ preventScroll: true }));
  };

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
        <RouteNavigation className="primary-navigation" items={primaryRoutes} locale={locale} page={page} t={t} />
        <div className="quiet-index-trigger">
          {page === "home" && (
            <a className="all-works-link" href={localeHref("/gallery.html", locale)}>{chrome.allWorks}</a>
          )}
          <details className="prehydrate-index">
            <summary aria-label={indexAriaLabel} aria-controls="prehydrate-index-layer" data-open-label={t.shell.close}><span>{indexLabel}</span></summary>
            <div id="prehydrate-index-layer" className="prehydrate-index__layer" role="region" aria-label={indexLabel}>
              <RouteNavigation locale={locale} numbered page={page} t={t} />
              <div className="prehydrate-index__utilities" role="group" aria-label={chrome.utilities}>
                <a href={localeHref(currentPagePath, alternateLocale)}>{chrome.languageValue}</a>
                <span>{chrome.appearance} / {theme === "soil" ? chrome.soil : chrome.paper}</span>
                <span>{t.shell.favorites} / {savedCount}</span>
                <SecondaryLinks chrome={chrome} locale={locale} page={page} t={t} />
              </div>
            </div>
          </details>
          <button
            ref={indexControlRef}
            className="index-control"
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-controls="site-index-layer"
            aria-label={indexAriaLabel}
          >
            {indexLabel}
          </button>
        </div>
      </header>

      {favoriteMigrationNotice ? (
        <div className="migration-notice" role="status"><span>{t.shell.savedAgain}</span><button type="button" onClick={dismissFavoriteMigrationNotice}>{t.common.close}</button></div>
      ) : storageUnavailable ? (
        <div className="migration-notice" role="status"><span>{t.shell.storageUnavailable}</span><button type="button" onClick={dismissStorageNotice}>{t.common.close}</button></div>
      ) : null}

      {menuOpen && (
        <div className="drawer-layer drawer-layer--index" role="presentation">
          <section id="site-index-layer" ref={menuRef} className="site-index" role="dialog" aria-modal="true" aria-labelledby="site-index-title">
            <FocusTrap active={menuOpen} containerRef={menuRef} onClose={() => setMenuOpen(false)} />
            <IndexMaterial />
            <header className="site-index__header">
              <p id="site-index-title">{indexLabel}</p>
              <button className="site-index__close" type="button" onClick={() => setMenuOpen(false)}>{t.shell.close}</button>
            </header>
            <RouteNavigation className="site-index__routes" locale={locale} numbered page={page} t={t} />
            <div className="site-index__utilities">
              <p className="site-index__utility-label">{t.shell.archive}</p>
              <div className="site-index__utility-actions">
                <a
                  href={localeHref(currentPagePath, alternateLocale)}
                  aria-label={t.shell.language}
                  onClick={(event) => {
                    event.preventDefault();
                    setMenuOpen(false);
                    setLocale(alternateLocale);
                  }}
                >
                  <span>{chrome.language}</span><small>{chrome.languageValue}</small>
                </a>
                <button
                  type="button"
                  onClick={() => setTheme(theme === "soil" ? "paper" : "soil")}
                  aria-label={theme === "soil" ? t.shell.themePaper : t.shell.themeSoil}
                >
                  <span>{chrome.appearance}</span><small>{theme === "soil" ? chrome.soil : chrome.paper}</small>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setFavoritesOpen(true);
                  }}
                  aria-haspopup="dialog"
                  aria-label={`${t.shell.favorites}: ${favorites.length}`}
                >
                  <span>{t.shell.favorites}</span><small aria-live="polite">{savedCount}</small>
                </button>
              </div>
              <nav className="site-index__secondary" aria-label={chrome.utilities}>
                <SecondaryLinks chrome={chrome} locale={locale} page={page} t={t} />
              </nav>
            </div>
          </section>
        </div>
      )}

      <main id="main-content" tabIndex="-1">{children}</main>

      {footer && (
        <footer className="site-footer">
          <div className="footer-statement"><p className="kicker">{t.shell.footerKicker}</p><h2>{t.shell.footerTitle}</h2></div>
          <div className="footer-ledger">
            <p>© 2026 Branchstone by Viktoria</p>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <LegalLinks page={page} locale={locale} t={t} />
          </div>
        </footer>
      )}
      {favoritesOpen && <FavoritesDrawer onClose={closeFavorites} />}
    </div>
  );
}
