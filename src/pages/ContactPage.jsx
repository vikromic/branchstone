import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, CopySimple, EnvelopeSimple, InstagramLogo, Minus, Plus, X } from "@phosphor-icons/react";
import { SiteShell } from "../app/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { normalizeArtworkId } from "../domain/catalog.js";
import { copyText } from "../domain/clipboard.js";
import { CONTACT_EMAIL, INSTAGRAM_URL, localeHref } from "../domain/content.js";
import { readEnvelope, safeRemove, storageKeys } from "../domain/storage.js";
import memorySeam from "../assets/material-stage/memory-seam-alpha.webp";
import "../styles/contact.css";

const contactCopy = {
  en: {
    eyebrow: "CORRESPONDENCE / OPEN CHANNEL",
    title: "Begin with a note.",
    introduction:
      "Ask about a work, a commission, or the practice behind Branchstone. Your words remain in this form until you choose how to carry them into your own email app.",
    marker: "STUDIO LETTER / 01",
    sheetTitle: "Write to the studio",
    sheetIntroduction:
      "This form does not send or store your message. It prepares a complete email addressed directly to Viktoria.",
    required: "All four fields are required.",
    fields: {
      name: "Your name",
      email: "Your email",
      subject: "Subject",
      message: "Message",
    },
    placeholders: {
      name: "Name",
      email: "you@example.com",
      subject: "Artwork inquiry",
      message: "Tell me what drew you here…",
    },
    openEmail: "Open in my email app",
    copy: "Copy message",
    handoff:
      "Choosing “Open” asks your device to launch its email app. Nothing has been submitted by this website.",
    handoffStarted:
      "Your device was asked to open its email app. Review and send the message there; this website has not submitted it.",
    copied: "The addressed message has been copied. Paste it into any email app when you are ready.",
    copyError: "Copying was blocked by the browser. Select and copy the message field, or email the studio directly.",
    invalid: "Complete the first highlighted field before continuing.",
    emptyField: "This field cannot contain only spaces.",
    context: "WORKS CARRIED INTO THIS NOTE",
    removeWork: "Remove from this inquiry",
    worksRemaining: "Works remaining in this inquiry: {count}.",
    noScript: "JavaScript is needed to prepare the addressed letter without exposing its contents in the page URL. You can still email the studio directly.",
    pendingMessage: "I’m interested in these saved works and would like to know more about them.",
    artworkSubject: "Artwork inquiry",
    desk: "DIRECT CHANNELS",
    deskTitle: "Studio correspondence",
    emailLabel: "Email",
    instagramLabel: "Studio notes",
    replyLabel: "Replies",
    replyText: "Replies are written personally as studio time allows.",
    faqEyebrow: "BEFORE YOU WRITE / FIELD NOTES",
    faqTitle: "A few useful answers",
    faq: [
      {
        question: "Can I ask whether a work is still available?",
        answer:
          "Yes. Mention the title of the work and the studio will confirm its current status directly before any purchase is discussed.",
      },
      {
        question: "How do commissioned works begin?",
        answer:
          "Start with the commission guide or write with the feeling, scale, and setting you have in mind. Scope, timing, and any payment terms are agreed in writing before work begins.",
      },
      {
        question: "What happens with shipping or returns?",
        answer:
          "Destination, packing, delivery options, and the applicable purchase terms are confirmed with you in writing before a work is purchased.",
      },
      {
        question: "Can I write in Ukrainian?",
        answer: "Of course. Correspondence is welcome in Ukrainian or English.",
      },
    ],
    commissionLink: "Read the commission guide",
    galleryLink: "Return to the works",
    senderName: "Sender name",
    senderEmail: "Sender email",
    selectedWorks: "Works included",
    messageLabel: "Message",
    preparedBy: "Prepared on branchstone.art — not sent by the website.",
  },
  uk: {
    eyebrow: "ЛИСТУВАННЯ / ВІДКРИТИЙ КАНАЛ",
    title: "Почніть із нотатки.",
    introduction:
      "Запитайте про роботу, індивідуальне замовлення або практику Branchstone. Ваші слова залишаються у цій формі, доки ви самі не перенесете їх у свою поштову програму.",
    marker: "ЛИСТ ДО СТУДІЇ / 01",
    sheetTitle: "Написати до студії",
    sheetIntroduction:
      "Ця форма не надсилає і не зберігає повідомлення. Вона готує повний лист, адресований безпосередньо Вікторії.",
    required: "Усі чотири поля обов’язкові.",
    fields: {
      name: "Ваше ім’я",
      email: "Ваша електронна пошта",
      subject: "Тема",
      message: "Повідомлення",
    },
    placeholders: {
      name: "Ім’я",
      email: "you@example.com",
      subject: "Запит про роботу",
      message: "Розкажіть, що привело вас сюди…",
    },
    openEmail: "Відкрити у моїй пошті",
    copy: "Скопіювати лист",
    handoff:
      "Кнопка «Відкрити» попросить ваш пристрій запустити поштову програму. Цей сайт нічого не надсилає.",
    handoffStarted:
      "Ваш пристрій отримав запит відкрити поштову програму. Перевірте й надішліть лист там; сайт його не надсилав.",
    copied: "Адресований лист скопійовано. Вставте його у будь-яку поштову програму, коли будете готові.",
    copyError: "Браузер заблокував копіювання. Виділіть текст повідомлення вручну або напишіть студії напряму.",
    invalid: "Заповніть перше виділене поле, перш ніж продовжити.",
    emptyField: "Поле не може містити лише пробіли.",
    context: "РОБОТИ, ДОДАНІ ДО ЦЬОГО ЛИСТА",
    removeWork: "Прибрати із запиту",
    worksRemaining: "Робіт у цьому запиті: {count}.",
    noScript: "JavaScript потрібен, щоб підготувати адресований лист без показу його вмісту в URL сторінки. Ви все одно можете написати студії напряму.",
    pendingMessage: "Мене цікавлять ці збережені роботи, і я хотів би дізнатися про них більше.",
    artworkSubject: "Запит про роботу",
    desk: "ПРЯМІ КАНАЛИ",
    deskTitle: "Листування зі студією",
    emailLabel: "Електронна пошта",
    instagramLabel: "Нотатки студії",
    replyLabel: "Відповіді",
    replyText: "Вікторія відповідає особисто, коли це дозволяє робота у студії.",
    faqEyebrow: "ПЕРЕД ЛИСТОМ / ПОЛЬОВІ НОТАТКИ",
    faqTitle: "Кілька корисних відповідей",
    faq: [
      {
        question: "Чи можна запитати, чи доступна певна робота?",
        answer:
          "Так. Вкажіть назву роботи, і студія безпосередньо підтвердить її актуальний статус до обговорення покупки.",
      },
      {
        question: "Як починається робота над індивідуальним замовленням?",
        answer:
          "Почніть із гайду або опишіть відчуття, масштаб і простір, які маєте на увазі. Обсяг, терміни й умови оплати узгоджуються письмово до початку роботи.",
      },
      {
        question: "Як відбувається доставка або повернення?",
        answer:
          "Напрямок, пакування, варіанти доставки й відповідні умови придбання письмово узгоджуються з вами до покупки роботи.",
      },
      {
        question: "Чи можна написати англійською?",
        answer: "Звісно. Листування можливе українською або англійською.",
      },
    ],
    commissionLink: "Прочитати гайд із замовлення",
    galleryLink: "Повернутися до робіт",
    senderName: "Ім’я відправника",
    senderEmail: "Пошта відправника",
    selectedWorks: "Додані роботи",
    messageLabel: "Повідомлення",
    preparedBy: "Підготовлено на branchstone.art — не надіслано сайтом.",
  },
};

