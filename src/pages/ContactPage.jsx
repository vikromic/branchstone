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
  const [addressStatus, setAddressStatus] = useState(null);

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

  const copyAddress = async () => {
    try {
      await copyText(CONTACT_EMAIL);
      setAddressStatus("addressCopied");
    } catch {
      setAddressStatus("addressCopyError");
    }
  };

  return (
    <SiteShell page="contact">
      <section className="page-intro contact-intro">
        <p className="kicker">{text.eyebrow}</p>
        <h1 className="display">{text.title}</h1>
        <p className="lede">{text.introduction}</p>
      </section>

      <div className="contact-layout page-section">
        <section className="contact-channels" aria-labelledby="contact-desk-title">
          <p className="kicker">{text.desk}</p>
          <h2 id="contact-desk-title" className="display">{text.deskTitle}</h2>
          <ul className="contact-channels__list" role="list">
            <li>
              <a className="contact-channel" href={`mailto:${CONTACT_EMAIL}`}>
                <span className="contact-channel__label"><EnvelopeSimple aria-hidden="true" />{text.emailLabel}</span>
                <strong>{CONTACT_EMAIL}</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </li>
            <li>
              <a className="contact-channel" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                <span className="contact-channel__label"><InstagramLogo aria-hidden="true" />{text.instagramLabel}</span>
                <strong>@thebranchstone</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </li>
          </ul>
          <button className="button button--line contact-channels__copy" type="button" onClick={copyAddress}>
            <CopySimple aria-hidden="true" />
            {text.copyAddress}
          </button>
          <p className="contact-channels__status" aria-live="polite">{addressStatus ? text[addressStatus] : ""}</p>
          <div className="contact-channels__note">
            <p className="kicker">{text.replyLabel}</p>
            <p>{text.replyText}</p>
          </div>
        </section>

        <section className="contact-letter" aria-labelledby="contact-sheet-title">
          <h2 id="contact-sheet-title" className="display">{text.sheetTitle}</h2>
          <p className="contact-letter__intro">{text.sheetIntroduction}</p>

          {tickets.length > 0 && (
            <section className="contact-works" aria-labelledby="inquiry-register-title">
              <p id="inquiry-register-title" className="kicker">{text.context} ({tickets.length})</p>
              <ul className="contact-works__list" role="list">
                {tickets.map((artwork, index) => (
                  <li className="contact-work" key={artwork.id}>
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
                      <span className="contact-work__placeholder" aria-hidden="true">BS</span>
                    )}
                    <div className="contact-work__text">
                      <p className="contact-work__title">{artwork.name}</p>
                      {artwork.collection && <p className="contact-work__meta">{artwork.collection}</p>}
                    </div>
                    <button
                      className="icon-control"
                      type="button"
                      data-ticket-remove
                      onClick={() => removeTicket(artwork.id, index)}
                      aria-label={`${text.removeWork}: ${artwork.name}`}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="sr-only" aria-live="polite">{text.worksRemaining.replace("{count}", tickets.length)}</p>

          <form ref={formRef} className="correspondence-form" noValidate onSubmit={openEmail}>
            <fieldset disabled={!isHydrated}>
              <p className="correspondence-form__required">{text.required}</p>
              <div className="correspondence-field">
                <label htmlFor="contact-name">{text.fields.name}</label>
                <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength="120" placeholder={text.placeholders.name} value={values.name} onChange={updateField} />
              </div>
              <div className="correspondence-field">
                <label htmlFor="contact-email">{text.fields.email}</label>
                <input id="contact-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength="254" placeholder={text.placeholders.email} value={values.email} onChange={updateField} />
              </div>
              <div className="correspondence-field">
                <label htmlFor="contact-subject">{text.fields.subject}</label>
                <input id="contact-subject" name="subject" type="text" autoComplete="off" required maxLength="180" placeholder={text.placeholders.subject} value={values.subject} onChange={updateField} />
              </div>
              <div className="correspondence-field">
                <label htmlFor="contact-message">{text.fields.message}</label>
                <textarea id="contact-message" name="message" required maxLength="5000" rows="8" placeholder={text.placeholders.message} value={values.message} onChange={updateField} />
              </div>

              <div className="honeypot" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" name="website" type="text" tabIndex="-1" autoComplete="off" value={values.website} onChange={updateField} />
              </div>

              <div className="correspondence-form__actions">
                <button className="button button--bone" type="submit">
                  <EnvelopeSimple aria-hidden="true" />
                  {text.openEmail}
                  <ArrowUpRight aria-hidden="true" />
                </button>
                <button className="button button--line" type="button" onClick={copyLetter}>
                  <CopySimple aria-hidden="true" />
                  {text.copy}
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
        </section>
      </div>

      <section className="contact-faq page-section" aria-labelledby="contact-faq-title">
        <div className="contact-faq__heading">
          <p className="kicker">{text.faqEyebrow}</p>
          <h2 id="contact-faq-title" className="display">{text.faqTitle}</h2>
        </div>
        <div className="contact-faq__body">
          <div className="contact-faq__list">
            {text.faq.map((item) => (
              <details key={item.question}>
                <summary>
                  <span>{item.question}</span>
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
            <a className="button button--line" href={localeHref("/commissions.html", locale)}>{text.commissionLink}<ArrowUpRight aria-hidden="true" /></a>
            <a className="button button--line" href={localeHref("/gallery.html", locale)}>{text.galleryLink}<ArrowUpRight aria-hidden="true" /></a>
          </nav>
        </div>
      </section>
    </SiteShell>
  );
}
