import { ArrowUpRight } from "@phosphor-icons/react";
import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { catalogStats } from "../content/artworks.js";
import { homeCopy } from "../content/copy/home.js";
import { collections, selectHomeArtworks } from "../domain/catalog.js";
import { localeHref } from "../domain/locale.js";
import { WorksGrid } from "../features/works/index.js";
import { pagePathById } from "../../site-pages.js";
import "../styles/home.css";

const studioRoutes = ["exhibitions", "about", "commissions"];

export function HomePage() {
  const { catalog, locale, t } = useSite();
  const copy = homeCopy[locale];
  const selected = selectHomeArtworks(catalog);
  const galleryHref = localeHref("/gallery.html", locale);

  return (
    <SiteShell page="home">
      <section className="home-hero" aria-labelledby="home-title">
        <p className="kicker">{copy.kicker}</p>
        <h1 id="home-title" className="display home-hero__title">{copy.title}</h1>
        <div className="home-hero__row">
          <div className="home-hero__lead">
            <p className="lede">{copy.lede}</p>
            <div className="home-hero__actions">
              <a className="button button--bone" href={galleryHref}>{copy.viewAll}</a>
              <a className="button" href={localeHref(pagePathById.about, locale)}>{copy.practice}</a>
            </div>
          </div>
          <dl className="facts" aria-label={copy.factsLabel}>
            <div><dt>{copy.works}</dt><dd>{catalogStats.total}</dd></div>
            <div><dt>{copy.available}</dt><dd>{catalogStats.available}</dd></div>
            <div><dt>{copy.series}</dt><dd>{collections.length}</dd></div>
          </dl>
        </div>
      </section>

      <section className="home-selected page-section" aria-labelledby="home-selected-title">
        <header className="home-section-head">
          <h2 id="home-selected-title" className="display">{copy.selectedTitle}</h2>
          <p>{copy.selectedNote}</p>
        </header>
        <WorksGrid
          artworks={selected}
          locale={locale}
          t={t}
          heading="h3"
          eagerCount={4}
          hrefFor={(artwork) => localeHref(`/gallery.html?art=${encodeURIComponent(artwork.id)}`, locale)}
        />
        <a className="button home-selected__all" href={galleryHref}>
          {copy.viewAll} · {catalogStats.total}
        </a>
      </section>

      <section className="home-studio page-section" aria-labelledby="home-studio-title">
        <h2 id="home-studio-title" className="kicker">{copy.moreTitle}</h2>
        <ul className="home-studio__list" role="list">
          {studioRoutes.map((id) => (
            <li key={id}>
              <a href={localeHref(pagePathById[id], locale)}>
                <span className="home-studio__name">{t.nav[id]}</span>
                <span className="home-studio__note">{copy.routes[id]}</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </SiteShell>
  );
}
