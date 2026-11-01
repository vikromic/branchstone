import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { assetUrl } from "../content/asset-url.js";
import { aboutCopy } from "../content/copy/about.js";
import { getFeedbacks } from "../content/feedbacks.js";
import { localeHref } from "../domain/locale.js";
import "../styles/editorial.css";

function AboutIntro({ content }) {
  return (
    <section className="page-intro about-intro" aria-labelledby="about-title">
      <div className="about-intro__copy">
        <p className="kicker">{content.eyebrow}</p>
        <h1 className="display" id="about-title">{content.title}</h1>
        <p className="lede">{content.introduction}</p>
        <nav className="about-hero__routes" aria-label={content.eyebrow}>
          {content.routes.map(([label, href]) => <a className="button button--line" key={href} href={href}>{label}</a>)}
        </nav>
      </div>
      <figure className="about-intro__portrait">
        <picture>
          <source
            type="image/webp"
            srcSet={`${assetUrl("img/about-me-400w.webp")} 400w, ${assetUrl("img/about-me-800w.webp")} 800w, ${assetUrl("img/about-me.webp")} 1920w`}
            sizes="(min-width: 64rem) 46vw, 100vw"
          />
          <img src={assetUrl("img/about-me.jpeg")} alt={content.portraitAlt} fetchPriority="high" />
        </picture>
        <figcaption>{content.portraitNote.split("\n").map((line) => <span key={line}>{line}</span>)}</figcaption>
      </figure>
    </section>
  );
}

function SectionHeading({ id, label, title, note }) {
  return (
    <header className="practice__heading">
      <p className="kicker">{label}</p>
      <h2 className="display" id={id}>{title}</h2>
      {note && <p>{note}</p>}
    </header>
  );
}

function StatementSection({ content }) {
  return (
    <section id="artist-statement" className="practice" aria-labelledby="statement-title">
      <SectionHeading id="statement-title" label={content.chapters[0]} title={content.statementTitle} />
      <div className="practice__prose practice__prose--statement">
        {content.statement.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}

function BiographySection({ content }) {
  return (
    <section id="biography" className="practice" aria-labelledby="biography-title">
      <SectionHeading id="biography-title" label={content.chapters[1]} title={content.biographyTitle} />
      <div className="practice__body">
        <div className="practice__prose">
          {content.biography.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className="places" aria-label={content.placesLabel}>
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
      </div>
    </section>
  );
}

function MethodSection({ content }) {
  return (
    <section id="method" className="practice" aria-labelledby="process-title">
      <SectionHeading id="process-title" label={content.chapters[2]} title={content.processTitle} note={content.processNote} />
      <div className="practice__body">
        <div className="method__photo" aria-hidden="true">
          <picture>
            <source
              type="image/webp"
              srcSet={`${assetUrl("img/artist_statement-400w.webp")} 400w, ${assetUrl("img/artist_statement.webp")} 640w`}
              sizes="(min-width: 64rem) 36vw, 100vw"
            />
            <img src={assetUrl("img/artist_statement.jpeg")} alt="" loading="lazy" decoding="async" />
          </picture>
        </div>
        <ol className="method__steps">
          {content.process.map(([title, description], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CollectorsSection({ locale, content }) {
  const feedbacks = getFeedbacks(locale);

  return (
    <section className="practice" aria-labelledby="collectors-title">
      <SectionHeading id="collectors-title" label={content.chapters[3]} title={content.collectorsTitle} note={content.collectorsNote} />
      <div className="notes">
        {feedbacks.map((feedback) => (
          <figure key={feedback.name}>
            <blockquote>“{feedback.review}”</blockquote>
            <figcaption>{feedback.name} / {feedback.location}</figcaption>
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
      <div className="about-page">
        <AboutIntro content={content} />
        <StatementSection content={content} />
        <BiographySection content={content} />
        <MethodSection content={content} />
        <CollectorsSection locale={locale} content={content} />
        <section className="invitation" aria-labelledby="about-invitation-title">
          <p className="kicker">{content.chapters[4]}</p>
          <h2 className="display" id="about-invitation-title">{content.invitationTitle}</h2>
          <p className="lede">{content.invitationText}</p>
          <div className="invitation__actions">
            <a className="button button--bone" href={localeHref("/gallery.html", locale)}>{content.gallery}</a>
            <a className="button button--line" href={localeHref("/exhibitions.html", locale)}>{content.exhibitions}</a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
