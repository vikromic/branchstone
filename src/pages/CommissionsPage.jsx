import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Check, Copy, EnvelopeSimple } from "@phosphor-icons/react";
import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { assetUrl } from "../content/asset-url.js";
import { commissionCopy } from "../content/copy/commission.js";
import { CONTACT_EMAIL } from "../content/site.js";
import {
  LAST_STEP,
  buildCommissionMailto,
  buildCommissionMessage,
  buildCommissionSubject,
  createWizardState,
  draftFieldLimits,
  getDirectionLabel,
  getScaleLabel,
  sanitizeDraft,
  validateContact,
  wizardReducer,
} from "../domain/commission.js";
import { localeHref } from "../domain/locale.js";
import { storageKeys } from "../domain/storage.js";
import { copyText } from "../platform/clipboard.js";
import { readEnvelope, writeEnvelope } from "../platform/local-storage.js";
import commissionMaterial from "../assets/material-stage/commission-soil-hero.webp";
import commissionMaterialMobile from "../assets/material-stage/commission-soil-hero-mobile.webp";
import "../styles/commissions.css";

function persistDraft(state) {
  return writeEnvelope(storageKeys.commissionDraft, { data: state.data, step: state.step });
}

function Field({ id, label, required = false, error, children }) {
  return (
    <div className={`commission-field${error ? " commission-field--error" : ""}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      {children}
      {error && <p className="commission-field__error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

function CommissionWizard({ locale }) {
  const w = commissionCopy[locale].wizard;
  const letterText = commissionCopy[locale].letter;
  const [state, dispatch] = useReducer(wizardReducer, undefined, createWizardState);
  const [draftReady, setDraftReady] = useState(false);
  const [draftUnavailable, setDraftUnavailable] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const fields = useRef({});
  const stepHeading = useRef(null);
  const focusStepAfterNavigation = useRef(false);
  const draftChanged = useRef(false);

  useEffect(() => {
    const saved = sanitizeDraft(readEnvelope(storageKeys.commissionDraft));
    if (saved) dispatch({ type: "RESTORE", payload: saved });
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || !draftChanged.current) return;
    draftChanged.current = false;
    setDraftUnavailable(!persistDraft(state));
  }, [draftReady, state.data, state.step]);

  useEffect(() => {
    if (!draftReady || !focusStepAfterNavigation.current) return;
    focusStepAfterNavigation.current = false;
    stepHeading.current?.focus();
  }, [draftReady, state.step]);

  const message = useMemo(() => buildCommissionMessage(state.data, w, letterText), [state.data, w, letterText]);
  const subject = buildCommissionSubject(state.data, letterText);
  const mailto = buildCommissionMailto(CONTACT_EMAIL, subject, message);

  const register = (name) => (element) => {
    fields.current[name] = element;
  };

  const update = (event) => {
    draftChanged.current = true;
    dispatch({ type: "FIELD", name: event.target.name, value: event.target.value });
  };

  const focusFirstInvalid = (errors) => {
    const first = ["name", "email"].find((key) => errors[key]);
    if (first) requestAnimationFrame(() => fields.current[first]?.focus());
  };

  const next = () => {
    const errors = state.step === 0 ? validateContact(state.data) : {};
    if (!Object.keys(errors).length) {
      focusStepAfterNavigation.current = true;
      draftChanged.current = true;
    }
    dispatch({ type: "NEXT", errors });
    if (Object.keys(errors).length) focusFirstInvalid(errors);
  };

  const submitStep = (event) => {
    event.preventDefault();
    if (state.step < LAST_STEP) next();
  };

  const back = () => {
    focusStepAfterNavigation.current = true;
    draftChanged.current = true;
    dispatch({ type: "BACK" });
  };

  const openEmail = (event) => {
    const errors = validateContact(state.data);
    if (honeypot || Object.keys(errors).length) {
      event.preventDefault();
      dispatch({ type: "ERRORS", errors });
      dispatch({ type: "HANDOFF_STATUS", value: "blocked" });
      focusFirstInvalid(errors);
      return;
    }
    const persisted = persistDraft(state);
    setDraftUnavailable(!persisted);
    dispatch({ type: "HANDOFF_STATUS", value: persisted ? "opened" : "openedNoDraft" });
  };

  const copyMessage = async () => {
    const errors = validateContact(state.data);
    if (honeypot || Object.keys(errors).length) {
      dispatch({ type: "ERRORS", errors });
      dispatch({ type: "HANDOFF_STATUS", value: "blocked" });
      focusFirstInvalid(errors);
      return;
    }
    const persisted = persistDraft(state);
    setDraftUnavailable(!persisted);
    try {
      await copyText(`${CONTACT_EMAIL}\n${subject}\n\n${message}`);
      dispatch({ type: "HANDOFF_STATUS", value: persisted ? "copied" : "copiedNoDraft" });
    } catch {
      dispatch({ type: "HANDOFF_STATUS", value: "copyFailed" });
    }
  };

  const reviewRows = [
    ["name", state.data.name],
    ["email", state.data.email],
    ["scale", getScaleLabel(state.data, w)],
    ["placement", state.data.placement],
    ["dimensions", state.data.dimensions],
    ["budget", state.data.budget],
    ["commissionType", getDirectionLabel(state.data, w)],
    ["colors", state.data.colors],
    ["materials", state.data.materials],
    ["timeline", state.data.timeline],
    ["vision", state.data.vision],
    ["referral", state.data.referral],
  ];

  return (
    <div className="commission-wizard">
      <div className="commission-wizard__intro">
        <p className="kicker">{w.kicker}</p>
        <h2>{w.title}</h2>
        <p>{w.intro}</p>
      </div>

      <div className="commission-wizard__sheet">
        <ol className="commission-progress" aria-label={w.stepsLabel}>
          {w.steps.map((label, index) => (
            <li key={label} className={index < state.step ? "is-complete" : index === state.step ? "is-current" : ""} aria-current={index === state.step ? "step" : undefined} aria-label={label}>
              <span aria-hidden="true">{index < state.step ? <Check weight="bold" /> : String(index + 1).padStart(2, "0")}</span>
              <span className="commission-progress__label">{label}</span>
            </li>
          ))}
        </ol>
        <div className="commission-progress__meter" role="progressbar" aria-label={w.progressLabel} aria-valuemin="1" aria-valuemax="4" aria-valuenow={state.step + 1} aria-valuetext={`${w.steps[state.step]}, ${state.step + 1} / 4`}>
          <i aria-hidden="true" style={{ inlineSize: `${((state.step + 1) / 4) * 100}%` }} />
        </div>

        {state.restored && <p className="commission-draft-notice" role="status">{w.restored}</p>}

        <form className="commission-form" noValidate onSubmit={submitStep}>
          <fieldset className="commission-form__interactive" disabled={!draftReady}>
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="commission-website">Website</label>
            <input id="commission-website" name="website" type="text" tabIndex="-1" autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
          </div>

          {state.step === 0 && (
            <section className="commission-step" aria-labelledby="commission-step-1-title">
              <header>
                <p className="commission-step__number">01 / 04</p>
                <h3 id="commission-step-1-title" ref={stepHeading} tabIndex="-1">{w.stepOne.title}</h3>
                <p>{w.stepOne.intro}</p>
              </header>
              <div className="commission-form__two-up">
                <Field id="commission-name" label={w.stepOne.name} required error={state.errors.name ? w.errors[state.errors.name] : null}>
                  <input ref={register("name")} id="commission-name" name="name" type="text" autoComplete="name" maxLength={draftFieldLimits.name} value={state.data.name} onChange={update} aria-invalid={Boolean(state.errors.name)} aria-describedby={state.errors.name ? "commission-name-error" : undefined} required />
                </Field>
                <Field id="commission-email" label={w.stepOne.email} required error={state.errors.email ? w.errors[state.errors.email] : null}>
                  <input ref={register("email")} id="commission-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={draftFieldLimits.email} value={state.data.email} onChange={update} aria-invalid={Boolean(state.errors.email)} aria-describedby={state.errors.email ? "commission-email-error" : undefined} required />
                </Field>
              </div>
              <p className="commission-required-note">* {w.required}</p>
            </section>
          )}

          {state.step === 1 && (
            <section className="commission-step" aria-labelledby="commission-step-2-title">
              <header>
                <p className="commission-step__number">02 / 04</p>
                <h3 id="commission-step-2-title" ref={stepHeading} tabIndex="-1">{w.stepTwo.title}</h3>
                <p>{w.stepTwo.intro}</p>
              </header>
              <fieldset className="commission-radio-fieldset">
                <legend>{w.stepTwo.scale}</legend>
                <div className="commission-radio-ledger">
                  {w.stepTwo.scaleOptions.map(([value, label, description], index) => (
                    <label key={value} className={state.data.scale === value ? "is-selected" : ""}>
                      <input type="radio" name="scale" value={value} checked={state.data.scale === value} onChange={update} />
                      <span className="commission-radio-ledger__number">{String(index + 1).padStart(2, "0")}</span>
                      <span><strong>{label}</strong><small>{description}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="commission-form__two-up">
                <Field id="commission-placement" label={w.stepTwo.placement}>
                  <input id="commission-placement" name="placement" type="text" maxLength={draftFieldLimits.placement} placeholder={w.stepTwo.placementPlaceholder} value={state.data.placement} onChange={update} />
                </Field>
                <Field id="commission-dimensions" label={w.stepTwo.dimensions}>
                  <input id="commission-dimensions" name="dimensions" type="text" maxLength={draftFieldLimits.dimensions} placeholder={w.stepTwo.dimensionsPlaceholder} value={state.data.dimensions} onChange={update} />
                </Field>
              </div>
              <Field id="commission-budget" label={w.stepTwo.budget}>
                <input id="commission-budget" name="budget" type="text" maxLength={draftFieldLimits.budget} placeholder={w.stepTwo.budgetPlaceholder} value={state.data.budget} onChange={update} />
              </Field>
            </section>
          )}

          {state.step === 2 && (
            <section className="commission-step" aria-labelledby="commission-step-3-title">
              <header>
                <p className="commission-step__number">03 / 04</p>
                <h3 id="commission-step-3-title" ref={stepHeading} tabIndex="-1">{w.stepThree.title}</h3>
                <p>{w.stepThree.intro}</p>
              </header>
              <Field id="commission-type" label={w.stepThree.type}>
                <select id="commission-type" name="commissionType" value={state.data.commissionType} onChange={update}>
                  {w.stepThree.typeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </Field>
              <div className="commission-form__two-up">
                <Field id="commission-colors" label={w.stepThree.colors}>
                  <input id="commission-colors" name="colors" type="text" maxLength={draftFieldLimits.colors} placeholder={w.stepThree.colorsPlaceholder} value={state.data.colors} onChange={update} />
                </Field>
                <Field id="commission-materials" label={w.stepThree.materials}>
                  <input id="commission-materials" name="materials" type="text" maxLength={draftFieldLimits.materials} placeholder={w.stepThree.materialsPlaceholder} value={state.data.materials} onChange={update} />
                </Field>
              </div>
              <Field id="commission-timeline" label={w.stepThree.timeline}>
                <input id="commission-timeline" name="timeline" type="text" maxLength={draftFieldLimits.timeline} placeholder={w.stepThree.timelinePlaceholder} value={state.data.timeline} onChange={update} />
              </Field>
              <Field id="commission-vision" label={w.stepThree.vision}>
                <textarea id="commission-vision" name="vision" rows="6" maxLength={draftFieldLimits.vision} placeholder={w.stepThree.visionPlaceholder} value={state.data.vision} onChange={update} />
              </Field>
              <Field id="commission-referral" label={w.stepThree.referral}>
                <input id="commission-referral" name="referral" type="text" maxLength={draftFieldLimits.referral} placeholder={w.stepThree.referralPlaceholder} value={state.data.referral} onChange={update} />
              </Field>
            </section>
          )}

          {state.step === 3 && (
            <section className="commission-step commission-step--review" aria-labelledby="commission-step-4-title">
              <header>
                <p className="commission-step__number">04 / 04</p>
                <h3 id="commission-step-4-title" ref={stepHeading} tabIndex="-1">{w.review.title}</h3>
                <p>{w.review.intro}</p>
              </header>
              <dl className="commission-review">
                {reviewRows.map(([key, value]) => (
                  <div key={key}>
                    <dt>{w.review.labels[key]}</dt>
                    <dd>{value?.trim?.() || w.review.empty}</dd>
                  </div>
                ))}
              </dl>
              <div className="commission-handoff">
                <EnvelopeSimple aria-hidden="true" />
                <div><h4>{w.review.handoffTitle}</h4><p>{draftUnavailable ? w.review.handoffBodyNoDraft : w.review.handoffBody}</p></div>
              </div>
              <div className="commission-handoff__actions">
                <a className="button button--bone" href={mailto} onClick={openEmail}>
                  {w.review.open}<ArrowRight aria-hidden="true" />
                </a>
                <button className="button button--line" type="button" onClick={copyMessage}>
                  <Copy aria-hidden="true" />{w.review.copy}
                </button>
              </div>
              {state.handoffStatus && <p className="commission-handoff__status" role="status" aria-live="polite">{w.review[state.handoffStatus]}</p>}
            </section>
          )}

          <div className="commission-form__navigation">
            {state.step > 0 ? (
              <button className="button button--line" type="button" onClick={back}>
                <ArrowLeft aria-hidden="true" />{w.back}
              </button>
            ) : <span />}
            {state.step < LAST_STEP && (
              <button className="button button--bone" type="submit">
                {w.next}<ArrowRight aria-hidden="true" />
              </button>
            )}
          </div>
          </fieldset>
          <noscript>
            <p className="commission-form__noscript">
              {w.noScript} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.{" "}
              <a href={localeHref("/contact.html", locale)}>{w.noScriptContact}</a>
            </p>
          </noscript>
        </form>

        <p className={`commission-wizard__privacy${draftUnavailable ? " commission-wizard__privacy--warning" : ""}`} role={draftUnavailable ? "alert" : undefined}>
          {draftUnavailable ? w.privacyUnavailable : w.privacy}
        </p>
      </div>
    </div>
  );
}

function ScaleStudy({ content }) {
  return (
    <section className="commission-scale section-shell" aria-labelledby="commission-scale-title">
      <div className="commission-section-heading">
        <p className="kicker">{content.kicker}</p>
        <h2 id="commission-scale-title">{content.title}</h2>
        <p>{content.intro}</p>
      </div>
      <ol className="commission-scale__studies">
        {content.options.map(([title, description], index) => (
          <li key={title}>
            <p className="commission-scale__number">0{index + 1}</p>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="commission-scale__price-note">{content.price}</p>
    </section>
  );
}

function ArtisticProcess({ content }) {
  return (
    <section className="commission-process section-shell" aria-labelledby="commission-process-title">
      <div className="commission-section-heading">
        <p className="kicker">{content.kicker}</p>
        <h2 id="commission-process-title">{content.title}</h2>
      </div>
      <div className="commission-process__material" aria-hidden="true">
        <picture>
          <source
            type="image/webp"
            srcSet={`${assetUrl("img/art1-400w.webp")} 400w, ${assetUrl("img/art1-800w.webp")} 800w, ${assetUrl("img/art1.webp")} 1222w`}
            sizes="(min-width: 72rem) 25rem, (min-width: 52rem) 38vw, 100vw"
          />
          <img src={assetUrl("img/art1.jpeg")} alt="" loading="lazy" decoding="async" />
        </picture>
      </div>
      <ol className="commission-process__ledger">
        {content.steps.map(([title, description], index) => (
          <li key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CommissionFaq({ content }) {
  return (
    <section className="commission-faq section-shell" aria-labelledby="commission-faq-title">
      <div className="commission-section-heading">
        <p className="kicker">{content.kicker}</p>
        <h2 id="commission-faq-title">{content.title}</h2>
      </div>
      <div className="commission-faq__list">
        {content.items.map(([question, answer], index) => (
          <details key={question}>
            <summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i aria-hidden="true" /></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CommissionsPage() {
  const { locale } = useSite();
  const content = commissionCopy[locale];

  return (
    <SiteShell page="commissions">
      <article className="commission-page">
        <header className="commission-hero">
          <div className="commission-hero__content">
            <p className="kicker">{content.hero.kicker}</p>
            <h1>{content.hero.titleLead} <em>{content.hero.titleEmphasis}</em></h1>
            <p className="commission-hero__intro">{content.hero.intro}</p>
            <a className="commission-hero__jump" href="#commission-request">{content.hero.cta}<ArrowDown aria-hidden="true" /></a>
          </div>
          <div className="commission-hero__material" aria-hidden="true">
            <picture>
              <source media="(max-width: 759px)" srcSet={commissionMaterialMobile} />
              <img src={commissionMaterial} alt="" fetchPriority="high" />
            </picture>
            <p>{content.hero.mark}</p>
          </div>
          <p className="commission-hero__note">{content.hero.note}</p>
        </header>

        <ScaleStudy content={content.scale} />
        <ArtisticProcess content={content.process} />

        <section id="commission-request" className="commission-request section-shell" aria-label={content.wizard.title}>
          <CommissionWizard locale={locale} />
        </section>

        <CommissionFaq content={content.faq} />
      </article>
    </SiteShell>
  );
}
