import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Check, Copy, EnvelopeSimple } from "@phosphor-icons/react";
import { SiteShell } from "../app/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { copyText } from "../domain/clipboard.js";
import { CONTACT_EMAIL, localeHref } from "../domain/content.js";
import { readEnvelope, storageKeys, writeEnvelope } from "../domain/storage.js";
import commissionMaterial from "../assets/material-stage/top-strata.webp";
import "../styles/commissions.css";

const DRAFT_TTL = 24 * 60 * 60 * 1000;
const LAST_STEP = 3;

const emptyData = Object.freeze({
  name: "",
  email: "",
  commissionType: "open",
  scale: "intimate",
  placement: "",
  dimensions: "",
  budget: "",
  colors: "",
  materials: "",
  timeline: "",
  vision: "",
  referral: "",
});

const text = {
  en: {
    hero: {
      kicker: "COMMISSION / A SHARED ACT OF LISTENING",
      titleLead: "A work made for",
      titleEmphasis: "the place it will inhabit.",
      intro: "A commission begins with your space, a memory, or a feeling that has no finished shape yet. Viktoria translates that starting point through bark, stone, pigment, fiber, and patient handwork.",
      cta: "Begin the request",
      note: "Each work is one of one. Scope, materials, timing, and price are discussed together before any work begins.",
      mark: "FORM / MATTER / MEMORY",
    },
    scale: {
      kicker: "01 / SCALE STUDY",
      title: "Not tiers. Three ways a work can hold a room.",
      intro: "These outlines are conversation starters, not fixed products. Proportion can be adjusted to the architecture and the material language of the work.",
      options: [
        ["Intimate", "A close encounter for a shelf, desk, or quiet wall."],
        ["Room anchor", "A work with enough presence to organize a living space."],
        ["Architectural", "A large or multipart gesture shaped around a particular site."],
      ],
      price: "Final scope and price are discussed after the first exchange; no payment is taken through this website.",
    },
    process: {
      kicker: "02 / HOW THE WORK TAKES FORM",
      title: "The artistic process",
      steps: [
        ["Listen", "We exchange references, dimensions, and the story the work needs to carry."],
        ["Gather", "Viktoria studies the site and selects a material direction for the piece."],
        ["Propose", "You receive a considered concept, scope, timing, and price to review."],
        ["Make", "The work develops by hand, with agreed moments for progress correspondence."],
        ["Release", "Finishing, documentation, packing, and delivery are coordinated for the completed work."],
      ],
    },
    wizard: {
      kicker: "03 / REQUEST LEDGER",
      title: "Give the first idea a place to land.",
      intro: "This four-part note helps Viktoria understand the beginning of the project. Nothing here commits you to a commission.",
      privacy: "Your draft stays only in this browser for 24 hours. The final link opens your own email app; you review and send the message yourself.",
      privacyUnavailable: "This browser blocked local draft storage. You can continue, but this request will not be restored after you leave or reload the page.",
      steps: ["Correspondence", "Scale", "Direction", "Review"],
      restored: "Your draft from this browser has been restored.",
      stepOne: {
        title: "Where can the conversation continue?",
        intro: "Only your name and email are required. They are placed into an email draft when you choose the final action.",
        name: "Your name",
        email: "Email address",
      },
      stepTwo: {
        title: "How should the work meet the space?",
        intro: "Choose a starting scale. It can change after the site and materials are understood.",
        scale: "Starting scale",
        scaleOptions: [
          ["intimate", "Intimate", "Close, quiet, held nearby"],
          ["anchor", "Room anchor", "A central presence in the room"],
          ["architectural", "Architectural", "Large, site-led, or multipart"],
          ["unsure", "Not sure yet", "Viktoria can help find the proportion"],
        ],
        placement: "Where might it live?",
        placementPlaceholder: "For example: a north-facing entry wall",
        dimensions: "Known dimensions or constraints",
        dimensionsPlaceholder: "Wall width, maximum depth, or leave open",
        budget: "Budget context, if useful",
        budgetPlaceholder: "Optional — share a range in your preferred currency",
      },
      stepThree: {
        title: "What should the material carry?",
        intro: "Fragments are welcome. A color, a landscape, or one sentence can be enough.",
        type: "Direction",
        typeOptions: [
          ["open", "Open to the artist"],
          ["abstract", "Abstract movement"],
          ["nature", "Nature-led"],
          ["mixed-media", "Mixed material"],
        ],
        colors: "Color atmosphere",
        colorsPlaceholder: "Mineral blue, scorched umber, pale stone…",
        materials: "Materials to welcome or avoid",
        materialsPlaceholder: "Optional sensitivities or preferences",
        timeline: "Timing context",
        timelinePlaceholder: "A meaningful date, or no fixed timing",
        vision: "Memory, place, or intention",
        visionPlaceholder: "What would you like the work to hold?",
        referral: "How did you find Branchstone?",
        referralPlaceholder: "Optional",
      },
      review: {
        title: "Read the note before it leaves your hands.",
        intro: "You can go back and change anything. The email remains yours to review and send.",
        labels: {
          name: "Name",
          email: "Email",
          scale: "Starting scale",
          placement: "Placement",
          dimensions: "Dimensions",
          budget: "Budget context",
          commissionType: "Direction",
          colors: "Color atmosphere",
          materials: "Materials",
          timeline: "Timing",
          vision: "Intention",
          referral: "Found Branchstone",
        },
        empty: "Open for discussion",
        handoffTitle: "This does not submit a form.",
        handoffBody: `The button opens a prepared message addressed to ${CONTACT_EMAIL} in your email app. Review it there, then send it yourself. Your 24-hour draft remains in this browser.`,
        handoffBodyNoDraft: `The button opens a prepared message addressed to ${CONTACT_EMAIL} in your email app. Review it there, then send it yourself. This browser has blocked local draft storage.`,
        open: "Open email draft",
        copy: "Copy message instead",
        copied: `Message copied. Paste it into an email addressed to ${CONTACT_EMAIL}.`,
        copiedNoDraft: `Message copied. Paste it into an email addressed to ${CONTACT_EMAIL}. This browser did not save a local draft.`,
        copyFailed: `Copy was not available. Select the review text above, or write directly to ${CONTACT_EMAIL}.`,
        opened: "The email handoff was opened. Your request has not been sent by this website, and your draft remains available here.",
        openedNoDraft: "The email handoff was opened. Your request has not been sent by this website, and this browser did not save a local draft.",
        blocked: "The request could not be prepared. Please check the required fields.",
      },
      required: "Required",
      errors: {
        name: "Please add your name.",
        email: "Please add your email address.",
        emailInvalid: "Enter an email address in a valid format.",
      },
      back: "Back",
      next: "Continue",
      noScript: "This four-step request needs JavaScript. Write directly to",
      noScriptContact: "Or open the correspondence page.",
    },
    faq: {
      kicker: "04 / BEFORE WE BEGIN",
      title: "A few useful answers",
      items: [
        ["When is the price decided?", "After Viktoria understands the desired scale, materials, location, and complexity, you receive a clear scope and price to consider before the work begins."],
        ["Do I need a complete concept?", "No. Commissions can begin with a room, a memory, a palette, or simply a wish to live with a work made for a particular place."],
        ["Can I follow the work in progress?", "The proposal identifies the moments when progress can be shared and where your feedback is most useful without interrupting the material process."],
        ["Can delivery be arranged outside the United States?", "Location is discussed at the proposal stage so packing, customs, insurance, and delivery can be considered as part of the real scope."],
      ],
    },
  },
  uk: {
    hero: {
      kicker: "ЗАМОВЛЕННЯ / СПІЛЬНИЙ АКТ СЛУХАННЯ",
      titleLead: "Робота, створена для",
      titleEmphasis: "місця, де вона житиме.",
      intro: "Замовлення починається з вашого простору, спогаду чи відчуття, яке ще не має завершеної форми. Вікторія перекладає цю точку початку мовою кори, каменю, пігменту, волокна та повільної ручної роботи.",
      cta: "Почати запит",
      note: "Кожна робота існує в одному екземплярі. Обсяг, матеріали, терміни й вартість обговорюються разом до початку роботи.",
      mark: "ФОРМА / МАТЕРІЯ / ПАМ’ЯТЬ",
    },
    scale: {
      kicker: "01 / ДОСЛІДЖЕННЯ МАСШТАБУ",
      title: "Не тарифи. Три способи, якими робота може тримати простір.",
      intro: "Ці контури — початок розмови, а не фіксовані продукти. Пропорції узгоджуються з архітектурою та матеріальною мовою роботи.",
      options: [
        ["Камерна", "Близька зустріч для полиці, столу або тихої стіни."],
        ["Центр простору", "Робота з достатньою присутністю, щоб організувати кімнату."],
        ["Архітектурна", "Великий або модульний жест, сформований навколо конкретного місця."],
      ],
      price: "Остаточний обсяг і вартість обговорюються після першого листування; сайт не приймає оплату.",
    },
    process: {
      kicker: "02 / ЯК РОБОТА НАБУВАЄ ФОРМИ",
      title: "Мистецький процес",
      steps: [
        ["Почути", "Ми обмінюємося референсами, розмірами та історією, яку має нести робота."],
        ["Зібрати", "Вікторія вивчає місце та добирає матеріальний напрям для твору."],
        ["Запропонувати", "Ви отримуєте продуману концепцію, обсяг, терміни та вартість для розгляду."],
        ["Створити", "Робота формується вручну, з узгодженими моментами для листів про поступ."],
        ["Відпустити", "Фініш, документація, пакування й доставка координуються для завершеного твору."],
      ],
    },
    wizard: {
      kicker: "03 / РЕЄСТР ЗАПИТУ",
      title: "Дайте першій ідеї місце, де вона може осісти.",
      intro: "Ця записка з чотирьох частин допоможе Вікторії зрозуміти початок проєкту. Вона ні до чого вас не зобов’язує.",
      privacy: "Чернетка зберігається лише в цьому браузері протягом 24 годин. Фінальне посилання відкриє вашу поштову програму; ви самі переглянете й надішлете лист.",
      privacyUnavailable: "Браузер заблокував локальне збереження чернетки. Можна продовжити, але після виходу або перезавантаження цей запит не відновиться.",
      steps: ["Листування", "Масштаб", "Напрям", "Перевірка"],
      restored: "Чернетку з цього браузера відновлено.",
      stepOne: {
        title: "Де продовжити розмову?",
        intro: "Обов’язкові лише ім’я та email. Вони потраплять у чернетку листа після вашої фінальної дії.",
        name: "Ваше ім’я",
        email: "Email",
      },
      stepTwo: {
        title: "Як робота має зустрітися з простором?",
        intro: "Оберіть початковий масштаб. Він може змінитися після того, як ми зрозуміємо місце й матеріали.",
        scale: "Початковий масштаб",
        scaleOptions: [
          ["intimate", "Камерна", "Близька, тиха, поруч із вами"],
          ["anchor", "Центр простору", "Головна присутність у кімнаті"],
          ["architectural", "Архітектурна", "Велика, прив’язана до місця або модульна"],
          ["unsure", "Ще не знаю", "Вікторія допоможе знайти пропорцію"],
        ],
        placement: "Де вона могла б жити?",
        placementPlaceholder: "Наприклад: північна стіна у передпокої",
        dimensions: "Відомі розміри чи обмеження",
        dimensionsPlaceholder: "Ширина стіни, гранична глибина або залиште відкритим",
        budget: "Бюджетний контекст, якщо доречно",
        budgetPlaceholder: "Необов’язково — діапазон у зручній валюті",
      },
      stepThree: {
        title: "Що має нести матеріал?",
        intro: "Фрагментів достатньо. Колір, краєвид або одне речення вже можуть стати початком.",
        type: "Напрям",
        typeOptions: [
          ["open", "Довіряю художниці"],
          ["abstract", "Абстрактний рух"],
          ["nature", "Природний мотив"],
          ["mixed-media", "Поєднання матеріалів"],
        ],
        colors: "Колірна атмосфера",
        colorsPlaceholder: "Мінеральний синій, випалена умбра, світлий камінь…",
        materials: "Матеріали, яких прагнете або уникаєте",
        materialsPlaceholder: "Необов’язкові чутливості чи побажання",
        timeline: "Часовий контекст",
        timelinePlaceholder: "Важлива дата або без фіксованого терміну",
        vision: "Спогад, місце або намір",
        visionPlaceholder: "Що ви хотіли б довірити цій роботі?",
        referral: "Як ви знайшли Branchstone?",
        referralPlaceholder: "Необов’язково",
      },
      review: {
        title: "Прочитайте записку, перш ніж вона полишить ваші руки.",
        intro: "Можна повернутися й змінити будь-що. Лист залишається вашим — ви самі його переглядаєте й надсилаєте.",
        labels: {
          name: "Ім’я",
          email: "Email",
          scale: "Початковий масштаб",
          placement: "Розміщення",
          dimensions: "Розміри",
          budget: "Бюджетний контекст",
          commissionType: "Напрям",
          colors: "Колірна атмосфера",
          materials: "Матеріали",
          timeline: "Терміни",
          vision: "Намір",
          referral: "Знайшли Branchstone",
        },
        empty: "Відкрито до обговорення",
        handoffTitle: "Це не надсилання форми.",
        handoffBody: `Кнопка відкриє підготовлений лист на адресу ${CONTACT_EMAIL} у вашій поштовій програмі. Перегляньте його там і надішліть самостійно. Чернетка залишиться в цьому браузері на 24 години.`,
        handoffBodyNoDraft: `Кнопка відкриє підготовлений лист на адресу ${CONTACT_EMAIL} у вашій поштовій програмі. Перегляньте його там і надішліть самостійно. Браузер заблокував локальне збереження чернетки.`,
        open: "Відкрити чернетку листа",
        copy: "Скопіювати текст",
        copied: `Текст скопійовано. Вставте його в лист на адресу ${CONTACT_EMAIL}.`,
        copiedNoDraft: `Текст скопійовано. Вставте його в лист на адресу ${CONTACT_EMAIL}. Браузер не зберіг локальну чернетку.`,
        copyFailed: `Копіювання недоступне. Виділіть текст перевірки вище або напишіть на ${CONTACT_EMAIL}.`,
        opened: "Поштову чернетку відкрито. Цей сайт не надсилав ваш запит, а локальна чернетка залишається доступною.",
        openedNoDraft: "Поштову чернетку відкрито. Цей сайт не надсилав ваш запит, а браузер не зберіг локальну чернетку.",
        blocked: "Не вдалося підготувати запит. Перевірте обов’язкові поля.",
      },
      required: "Обов’язково",
      errors: {
        name: "Додайте, будь ласка, ваше ім’я.",
        email: "Додайте, будь ласка, email.",
        emailInvalid: "Введіть email у правильному форматі.",
      },
      back: "Назад",
      next: "Далі",
      noScript: "Для цього запиту з чотирьох кроків потрібен JavaScript. Напишіть безпосередньо на",
      noScriptContact: "Або відкрийте сторінку листування.",
    },
    faq: {
      kicker: "04 / ПЕРЕД ПОЧАТКОМ",
      title: "Кілька корисних відповідей",
      items: [
        ["Коли визначається вартість?", "Коли Вікторія розуміє бажаний масштаб, матеріали, місце та складність, ви отримуєте чіткий обсяг і вартість для розгляду до початку роботи."],
        ["Чи потрібна мені готова концепція?", "Ні. Замовлення може початися з кімнати, спогаду, палітри або простого бажання жити з роботою, створеною для конкретного місця."],
        ["Чи бачитиму я процес?", "У пропозиції ми визначимо моменти, коли можна поділитися поступом і коли ваш відгук буде найкориснішим, не перериваючи матеріальний процес."],
        ["Чи можлива доставка за межі США?", "Місце доставки обговорюється на етапі пропозиції, щоб пакування, митні вимоги, страхування й перевезення стали частиною реального обсягу."],
      ],
    },
  },
};

