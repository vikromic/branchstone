import { CONTACT_EMAIL } from "../../content/site.js";
import "../../styles/editorial.css";

export function LegalDocument({ page, content }) {
  return (
    <div className="editorial-page legal-page">
      <header className="legal-hero">
        <p className="kicker">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.introduction}</p>
        <time dateTime="2026-07-18">{content.revision}</time>
      </header>
      <article className="legal-document">
        <div className="legal-document__index" aria-hidden="true">
          <span>BRANCHSTONE</span>
          <span>{String(content.sections.length).padStart(2, "0")} {content.indexLabel}</span>
        </div>
        <div className="legal-document__sections">
          {content.sections.map((section, index) => (
            <section key={section.title} aria-labelledby={`${page}-section-${index + 1}`}>
              <p className="legal-section__number">{String(index + 1).padStart(2, "0")}</p>
              <div>
                <h2 id={`${page}-section-${index + 1}`}>{section.title}</h2>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                {section.note && <aside>{section.note}</aside>}
                {section.email && <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