const statusToneByKey = Object.freeze({
  invalid: "invalid",
  handoffStarted: "handoff",
  copied: "copied",
  copyError: "copy-error",
});

function resolveInquiryEntry(entry, catalog) {
  if (!entry || typeof entry !== "object") return null;
  const id = normalizeArtworkId(entry.id);
  const title = String(entry.name || entry.title || "").trim();
  const artwork =
    catalog.find((item) => item.id === id) ??
    catalog.find((item) => title && item.name.toLocaleLowerCase() === title.toLocaleLowerCase());

  if (artwork) return { id: artwork.id, fallbackTitle: title };
  if (!title) return null;
  return {
    id: `unresolved-${title}`,
    fallbackTitle: title,
    fallbackImage: typeof entry.image === "string" ? entry.image : "",
    fallbackCollection: typeof entry.collection === "string" ? entry.collection : "",
  };
}

function buildLetter(values, tickets, text) {
  const subject = `[Branchstone] ${values.subject.trim()}`;
  const workLines = tickets.length
    ? ["", `${text.selectedWorks}:`, ...tickets.map((artwork) => `— ${artwork.name}${artwork.collection ? ` / ${artwork.collection}` : ""}`)]
    : [];
  const body = [
    `${text.senderName}: ${values.name.trim()}`,
    `${text.senderEmail}: ${values.email.trim()}`,
    ...workLines,
    "",
    `${text.messageLabel}:`,
    values.message.trim(),
    "",
    text.preparedBy,
  ].join("\n");

  return {
    mailto: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    plain: `To: ${CONTACT_EMAIL}\nSubject: ${subject}\n\n${body}`,
  };
}

