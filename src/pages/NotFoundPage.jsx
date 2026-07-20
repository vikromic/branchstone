import { SiteShell } from "../app/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import julyPinesStage from "../assets/material-stage/july-pines-stage.webp";
import { localeHref } from "../domain/content.js";
import "../styles/editorial.css";

const copy = {
  en: {
    eyebrow: "Archive / missing layer",
    title: "This layer has weathered away.",
    description: "The address does not lead to a page in the current archive. The work may have moved, or the path may have been carried here incorrectly.",
    home: "Return to the ground",
    gallery: "Enter the works",
    errorLabel: "Error 404",
  },
  uk: {
    eyebrow: "Архів / відсутній шар",
    title: "Цей шар уже вивітрився.",
    description: "Ця адреса не веде до сторінки в поточному архіві. Можливо, матеріал перемістився або шлях було перенесено сюди помилково.",
    home: "Повернутися до ґрунту",
    gallery: "Увійти до робіт",
    errorLabel: "Помилка 404",
  },
};

export function NotFoundPage() {
  const { locale } = useSite();
  const content = copy[locale];

  return (
    <SiteShell page="notFound" footer={false}>
      <section className="not-found-page" aria-labelledby="not-found-title">
        <img className="not-found-page__material" src={julyPinesStage} alt="" aria-hidden="true" />
        <div className="not-found-page__record">
          <p className="kicker">{content.eyebrow}</p>
          <p className="not-found-page__code" aria-label={content.errorLabel}>404</p>
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