function sanitizeDraft(saved) {
  if (!saved || typeof saved !== "object" || !saved.data || typeof saved.data !== "object") return null;
  const legacy = saved.data;
  const aliases = {
    name: legacy.name,
    email: legacy.email,
    commissionType: legacy.commissionType ?? legacy["commission-type"],
    scale: legacy.scale ?? legacy.size,
    placement: legacy.placement,
    dimensions: legacy.dimensions,
    budget: legacy.budget,
    colors: legacy.colors,
    materials: legacy.materials,
    timeline: legacy.timeline,
    vision: legacy.vision ?? legacy.theme,
    referral: legacy.referral,
  };
  const data = { ...emptyData };
  Object.entries(aliases).forEach(([key, value]) => {
    if (typeof value === "string") data[key] = value.slice(0, key === "vision" ? 1200 : 300);
  });
  data.commissionType = ({ custom: "open" })[data.commissionType] ?? data.commissionType;
  if (!["open", "abstract", "nature", "mixed-media"].includes(data.commissionType)) data.commissionType = emptyData.commissionType;
  data.scale = ({ small: "intimate", medium: "anchor", large: "architectural", custom: "unsure", "": "intimate" })[data.scale] ?? data.scale;
  if (!["intimate", "anchor", "architectural", "unsure"].includes(data.scale)) data.scale = emptyData.scale;
  const rawStep = Number(saved.step);
  const step = Number.isInteger(rawStep) ? Math.min(LAST_STEP, Math.max(0, rawStep)) : 0;
  return { data, step };
}

