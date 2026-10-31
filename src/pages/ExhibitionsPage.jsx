import bottomStrataAlpha from "../assets/material-stage/bottom-strata-alpha.webp";
import bottomStrataMobile from "../assets/material-stage/bottom-strata-mobile.webp";
import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { assetUrl } from "../content/asset-url.js";
import { exhibitionsCopy } from "../content/copy/exhibitions.js";
import { getHighlights } from "../content/highlights.js";
import { localeHref } from "../domain/locale.js";
import "../styles/editorial.css";

function recordPeriod(records) {
  const years = records
    .map(({ date }) => Number(String(date).match(/\b\d{4}\b/)?.[0]))
    .filter(Number.isFinite);
  if (!years.length) return "—";
  const first = Math.min(...years);
  const last = Math.max(...years);
  return first === last ? String(first) : `${first}—${last}`;
}

function RecordSection({ content, records, title, note, type }) {
  const action = type === "gallery" ? content.openExhibition : content.openPress;
  const typeLabel = type === "gallery" ? content.exhibitionType : content.pressType;

  return (
    <section className={`exhibitions-section editorial-chapter exhibitions-section--${type}`} aria-labelledby={`exhibitions-${type}-title`}>
      <div className="editorial-chapter__heading">
        <p className="chapter-number">{typeLabel}</p>
        <h2 id={`exhibitions-${type}-title`}>{title}</h2>
        <p>{note}</p>
      </div>
      <div className="highlight-ledger">
        {records.map((record, index) => {
          const institution = type === "gallery" ? record.title : record.source;
          return (
            <article className="highlight-entry" key={record.id}>
              <a className="highlight-entry__link" href={record.link} target="_blank" rel="noreferrer">
                <img src={assetUrl(record.image)} alt="" loading="lazy" />
                <div className="highlight-entry__copy">
                  <p className="highlight-entry__meta">
                    {String(index + 1).padStart(2, "0")} / {record.date} / {record.location}
                  </p>
                  <h3>{record.subtitle}</h3>
                  <p className="highlight-entry__institution">{institution}</p>
                  <p>{record.description}</p>
                  <span className="highlight-entry__action">{action}</span>
                </div>
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ExhibitionsPage() {
  const { locale } = useSite();
  const content = exhibitionsCopy[locale];
  const records = getHighlights(locale);
  const exhibitions = records.filter(({ type }) => type === "gallery");
  const press = records.filter(({ type }) => type === "press");
  const period = recordPeriod(records);

  return (
    <SiteShell page="exhibitions">
      <div className="editorial-page exhibitions-page">
        <section className="exhibitions-hero" aria-labelledby="exhibitions-title">
          <div className="exhibitions-hero__copy">
            <p className="kicker">{content.eyebrow}</p>
            <h1 id="exhibitions-title">{content.title}</h1>
            <p>{content.introduction}</p>
          </div>
          <dl className="exhibitions-hero__facts">
            <div><dt>{content.period}</dt><dd>{period}</dd></div>
            <div><dt>{content.entries}</dt><dd>{String(records.length).padStart(2, "0")}</dd></div>
            <div><dt>{content.exhibitions}</dt><dd>{String(exhibitions.length).padStart(2, "0")}</dd></div>
            <div><dt>{content.press}</dt><dd>{String(press.length).padStart(2, "0")}</dd></div>
          </dl>
          <div className="material-separator" aria-hidden="true">
            <picture>
              <source media="(max-width: 759px)" srcSet={bottomStrataMobile} />
              <img src={bottomStrataAlpha} alt="" loading="lazy" fetchPriority="low" decoding="async" />
            </picture>
          </div>
        </section>

        <RecordSection
          content={content}
          records={exhibitions}
          title={content.exhibitions}
          note={content.exhibitionsNote}
          type="gallery"
        />
        <RecordSection
          content={content}
          records={press}
          title={content.press}
          note={content.pressNote}
          type="press"
        />

        <section className="editorial-invitation exhibitions-contact" aria-labelledby="exhibitions-contact-title">
          <p className="kicker">{content.contactEyebrow}</p>
          <h2 id="exhibitions-contact-title">{content.contactTitle}</h2>
          <p>{content.contactText}</p>
          <div className="editorial-invitation__actions">
            <a className="button button--bone" href={localeHref("/contact.html", locale)}>{content.contact}</a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
