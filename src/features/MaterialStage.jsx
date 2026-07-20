import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react";
import { useSite } from "../app/SiteContext.jsx";
import { localeHref } from "../domain/content.js";
import { selectHomeArtworks } from "../domain/catalog.js";
import {
  StayArtworkImage,
  StayPhase,
  StayReveal,
  useViewportArtworkSelection,
} from "./stay/index.js";
import bottomStrata from "../assets/material-stage/bottom-strata-alpha.webp";
import homeTopComposite from "../assets/material-stage/home-top-composite-alpha.webp";
import homeTopVaultDesktop from "../assets/material-stage/home-top-vault-desktop-alpha.webp";
import homeTopVaultShortDesktop from "../assets/material-stage/home-top-vault-desktop-short-alpha.webp";
import julyPinesStage from "../assets/material-stage/july-pines-stage.webp";

const homeCopy = {
  en: {
    availabilityLabel: "Availability",
    available: "Original available",
    collected: "Private collection",
    field: "A living stream of material works",
    last: "enter the living archive",
    materialsLabel: "Materials",
    memoryLabel: "Memory",
    prints: "fine-art prints available",
    scroll: "scroll · then stay",
    statement: "What the earth releases, I carry.",
    view: "View the full work",
    revealAnnouncements: {
      materials: "Materials revealed.",
      story: "Memory revealed.",
      availability: "Availability revealed.",
    },
  },
  uk: {
    availabilityLabel: "Доступність",
    available: "Оригінал доступний",
    collected: "Приватна колекція",
    field: "Живий потік матеріальних робіт",
    last: "увійти до живого архіву",
    materialsLabel: "Матеріали",
    memoryLabel: "Пам’ять",
    prints: "доступні художні принти",
    scroll: "гортай · тоді залишайся",
    statement: "Те, що відпускає земля, я несу далі.",
    view: "Переглянути роботу повністю",
    revealAnnouncements: {
      materials: "Матеріали відкрито.",
      story: "Пам’ять відкрито.",
      availability: "Доступність відкрито.",
    },
  },
};

function storyExcerpt(story, limit = 190) {
  const paragraph = String(story)
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean) ?? "";
  if (paragraph.length <= limit) return paragraph;
  const clipped = paragraph.slice(0, limit + 1).replace(/\s+\S*$/, "").trim();
  return `${clipped || paragraph.slice(0, limit).trim()}…`;
}

function availabilityCopy(artwork, labels) {
  const state = artwork.sold ? labels.collected : labels.available;
  return artwork.prints ? `${state} · ${labels.prints}` : state;
}