function persistDraft(state) {
  return writeEnvelope(storageKeys.commissionDraft, { data: state.data, step: state.step });
}

function wizardReducer(state, action) {
  switch (action.type) {
    case "RESTORE":
      return { ...state, data: action.payload.data, step: action.payload.step, restored: true };
    case "FIELD":
      return {
        ...state,
        data: { ...state.data, [action.name]: action.value },
        errors: { ...state.errors, [action.name]: undefined },
        handoffStatus: "",
      };
    case "NEXT":
      if (Object.keys(action.errors).length) return { ...state, errors: action.errors };
      return { ...state, step: Math.min(LAST_STEP, state.step + 1), errors: {}, handoffStatus: "" };
    case "BACK":
      return { ...state, step: Math.max(0, state.step - 1), errors: {}, handoffStatus: "" };
    case "ERRORS":
      return { ...state, errors: action.errors };
    case "HANDOFF_STATUS":
      return { ...state, handoffStatus: action.value };
    default:
      return state;
  }
}

function validateContact(data, locale) {
  const errors = {};
  const messages = text[locale].wizard.errors;
  if (!data.name.trim()) errors.name = messages.name;
  if (!data.email.trim()) errors.email = messages.email;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = messages.emailInvalid;
  return errors;
}

function getDirectionLabel(data, wizardText) {
  return wizardText.stepThree.typeOptions.find(([value]) => value === data.commissionType)?.[1] ?? data.commissionType;
}

