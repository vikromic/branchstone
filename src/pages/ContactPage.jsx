import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, CopySimple, EnvelopeSimple, InstagramLogo, Minus, Plus, X } from "@phosphor-icons/react";
import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { contactCopy } from "../content/copy/contact.js";
import { CONTACT_EMAIL, INSTAGRAM_URL } from "../content/site.js";
import { normalizeArtworkId } from "../domain/catalog.js";
import { buildContactLetter, removeGeneratedSentence } from "../domain/contact-letter.js";
import { resolveInquiryEntry } from "../domain/inquiry.js";
import { localeHref } from "../domain/locale.js";
import { storageKeys } from "../domain/storage.js";
import { copyText } from "../platform/clipboard.js";
import { readEnvelope, safeRemove } from "../platform/local-storage.js";
import memorySeam from "../assets/material-stage/memory-seam-alpha.webp";
import memorySeamMobile from "../assets/material-stage/memory-seam-mobile.webp";
import "../styles/contact.css";

const statusToneByKey = Object.freeze({
  invalid: "invalid",
  handoffStarted: "handoff",
  copied: "copied",
  copyError: "copy-error",
});

function findFirstInvalid(form) {
  return [...form.elements].find((control) => control.willValidate && !control.checkValidity());
}

export function ContactPage() {
  const { locale, catalog } = useSite();
  const text = contactCopy[locale];
  const formRef = useRef(null);
  const bootFallbackRef = useRef(null);
  const generatedInquiryRef = useRef(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [ticketRefs, setTicketRefs] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fallback = bootFallbackRef.current;
    fallback?.setAttribute("role", "status");
    fallback?.removeAttribute("aria-live");
    fallback?.removeAttribute("aria-atomic");
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const prefillText = contactCopy[locale];
    const urlMessagePresent = url.searchParams.has("message");

    if (urlMessagePresent) {
      const message = url.searchParams.get("message") ?? "";
      const artworks = url.searchParams.getAll("art")
        .map((id) => catalog.find((item) => item.id === normalizeArtworkId(id)))
        .filter(Boolean);
      if (artworks.length) {
        const references = artworks.map((artwork) => ({ id: artwork.id, fallbackTitle: artwork.name }));
        setTicketRefs(references);
        generatedInquiryRef.current = {
          message,
          ids: new Set(references.map(({ id }) => id)),
        };
      }
      setValues((current) => ({
        ...current,
        subject: artworks.length ? prefillText.artworkSubject : current.subject,
        message,
      }));
      url.searchParams.delete("message");
      url.searchParams.delete("art");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      return;
    }

    const pending = readEnvelope(storageKeys.pendingInquiry);
    if (!pending || !Array.isArray(pending.artworks) || !pending.artworks.length) return;
    const resolved = pending.artworks.map((entry) => resolveInquiryEntry(entry, catalog)).filter(Boolean);
    safeRemove(storageKeys.pendingInquiry);
    if (!resolved.length) return;
    setTicketRefs(resolved);
    generatedInquiryRef.current = {
      message: prefillText.pendingMessage,
      ids: new Set(resolved.map(({ id }) => id)),
    };
    setValues((current) => ({
      ...current,
      subject: prefillText.artworkSubject,
      message: prefillText.pendingMessage,
    }));
  }, []); // Consume navigation state exactly once; later locale changes must not replay it.

  const tickets = useMemo(
    () => ticketRefs.map((reference) => {
      const artwork = catalog.find((item) => item.id === reference.id);
      return artwork ?? {
        id: reference.id,
        name: reference.fallbackTitle,
        mainImage: reference.fallbackImage,
        collection: reference.fallbackCollection,
      };
    }),
    [catalog, ticketRefs],
  );

  const updateField = (event) => {
    const { name, value } = event.target;
    event.target.setCustomValidity("");
    setValues((current) => ({ ...current, [name]: value }));
    if (status === "invalid") setStatus(null);
  };

  useEffect(() => {
    if (status !== "invalid" || !formRef.current) return;
    for (const name of ["name", "subject", "message"]) {
      const control = formRef.current.elements.namedItem(name);
      control.setCustomValidity(control.value.trim() ? "" : text.emptyField);
    }
  }, [status, text.emptyField]);

  const validate = () => {
    for (const name of ["name", "subject", "message"]) {
      const control = formRef.current.elements.namedItem(name);
      control.setCustomValidity(control.value.trim() ? "" : text.emptyField);
    }
    const firstInvalid = findFirstInvalid(formRef.current);
    if (!firstInvalid) return true;
    setStatus("invalid");
    firstInvalid.focus();
    firstInvalid.reportValidity();
    return false;
  };

  const prepareLetter = () => buildContactLetter(values, tickets, text, CONTACT_EMAIL);

  const openEmail = (event) => {
    event.preventDefault();
    if (values.website) return;
    if (!validate()) return;
    const letter = prepareLetter();
    setStatus("handoffStarted");
    window.location.href = letter.mailto;
  };

  const copyLetter = async () => {
    if (!validate()) return;
    try {
      await copyText(prepareLetter().plain);
      setStatus("copied");
    } catch {
      setStatus("copyError");
    }
  };

  const removeTicket = (id, index) => {
    const generatedInquiry = generatedInquiryRef.current;
    if (generatedInquiry?.ids.has(id)) {
      generatedInquiry.ids.delete(id);
    }
    if (generatedInquiry && generatedInquiry.ids.size === 0) {
      setValues((current) => ({
        ...current,
        message: removeGeneratedSentence(current.message, generatedInquiry.message),
      }));
      generatedInquiryRef.current = null;
    }
    setTicketRefs((current) => current.filter((item) => item.id !== id));
    requestAnimationFrame(() => {
      const removeButtons = [...document.querySelectorAll("[data-ticket-remove]")];
      const nextButton = removeButtons[Math.min(index, removeButtons.length - 1)];
      (nextButton ?? formRef.current?.elements.namedItem("name"))?.focus();
    });
  };

  return (
    <SiteShell page="contact">
      <div className="contact-correspondence">
        <header className="contact-hero">
          <picture className="contact-hero__material-picture" aria-hidden="true">
            <source media="(max-width: 759px)" srcSet={memorySeamMobile} />
            <img
              className="contact-hero__material"
              src={memorySeam}
              alt=""
              loading="lazy"
              fetchPriority="low"
              decoding="async"
            />
          </picture>
          <div className="contact-hero__grain" aria-hidden="true"><span>BR / ST</span><span>VI / 24</span></div>
          <div className="contact-hero__copy">
            <p className="kicker">{text.eyebrow}</p>
            <h1>{text.title}</h1>
            <p>{text.introduction}</p>
          </div>
          <p className="contact-hero__marker" aria-hidden="true">{text.marker}</p>
        </header>

        <section className="contact-sheet-section" aria-labelledby="contact-sheet-title">
          <div className="contact-sheet">
            <div className="contact-sheet__header">
              <p className="kicker">{text.marker}</p>
              <span aria-hidden="true">BS—C01</span>
            </div>
            <div className="contact-sheet__intro">
              <h2 id="contact-sheet-title">{text.sheetTitle}</h2>
              <p>{text.sheetIntroduction}</p>
            </div>

            {tickets.length > 0 && (
              <section className="inquiry-register" aria-labelledby="inquiry-register-title">
                <p id="inquiry-register-title" className="inquiry-register__title">{text.context} / {String(tickets.length).padStart(2, "0")}</p>
                <div className="inquiry-register__items">
                  {tickets.map((artwork, index) => (
                    <article className="inquiry-ticket" key={artwork.id}>
                      <span className="inquiry-ticket__number">{String(index + 1).padStart(2, "0")}</span>
                      {artwork.mainImage ? (
                        <img
                          src={artwork.streamPreview ?? artwork.mainImage}
                          alt=""
                          width={artwork.streamPreviewWidth}
                          height={artwork.streamPreviewHeight}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="inquiry-ticket__placeholder" aria-hidden="true">BS</span>
                      )}
                      <div>
                        <h3>{artwork.name}</h3>
                        {artwork.collection && <p>{artwork.collection}</p>}
                      </div>
                      <button
                        type="button"
                        data-ticket-remove
                        onClick={() => removeTicket(artwork.id, index)}
                        aria-label={`${text.removeWork}: ${artwork.name}`}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
            <p className="sr-only" aria-live="polite">{text.worksRemaining.replace("{count}", tickets.length)}</p>

            <form ref={formRef} className="correspondence-form" noValidate onSubmit={openEmail}>
              <fieldset disabled={!isHydrated}>
              <p className="correspondence-form__required">{text.required}</p>
              <div className="correspondence-field">
                <label htmlFor="contact-name"><span aria-hidden="true">01 — </span>{text.fields.name}</label>
                <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength="120" placeholder={text.placeholders.name} value={values.name} onChange={updateField} />
              </div>
              <div className="correspondence-field">
                <label htmlFor="contact-email"><span aria-hidden="true">02 — </span>{text.fields.email}</label>
                <input id="contact-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength="254" placeholder={text.placeholders.email} value={values.email} onChange={updateField} />
              </div>
              <div className="correspondence-field">
                <label htmlFor="contact-subject"><span aria-hidden="true">03 — </span>{text.fields.subject}</label>
                <input id="contact-subject" name="subject" type="text" autoComplete="off" required maxLength="180" placeholder={text.placeholders.subject} value={values.subject} onChange={updateField} />
              </div>
              <div className="correspondence-field correspondence-field--message">
                <label htmlFor="contact-message"><span aria-hidden="true">04 — </span>{text.fields.message}</label>
                <textarea id="contact-message" name="message" required maxLength="5000" rows="8" placeholder={text.placeholders.message} value={values.message} onChange={updateField} />
              </div>

              <div className="honeypot" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" name="website" type="text" tabIndex="-1" autoComplete="off" value={values.website} onChange={updateField} />
              </div>

              <div className="correspondence-form__actions">
                <button className="contact-action contact-action--primary" type="submit">
                  <EnvelopeSimple aria-hidden="true" />
                  <span>{text.openEmail}</span>
                  <ArrowUpRight aria-hidden="true" />
                </button>
                <button className="contact-action contact-action--copy" type="button" onClick={copyLetter}>
                  <CopySimple aria-hidden="true" />
                  <span>{text.copy}</span>
                </button>
              </div>
              <p className="correspondence-form__handoff">{text.handoff}</p>
              <p className={`contact-form-status${status ? ` contact-form-status--${statusToneByKey[status]}` : ""}`} aria-live="polite">
                {status ? text[status] : ""}
              </p>
              </fieldset>
              <p
                ref={bootFallbackRef}
                className="correspondence-form__boot-fallback"
                data-contact-boot-fallback=""
                role="status"
                suppressHydrationWarning
              >
                {text.bootFallback} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </p>
              <noscript><p className="correspondence-form__noscript">{text.noScript} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p></noscript>
            </form>
          </div>
        </section>

        <section className="contact-desk" aria-labelledby="contact-desk-title">
          <div className="contact-desk__heading">
            <p className="kicker">{text.desk}</p>
            <h2 id="contact-desk-title">{text.deskTitle}</h2>
          </div>
          <div className="contact-ledger">
            <a className="contact-ledger__row" href={`mailto:${CONTACT_EMAIL}`}>
              <span><EnvelopeSimple aria-hidden="true" />{text.emailLabel}</span>
              <strong>{CONTACT_EMAIL}</strong>
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="contact-ledger__row" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <span><InstagramLogo aria-hidden="true" />{text.instagramLabel}</span>
              <strong>@thebranchstone</strong>
              <ArrowUpRight aria-hidden="true" />
            </a>
            <div className="contact-ledger__row contact-ledger__row--static">
              <span>{text.replyLabel}</span>
              <p>{text.replyText}</p>
              <span aria-hidden="true">—</span>
            </div>
          </div>
        </section>

        <section className="contact-faq" aria-labelledby="contact-faq-title">
          <div className="contact-faq__heading">
            <p className="kicker">{text.faqEyebrow}</p>
            <h2 id="contact-faq-title">{text.faqTitle}</h2>
          </div>
          <div className="contact-faq__list">
            {text.faq.map((item, index) => (
              <details key={item.question}>
                <summary>
                  <span className="contact-faq__number">{String(index + 1).padStart(2, "0")}</span>
                  {item.question}
                  <span className="contact-faq__toggle" aria-hidden="true">
                    <Plus className="contact-faq__plus" />
                    <Minus className="contact-faq__minus" />
                  </span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
          <nav className="contact-faq__routes" aria-label={text.relatedPages}>
            <a href={localeHref("/commissions.html", locale)}>{text.commissionLink}<ArrowUpRight aria-hidden="true" /></a>
            <a href={localeHref("/gallery.html", locale)}>{text.galleryLink}<ArrowUpRight aria-hidden="true" /></a>
          </nav>
        </section>
      </div>
    </SiteShell>
  );
}
