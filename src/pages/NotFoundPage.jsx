import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { notFoundCopy } from "../content/copy/not-found.js";
import { localeHref } from "../domain/locale.js";
import "../styles/editorial.css";

export function NotFoundPage() {
  const { locale, catalog } = useSite();
  const content = notFoundCopy[locale];
  const artwork = catalog.find(({ highlighted }) => highlighted) ?? catalog[0];

  return (
    <SiteShell page="notFound" footer={false}>
      <section className="not-found" aria-labelledby="not-found-title">
        <div className="not-found__copy">
          <p className="kicker">{content.eyebrow}</p>
          <p className="not-found__code"><span aria-hidden="true">404</span><span className="sr-only">{content.errorLabel}</span></p>
          <h1 className="display" id="not-found-title">{content.title}</h1>
          <p className="lede">{content.description}</p>
          <div className="not-found__actions">
            <a className="button button--bone" href={localeHref("/", locale)}>{content.home}</a>
            <a className="button button--line" href={localeHref("/gallery.html", locale)}>{content.gallery}</a>
          </div>
        </div>
        {artwork && (
          <a
            className="not-found__work"
            href={localeHref(`/gallery.html?art=${encodeURIComponent(artwork.id)}`, locale)}
          >
            <span className="not-found__mat">
              <img
                src={artwork.streamPreview}
                alt=""
                width={artwork.streamPreviewWidth}
                height={artwork.streamPreviewHeight}
                decoding="async"
              />
            </span>
            <span className="not-found__caption">{artwork.name}<small>{artwork.collection}</small></span>
          </a>
        )}
      </section>
    </SiteShell>
  );
}
