import feedbackSource from "../../docs/json_data/feedbacks.json";
import { SiteShell } from "../app/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { assetUrl } from "../domain/catalog.js";
import { localeHref } from "../domain/content.js";
import bottomStrataAlpha from "../assets/material-stage/bottom-strata-alpha.webp";
import bottomStrataMobile from "../assets/material-stage/bottom-strata-mobile.webp";
import "../styles/editorial.css";

const pageCopy = {
  en: {
    eyebrow: "Practice / living material archive",
    title: "Working with nature, memory, and time through texture.",
    introduction: "My name is Viktoria. I create under the name Branchstone. My work sits between painting and nature.",
    routes: [["Statement", "#artist-statement"], ["Biography", "#biography"], ["Method", "#method"]],
    chapters: ["01 / Statement", "02 / Biography", "03 / Method", "04 / Elsewhere", "05 / Continue"],
    portraitAlt: "Viktoria, the artist behind Branchstone, sitting in warm evening light",
    portraitNote: "Viktoria / Branchstone\nNorthern California",
    statementTitle: "Artist statement",
    statement: [
      "I create textured, abstract pieces using bark, branches, stones, and other natural materials. These elements are not decoration. They enter the process as collaborators, shaping the work as much as my hands do.",
      "My process is slow and intuitive. I work through layering, patience, and attention, letting every piece develop in its own rhythm. No two works are the same. Each holds its own balance of fragility, weight, and history.",
      "Every material I use has already lived a life. I extend that life into another form—one that makes room for stillness, reflection, and grounding. Branchstone is about staying rooted while evolving; resilience that does not harden; quiet stories finding a surface.",
    ],
    biographyTitle: "Biography",
    biography: [
      "I grew up on the Donbas lands, surrounded by wide steppes, the scent of wild tarragon, and red rock terricones rising from the ground. That landscape taught me to notice texture, contrast, and silence long before art became a conscious practice.",
      "Later, Texas offered another material language: sun-bleached wood, dry grasses, and cracked soil. Now, in Northern California, I continue the dialogue with redwoods, coastal bark, and mosses. Each place leaves a mark on how I see, remember, and make.",
    ],
    placesLabel: "Places carried forward",
    places: [
      ["01", "Donbas, Ukraine", "Where texture and contrast first entered memory."],
      ["02", "Texas, USA", "Years of dry light, open horizon, and weathered wood."],
      ["03", "Northern California, USA", "Where coastal matter enters the work now."],
    ],
    processTitle: "The creative process",
    processNote: "Slow work. Natural rhythm. Materials as coauthors.",
    process: [
      ["Gathering", "Fallen branches, weathered bark, stone, and moss are gathered with care—only what the landscape has already released."],
      ["Listening", "In the studio, each material is studied for shape, tension, texture, and the history already held at its surface."],
      ["Layering", "Paint and found matter are composed gradually. The work is adjusted until every element has space to speak."],
      ["Preparing", "The finished surface is stabilized, mounted, and prepared for a life beyond the studio without erasing its natural character."],
    ],
    collectorsTitle: "Held in other places",
    collectorsNote: "Notes from collectors",
    invitationTitle: "Continue through the archive.",
    invitationText: "See the works already formed, or review the public record of exhibitions and published conversations.",
    gallery: "Enter the works",
    exhibitions: "View exhibitions",
  },
  uk: {
    eyebrow: "Практика / живий архів матеріалів",
    title: "Робота з природою, пам’яттю та часом через текстуру.",
    introduction: "Мене звати Вікторія. Я створюю мистецтво під ім’ям Branchstone. Моя практика лежить між живописом і природою.",
    routes: [["Statement", "#artist-statement"], ["Біографія", "#biography"], ["Метод", "#method"]],
    chapters: ["01 / Statement", "02 / Біографія", "03 / Метод", "04 / В інших місцях", "05 / Продовження"],
    portraitAlt: "Вікторія, художниця Branchstone, у теплому вечірньому світлі",
    portraitNote: "Вікторія / Branchstone\nПівнічна Каліфорнія",
    statementTitle: "Statement художниці",
    statement: [
      "Я створюю текстурні абстрактні роботи з кори, гілок, каміння та інших природних матеріалів. Це не декор. Матеріали входять у процес як співавтори й формують роботу разом із моїми руками.",
      "Мій процес повільний та інтуїтивний. Я працюю через нашарування, терпіння й уважність, дозволяючи кожній роботі розвиватися у власному ритмі. Жодні дві роботи не повторюються. Кожна тримає свій баланс крихкості, ваги та історії.",
      "Кожен матеріал уже прожив своє життя. Я продовжую його в іншій формі—тій, що залишає простір для тиші, споглядання й заземлення. Branchstone — це про коріння і рух водночас; про стійкість, що не стає жорсткою; про тихі історії, які знаходять поверхню.",
    ],
    biographyTitle: "Біографія",
    biography: [
      "Я виросла на землях Донбасу, серед широких степів, запаху полину й червоних териконів, що підіймалися над землею. Цей ландшафт навчив мене помічати текстуру, контраст і тишу задовго до того, як мистецтво стало усвідомленою практикою.",
      "Пізніше Техас відкрив іншу мову матеріалу: вибілене сонцем дерево, сухі трави й потрісканий ґрунт. Тепер, у Північній Каліфорнії, я продовжую цей діалог із секвоями, прибережною корою та мохами. Кожне місце залишає слід у тому, як я бачу, пам’ятаю і створюю.",
    ],
    placesLabel: "Місця, що залишилися в роботі",
    places: [
      ["01", "Донбас, Україна", "Звідси текстура й контраст увійшли в пам’ять."],
      ["02", "Техас, США", "Роки сухого світла, відкритого обрію та вивітреного дерева."],
      ["03", "Північна Каліфорнія, США", "Тут прибережні матеріали входять у роботи зараз."],
    ],
    processTitle: "Творчий процес",
    processNote: "Повільна робота. Природний ритм. Матеріали як співавтори.",
    process: [
      ["Збирання", "Впалі гілки, вивітрена кора, каміння й мох збираються дбайливо—лише те, що ландшафт уже відпустив."],
      ["Слухання", "У студії я вивчаю форму, напругу, фактуру й історію, яка вже присутня на поверхні кожного матеріалу."],
      ["Нашарування", "Фарба і знайдені матеріали поступово входять у композицію. Я працюю, доки кожен елемент не отримає простір говорити."],
      ["Підготовка", "Завершена поверхня стабілізується, монтується й готується до життя поза студією без втрати природного характеру."],
    ],
    collectorsTitle: "Збережені в інших місцях",
    collectorsNote: "Нотатки колекціонерів",
    invitationTitle: "Продовжуйте рух архівом.",
    invitationText: "Перегляньте вже створені роботи або відкрийте публічний літопис виставок і публікацій.",
    gallery: "До робіт",
    exhibitions: "До виставок",
  },
};

const ukrainianFeedback = [
  { name: "Сара Мітчелл", location: "Плейно, Техас", review: "Робота Вікторії принесла частинку лісу в наш дім." },
  { name: "Девід К.", location: "Даллас, Техас", review: "Я розмістив «Липневі сосни» у спальні. Кольори, текстури й атмосфера повертають відчуття літа, проведеного в лісі з друзями." },
  { name: "Емілі Родрігез", location: "Плейно, Техас", review: "Це не просто мистецтво — це розмова з природою." },
];

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
  const englishFeedback = [0, 3, 5].map((index) => feedbackSource.feedbacks[index]);
  const feedbacks = locale === "uk" ? ukrainianFeedback : englishFeedback;

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
  const content = pageCopy[locale];

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