function getScaleLabel(data, wizardText) {
  return wizardText.stepTwo.scaleOptions.find(([value]) => value === data.scale)?.[1] ?? data.scale;
}

function buildMessage(data, wizardText, locale) {
  const lines = [
    locale === "uk" ? "Вітаю, Вікторіє," : "Hello Viktoria,",
    "",
    locale === "uk" ? "Хочу почати розмову про індивідуальну роботу." : "I would like to begin a conversation about a commissioned work.",
    "",
    `${wizardText.review.labels.name}: ${data.name.trim()}`,
    `${wizardText.review.labels.email}: ${data.email.trim()}`,
    `${wizardText.review.labels.scale}: ${getScaleLabel(data, wizardText)}`,
    `${wizardText.review.labels.placement}: ${data.placement.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.dimensions}: ${data.dimensions.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.budget}: ${data.budget.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.commissionType}: ${getDirectionLabel(data, wizardText)}`,
    `${wizardText.review.labels.colors}: ${data.colors.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.materials}: ${data.materials.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.timeline}: ${data.timeline.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.vision}: ${data.vision.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.referral}: ${data.referral.trim() || wizardText.review.empty}`,
    "",
    locale === "uk" ? "Дякую." : "Thank you.",
  ];
  return lines.join("\n");
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
  const w = text[locale].wizard;
  const [state, dispatch] = useReducer(wizardReducer, {
    data: { ...emptyData },
    step: 0,
    errors: {},
    restored: false,
    handoffStatus: "",
  });
  const [draftReady, setDraftReady] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [draftUnavailable, setDraftUnavailable] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const fields = useRef({});
  const stepHeading = useRef(null);
  const focusStepAfterNavigation = useRef(false);
  const draftChanged = useRef(false);

  useEffect(() => {
    const saved = sanitizeDraft(readEnvelope(storageKeys.commissionDraft, DRAFT_TTL));
    if (saved) dispatch({ type: "RESTORE", payload: saved });
    setDraftReady(true);
    setIsHydrated(true);
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

  const message = useMemo(() => buildMessage(state.data, w, locale), [state.data, w, locale]);
  const subject = locale === "uk"
    ? `Запит на індивідуальну роботу — ${state.data.name.trim() || "Branchstone"}`
    : `Commission conversation — ${state.data.name.trim() || "Branchstone"}`;
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

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
    const errors = state.step === 0 ? validateContact(state.data, locale) : {};
    if (!Object.keys(errors).length) {
      focusStepAfterNavigation.current = true;
      draftChanged.current = true;
    }
    dispatch({ type: "NEXT", errors });
    if (Object.keys(errors).length) focusFirstInvalid(errors);
  };

  const back = () => {
    focusStepAfterNavigation.current = true;
    draftChanged.current = true;
    dispatch({ type: "BACK" });
  };

  const openEmail = (event) => {
    const errors = validateContact(state.data, locale);
    if (honeypot || Object.keys(errors).length) {
      event.preventDefault();
      dispatch({ type: "ERRORS", errors });
      dispatch({ type: "HANDOFF_STATUS", value: w.review.blocked });
      focusFirstInvalid(errors);
      return;
    }
    const persisted = persistDraft(state);
    setDraftUnavailable(!persisted);
    dispatch({ type: "HANDOFF_STATUS", value: persisted ? w.review.opened : w.review.openedNoDraft });
  };

  const copyMessage = async () => {
    const errors = validateContact(state.data, locale);
    if (honeypot || Object.keys(errors).length) {
      dispatch({ type: "ERRORS", errors });
      dispatch({ type: "HANDOFF_STATUS", value: w.review.blocked });
      focusFirstInvalid(errors);
      return;
    }
    const persisted = persistDraft(state);
    setDraftUnavailable(!persisted);
    try {
      await copyText(`${CONTACT_EMAIL}\n${subject}\n\n${message}`);
      dispatch({ type: "HANDOFF_STATUS", value: persisted ? w.review.copied : w.review.copiedNoDraft });
    } catch {
      dispatch({ type: "HANDOFF_STATUS", value: w.review.copyFailed });
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
        <ol className="commission-progress" aria-label={locale === "uk" ? "Етапи запиту" : "Request steps"}>
          {w.steps.map((label, index) => (
            <li key={label} className={index < state.step ? "is-complete" : index === state.step ? "is-current" : ""} aria-current={index === state.step ? "step" : undefined}>
              <span aria-hidden="true">{index < state.step ? <Check weight="bold" /> : String(index + 1).padStart(2, "0")}</span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
        <div className="commission-progress__meter" role="progressbar" aria-valuemin="1" aria-valuemax="4" aria-valuenow={state.step + 1} aria-valuetext={`${w.steps[state.step]}, ${state.step + 1} / 4`}>
          <i style={{ inlineSize: `${((state.step + 1) / 4) * 100}%` }} />
        </div>

        {state.restored && <p className="commission-draft-notice" role="status">{w.restored}</p>}

        <form className="commission-form" noValidate onSubmit={(event) => event.preventDefault()}>
          <fieldset className="commission-form__interactive" disabled={!isHydrated}>
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
                <Field id="commission-name" label={w.stepOne.name} required error={state.errors.name}>
                  <input ref={register("name")} id="commission-name" name="name" type="text" autoComplete="name" value={state.data.name} onChange={update} aria-invalid={Boolean(state.errors.name)} aria-describedby={state.errors.name ? "commission-name-error" : undefined} required />
                </Field>
                <Field id="commission-email" label={w.stepOne.email} required error={state.errors.email}>
                  <input ref={register("email")} id="commission-email" name="email" type="email" inputMode="email" autoComplete="email" value={state.data.email} onChange={update} aria-invalid={Boolean(state.errors.email)} aria-describedby={state.errors.email ? "commission-email-error" : undefined} required />
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
                  <input id="commission-placement" name="placement" type="text" maxLength="300" placeholder={w.stepTwo.placementPlaceholder} value={state.data.placement} onChange={update} />
                </Field>
                <Field id="commission-dimensions" label={w.stepTwo.dimensions}>
                  <input id="commission-dimensions" name="dimensions" type="text" maxLength="300" placeholder={w.stepTwo.dimensionsPlaceholder} value={state.data.dimensions} onChange={update} />
                </Field>
              </div>
              <Field id="commission-budget" label={w.stepTwo.budget}>
                <input id="commission-budget" name="budget" type="text" maxLength="300" placeholder={w.stepTwo.budgetPlaceholder} value={state.data.budget} onChange={update} />
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
                  <input id="commission-colors" name="colors" type="text" maxLength="300" placeholder={w.stepThree.colorsPlaceholder} value={state.data.colors} onChange={update} />
                </Field>
                <Field id="commission-materials" label={w.stepThree.materials}>
                  <input id="commission-materials" name="materials" type="text" maxLength="300" placeholder={w.stepThree.materialsPlaceholder} value={state.data.materials} onChange={update} />
                </Field>
              </div>
              <Field id="commission-timeline" label={w.stepThree.timeline}>
                <input id="commission-timeline" name="timeline" type="text" maxLength="300" placeholder={w.stepThree.timelinePlaceholder} value={state.data.timeline} onChange={update} />
              </Field>
              <Field id="commission-vision" label={w.stepThree.vision}>
                <textarea id="commission-vision" name="vision" rows="6" maxLength="1200" placeholder={w.stepThree.visionPlaceholder} value={state.data.vision} onChange={update} />
              </Field>
              <Field id="commission-referral" label={w.stepThree.referral}>
                <input id="commission-referral" name="referral" type="text" maxLength="300" placeholder={w.stepThree.referralPlaceholder} value={state.data.referral} onChange={update} />
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
              {state.handoffStatus && <p className="commission-handoff__status" role="status" aria-live="polite">{state.handoffStatus}</p>}
            </section>
          )}

          <div className="commission-form__navigation">
            {state.step > 0 ? (
              <button className="button button--line" type="button" onClick={back}>
                <ArrowLeft aria-hidden="true" />{w.back}
              </button>
            ) : <span />}
            {state.step < LAST_STEP && (
              <button className="button button--bone" type="button" onClick={next}>
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
            <div className={`commission-scale__outline commission-scale__outline--${index + 1}`} aria-hidden="true"><i /></div>
            <div>
              <p className="commission-scale__number">0{index + 1}</p>
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
  const content = text[locale];

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
            <img src={commissionMaterial} alt="" />
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
