import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import julyPinesStage from "../assets/material-stage/july-pines-stage.webp";
import { notFoundCopy } from "../content/copy/not-found.js";
import { localeHref } from "../domain/locale.js";
import "../styles/editorial.css";

export function NotFoundPage() {
  const { locale } = useSite();
  const content = notFoundCopy[locale];

  return (
    <SiteShell page="notFound" footer={false}>
      <section className="not-found-page" aria-labelledby="not-found-title">
        <img className="not-found-page__material" src={julyPinesStage} alt="" aria-hidden="true" />
        <div className="not-found-page__record">
          <p className="kicker">{content.eyebrow}</p>
          <p className="not-found-page__code"><span aria-hidden="true">404</span><span className="sr-only">{content.errorLabel}</span></p>
          <h1 id="not-found-title">{content.title}</h1>
          <p className="not-found-page__description">{content.description}</p>
          <div className="not-found-page__actions">
            <a className="button button--bone" href={localeHref("/", locale)}>{content.home}</a>
            <a className="button button--line" href={localeHref("/gallery.html", locale)}>{content.gallery}</a>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