const HomeWork = memo(function HomeWork({
  artwork,
  position,
  total,
  isActive,
  onRegister,
  locale,
  labels,
}) {
  const [stayAnnouncement, setStayAnnouncement] = useState("");
  const titleId = `home-work-${artwork.id}-title`;
  const story = storyExcerpt(artwork.story);
  const artworkSrc = artwork.id === "july-pines" ? julyPinesStage : artwork.streamPrimary;
  const galleryHref = localeHref(`/gallery.html?art=${encodeURIComponent(artwork.id)}`, locale);
  const setArticleRef = useCallback(
    (node) => onRegister(artwork.id, node),
    [artwork.id, onRegister],
  );

  useEffect(() => {
    if (!isActive) setStayAnnouncement("");
  }, [isActive]);

  return (
    <StayReveal
      as="article"
      ref={setArticleRef}
      activeKey={artwork.id}
      active={isActive}
      observeWindowScroll={isActive}
      settleOnMount={isActive}
      waitForArtwork
      phasePresence={{ materials: true, story: Boolean(story), availability: true }}
      onPhaseChange={(phase, state) => {
        if (state === "resolved" && isActive && labels.revealAnnouncements[phase]) {
          setStayAnnouncement(labels.revealAnnouncements[phase]);
        }
      }}
      className="home-work"
      data-artwork-id={artwork.id}
      data-home-work-id={artwork.id}
      data-home-active={isActive ? "true" : "false"}
      aria-labelledby={titleId}
    >
      <StayPhase as="figure" phase="artwork" className="home-artwork-field">
        <div className="home-artwork-fallback" aria-hidden="true">
          <span>{artwork.name}</span>
        </div>
        <img
          className="home-work__atmosphere"
          src={artworkSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          decoding="async"
          loading={position < 2 ? "eager" : "lazy"}
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
        <StayArtworkImage
          className="home-work__image"
          src={artworkSrc}
          alt={`${artwork.name}, ${artwork.year}. ${artwork.materials}`}
          draggable={false}
          decoding="async"
          loading={position < 2 ? "eager" : "lazy"}
          fetchPriority={position === 0 ? "high" : "auto"}
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
        <figcaption className="sr-only">
          {artwork.name}, {artwork.year}. {artwork.materials}
        </figcaption>
      </StayPhase>

      <div className="home-work__identity">
        <span>{String(position + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <h2 id={titleId}>{artwork.name}</h2>
        <p>{artwork.year} · {artwork.collection}</p>
      </div>

      <div className="home-stay-details">
        <StayPhase phase="materials" className="home-stay-detail">
          <span>{labels.materialsLabel}</span>
          <p>{artwork.materials}</p>
        </StayPhase>
        {story ? (
          <StayPhase phase="story" className="home-stay-detail">
            <span>{labels.memoryLabel}</span>
            <p>{story}</p>
          </StayPhase>
        ) : null}
        <StayPhase phase="availability" className="home-stay-detail home-stay-detail--availability">
          <span>{labels.availabilityLabel}</span>
          <p>{availabilityCopy(artwork, labels)}</p>
          <a href={galleryHref}>
            {labels.view}
            <ArrowUpRight aria-hidden="true" weight="thin" />
          </a>
        </StayPhase>
      </div>

      <p className="home-stage__statement">{labels.statement.toUpperCase()}</p>

      {position < total - 1 ? (
        <p className="home-scroll-cue" aria-hidden="true">
          <span>{labels.scroll}</span>
          <ArrowDown weight="thin" />
        </p>
      ) : (
        <a className="home-scroll-cue home-scroll-cue--archive" href={localeHref("/gallery.html", locale)}>
          <span>{labels.last}</span>
          <ArrowUpRight aria-hidden="true" weight="thin" />
        </a>
      )}

      <div className="home-work__shade" aria-hidden="true" />
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {isActive ? `${artwork.name}. ${stayAnnouncement}` : ""}
      </span>
    </StayReveal>
  );
});

export function MaterialStage() {
  const { catalog, locale } = useSite();
  const labels = homeCopy[locale];
  const artworks = useMemo(() => selectHomeArtworks(catalog), [catalog]);
  const { activeId, registerArtwork } = useViewportArtworkSelection(artworks);

  return (
    <div
      className="home-experience"
      data-home-stream=""
      data-home-active-id={activeId ?? ""}
    >
      <h1 className="sr-only">Branchstone by Viktoria — {labels.field}</h1>

      <div className="home-work-stream">
        {artworks.map((artwork, position) => (
          <HomeWork
            key={artwork.id}
            artwork={artwork}
            position={position}
            total={artworks.length}
            isActive={activeId === artwork.id}
            onRegister={registerArtwork}
            locale={locale}
            labels={labels}
          />
        ))}
      </div>

      <div
        className={`home-material-frame${activeId === "july-pines" ? " is-intro-frame" : ""}`}
        aria-hidden="true"
      >
        <picture>
          <source
            media="(min-width: 700px) and (max-height: 620px) and (min-aspect-ratio: 9 / 4)"
            srcSet={homeTopVaultShortDesktop}
          />
          <source media="(min-width: 700px)" srcSet={homeTopVaultDesktop} />
          <img
            className="home-material-layer home-material-layer--top"
            src={homeTopComposite}
            alt=""
            draggable="false"
            decoding="async"
          />
        </picture>
        <div className="home-material-frame__bottom-bound">
          <img
            className="home-material-layer home-material-layer--bottom"
            src={bottomStrata}
            alt=""
            draggable="false"
            decoding="async"
          />
        </div>
        <div className="home-material-frame__shade" />
      </div>
    </div>
  );
}
