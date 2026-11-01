import { CONTACT_EMAIL } from "../../content/site.js";
import "../../styles/editorial.css";

export function LegalDocument({ page, content }) {
  return (
    <div className="legal-page">
      <header className="page-intro legal-intro">
        <p className="kicker">{content.eyebrow}</p>
        <h1 className="display">{content.title}</h1>
        <p className="lede">{content.introduction}</p>
        <time dateTime="2026-07-18">{content.revision}</time>
      </header>
      <div className="legal-layout page-section">
        <nav className="legal-toc" aria-label={content.indexLabel}>
          <p className="kicker">{content.indexLabel}</p>
          <ol>
            {content.sections.map((section, index) => (
              <li key={section.title}>
                <a href={`#${page}-section-${index + 1}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="legal-document">
          {content.sections.map((section, index) => (
            <section key={section.title} aria-labelledby={`${page}-section-${index + 1}`}>
              <h2 className="display" id={`${page}-section-${index + 1}`}>{section.title}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
              {section.note && <aside>{section.note}</aside>}
              {section.email && <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
