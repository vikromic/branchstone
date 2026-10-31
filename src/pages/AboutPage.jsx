import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { assetUrl } from "../content/asset-url.js";
import { aboutCopy } from "../content/copy/about.js";
import { getFeedbacks } from "../content/feedbacks.js";
import { localeHref } from "../domain/locale.js";
import bottomStrataAlpha from "../assets/material-stage/bottom-strata-alpha.webp";
import bottomStrataMobile from "../assets/material-stage/bottom-strata-mobile.webp";
import "../styles/editorial.css";

function AboutHero({ content }) {
  return (
    <section className="about-hero" aria-labelledby="about-title">
      <div className="about-hero__image">
        <picture>
          <source
            type="image/webp"
            srcSet={`${assetUrl("img/about-me-400w.webp")} 400w, ${assetUrl("img/about-me-800w.webp")} 800w, ${assetUrl("img/about-me.webp")} 1920w`}
            sizes="100vw"
          />
          <img src={assetUrl("img/about-me.jpeg")} alt={content.portraitAlt} fetchPriority="high" />
        </picture>
        <p className="about-hero__caption">{content.portraitNote.split("\n").map((line) => <span key={line}>{line}</span>)}</p>
      </div>
      <div className="about-hero__copy">
        <p className="kicker">{content.eyebrow}</p>
        <h1 id="about-title">{content.title}</h1>
        <p className="about-hero__introduction">{content.introduction}</p>
        <nav className="about-hero__routes" aria-label={content.eyebrow}>
          {content.routes.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
      </div>
      <div className="material-separator" aria-hidden="true">
        <picture>
          <source media="(max-width: 759px)" srcSet={bottomStrataMobile} />
          <img src={bottomStrataAlpha} alt="" loading="lazy" fetchPriority="low" decoding="async" />
        </picture>
      </div>
    </section>
  );
}

function StatementChapter({ content }) {
  return (
    <section id="artist-statement" className="about-statement editorial-chapter" aria-labelledby="statement-title">
      <div className="editorial-chapter__heading">
        <p className="chapter-number">{content.chapters[0]}</p>
        <h2 id="statement-title">{content.statementTitle}</h2>
      </div>
      <div className="about-statement__body">
        {content.statement.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}

function BiographyChapter({ content }) {
  return (
    <section id="biography" className="about-biography editorial-chapter" aria-labelledby="biography-title">
      <div className="editorial-chapter__heading">
        <p className="chapter-number">{content.chapters[1]}</p>
        <h2 id="biography-title">{content.biographyTitle}</h2>
      </div>
      <div className="about-biography__body">
        {content.biography.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="places-ledger" aria-label={content.placesLabel}>
        <p className="kicker">{content.placesLabel}</p>
        <ol>
          {content.places.map(([number, place, note]) => (
            <li key={number}>
              <span>{number}</span>
              <div><h3>{place}</h3><p>{note}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProcessChapter({ content }) {
  return (
    <section id="method" className="about-process editorial-chapter" aria-labelledby="process-title">
      <div className="editorial-chapter__heading">
        <p className="chapter-number">{content.chapters[2]}</p>
        <h2 id="process-title">{content.processTitle}</h2>
        <p>{content.processNote}</p>
      </div>
      <div className="about-process__material" aria-hidden="true">
        <picture>
          <source
            type="image/webp"
            srcSet={`${assetUrl("img/artist_statement-400w.webp")} 400w, ${assetUrl("img/artist_statement.webp")} 640w`}
            sizes="(min-width: 68rem) 25rem, (min-width: 48rem) 42vw, 100vw"
          />
          <img src={assetUrl("img/artist_statement.jpeg")} alt="" loading="lazy" decoding="async" />
        </picture>
      </div>
      <ol className="process-ledger">
        {content.process.map(([title, description], index) => (
          <li key={title}>
            <span className="process-ledger__number">{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CollectorsChapter({ locale, content }) {
  const feedbacks = getFeedbacks(locale);

  return (
    <section className="about-collectors editorial-chapter" aria-labelledby="collectors-title">
      <div className="editorial-chapter__heading">
        <p className="chapter-number">{content.chapters[3]}</p>
        <h2 id="collectors-title">{content.collectorsTitle}</h2>
        <p>{content.collectorsNote}</p>
      </div>
      <div className="collector-notes">
        {feedbacks.map((feedback, index) => (
          <figure key={feedback.name}>
            <blockquote>“{feedback.review}”</blockquote>
            <figcaption><span>{String(index + 1).padStart(2, "0")}</span>{feedback.name} / {feedback.location}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function AboutPage() {
  const { locale } = useSite();
  const content = aboutCopy[locale];

  return (
    <SiteShell page="about">
      <div className="editorial-page about-page">
        <AboutHero content={content} />
        <StatementChapter content={content} />
        <BiographyChapter content={content} />
        <ProcessChapter content={content} />
        <CollectorsChapter locale={locale} content={content} />
        <section className="editorial-invitation" aria-labelledby="about-invitation-title">
          <p className="kicker">{content.chapters[4]}</p>
          <h2 id="about-invitation-title">{content.invitationTitle}</h2>
          <p>{content.invitationText}</p>
          <div className="editorial-invitation__actions">
            <a className="button button--bone" href={localeHref("/gallery.html", locale)}>{content.gallery}</a>
            <a className="button button--line" href={localeHref("/exhibitions.html", locale)}>{content.exhibitions}</a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