function removeGeneratedSentence(value, sentence) {
  if (!sentence) return value;
  const sentenceStart = value.indexOf(sentence);
  if (sentenceStart < 0) return value;

  const before = value.slice(0, sentenceStart);
  const after = value.slice(sentenceStart + sentence.length);
  if (!before.trim()) return after.replace(/^\s+/, "");
  if (!after.trim()) return before.replace(/\s+$/, "");

  const separatedByLineBreak = /\r?\n\s*$/.test(before) || /^\s*\r?\n/.test(after);
  return separatedByLineBreak
    ? `${before.replace(/\s+$/, "")}\n\n${after.replace(/^\s+/, "")}`
    : `${before.replace(/[\t ]+$/, "")} ${after.replace(/^[\t ]+/, "")}`;
}

function findFirstInvalid(form) {
  return [...form.elements].find((control) => control.willValidate && !control.checkValidity());
}

export function ContactPage() {
  const { locale, catalog } = useSite();
  const text = contactCopy[locale];
  const formRef = useRef(null);
  const generatedInquiryRef = useRef(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [ticketRefs, setTicketRefs] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => setIsHydrated(true), []);

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

  const prepareLetter = () => buildLetter(values, tickets, text);

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
          <img className="contact-hero__material" src={memorySeam} alt="" aria-hidden="true" />
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
                        <img src={artwork.mainImage} alt="" loading="lazy" decoding="async" />
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
                <label htmlFor="contact-name">01 — {text.fields.name}</label>
                <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength="120" placeholder={text.placeholders.name} value={values.name} onChange={updateField} />
              </div>
              <div className="correspondence-field">
                <label htmlFor="contact-email">02 — {text.fields.email}</label>
                <input id="contact-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength="254" placeholder={text.placeholders.email} value={values.email} onChange={updateField} />
              </div>
              <div className="correspondence-field">
                <label htmlFor="contact-subject">03 — {text.fields.subject}</label>
                <input id="contact-subject" name="subject" type="text" autoComplete="off" required maxLength="180" placeholder={text.placeholders.subject} value={values.subject} onChange={updateField} />
              </div>
              <div className="correspondence-field correspondence-field--message">
                <label htmlFor="contact-message">04 — {text.fields.message}</label>
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
          <nav className="contact-faq__routes" aria-label={locale === "uk" ? "Пов’язані сторінки" : "Related pages"}>
            <a href={localeHref("/commissions.html", locale)}>{text.commissionLink}<ArrowUpRight aria-hidden="true" /></a>
            <a href={localeHref("/gallery.html", locale)}>{text.galleryLink}<ArrowUpRight aria-hidden="true" /></a>
          </nav>
        </section>
      </div>
    </SiteShell>
  );
}
