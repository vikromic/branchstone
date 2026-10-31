// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteProvider } from "../../src/app/SiteContext.jsx";
import { getCatalog } from "../../src/content/artworks.js";
import { HomePage } from "../../src/pages/HomePage.jsx";
import {
  IntersectionObserverStub,
  installLocalStorage,
  pointerEvent,
  stubInertMatchMedia,
} from "../support/dom.js";

vi.mock("../../src/app/shell/SiteShell.jsx", () => ({
  SiteShell: ({ children }) => <main data-testid="site-shell">{children}</main>,
}));

function physicalTouchEnd() {
  const event = new Event("touchend", { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    touches: { configurable: true, value: [] },
    changedTouches: { configurable: true, value: [] },
  });
  return event;
}

function renderHome() {
  return render(
    <SiteProvider initialLocale="en">
      <HomePage />
    </SiteProvider>,
  );
}

function homeWorks(container = document) {
  return [...container.querySelectorAll("[data-home-work-id]")];
}

function activeHomeWork(container = document) {
  return homeWorks(container).filter((work) => work.dataset.homeActive === "true");
}

function expectedHomeArtworks(locale = "en") {
  const catalog = getCatalog(locale);
  const julyPines = catalog.find(({ id }) => id === "july-pines");
  return [
    julyPines,
    ...catalog.filter(({ highlighted, id, sold, story }) => (
      id !== "july-pines"
      && highlighted
      && !sold
      && story.trim().length > 0
    )),
  ];
}

function moveViewportCenterTo(work, previousWork) {
  const observer = IntersectionObserverStub.instances[0];
  expect(observer).toBeDefined();
  observer.trigger([
    {
      isIntersecting: false,
      target: previousWork,
      boundingClientRect: { top: -844, height: 844 },
    },
    {
      isIntersecting: true,
      target: work,
      boundingClientRect: { top: 0, height: 844 },
    },
  ]);
}

describe("Home mobile Stay stream", () => {
  beforeEach(() => {
    installLocalStorage();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/?qa=home-scroll-contract#soil");
    document.body.dataset.page = "home";
    document.documentElement.classList.add("stay-enhanced");
    IntersectionObserverStub.instances = [];
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
    vi.stubGlobal("PointerEvent", Event);
    stubInertMatchMedia();
    vi.stubGlobal("requestAnimationFrame", (callback) => window.setTimeout(() => callback(0), 0));
    vi.stubGlobal("cancelAnimationFrame", (id) => window.clearTimeout(id));
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
    Object.defineProperty(window, "onscrollend", { configurable: true, value: undefined });
    Object.defineProperty(document, "onscrollend", { configurable: true, value: undefined });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("stay-enhanced");
    document.body.className = "";
  });

  it("renders the unique curated Home projection as a real stream with July Pines first", () => {
    renderHome();
    const works = homeWorks();
    const expectedIds = expectedHomeArtworks().map(({ id }) => id);
    const renderedIds = works.map((work) => work.dataset.homeWorkId);

    expect(document.querySelector("[data-home-stream]")).toBeInTheDocument();
    const materialFrame = document.querySelector(".home-material-frame");
    const responsiveTopSources = [...materialFrame.querySelectorAll("picture source")];
    const mobileTopImage = materialFrame.querySelector(".home-material-layer--top");
    expect(responsiveTopSources).toHaveLength(2);
    for (const source of responsiveTopSources) {
      expect(source.getAttribute("media")).toMatch(/min-width/);
      expect(source.getAttribute("srcset")).toBeTruthy();
    }
    expect(mobileTopImage.getAttribute("src")).toBeTruthy();
    expect(materialFrame.querySelector(".home-memory-seam")).not.toBeInTheDocument();
    expect(materialFrame.querySelector(".home-material-frame__bottom-bound")).toBeInTheDocument();
    expect(renderedIds.length).toBeGreaterThan(2);
    expect(renderedIds).toHaveLength(expectedIds.length);
    expect(new Set(renderedIds)).toEqual(new Set(expectedIds));
    expect(new Set(renderedIds).size).toBe(renderedIds.length);
    expect(renderedIds[0]).toBe("july-pines");
    expect(works[0]).toHaveAttribute("data-artwork-id", "july-pines");
    expect(activeHomeWork()).toEqual([works[0]]);

    const title = document.getElementById(works[0].getAttribute("aria-labelledby"));
    expect(title).toHaveTextContent("July Pines");
  });

  it("begins the initial work reveal as soon as its artwork is ready", async () => {
    renderHome();
    const first = homeWorks()[0];
    const image = first.querySelector(".home-work__image");

    expect(first.querySelector("[data-stay-phase='materials']"))
      .toHaveAttribute("data-stay-state", "pending");

    fireEvent.load(image);

    await waitFor(() => {
      expect(first).toHaveAttribute("data-stay-fully-revealed", "true");
      expect(first.querySelector("[data-stay-phase='materials']"))
        .toHaveAttribute("data-stay-state", "resolved");
      expect(first.querySelector("[data-stay-phase='story']"))
        .toHaveAttribute("data-stay-state", "resolved");
      expect(first.querySelector("[data-stay-phase='availability']"))
        .toHaveAttribute("data-stay-state", "resolved");
    });
  });

  it.each([
    ["scrollend before the physical touchend", "scrollend-first"],
    ["physical touchend before scrollend", "touchend-first"],
  ])("commits only after both mobile terminals: %s", async (_label, ordering) => {
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    const originalUrl = window.location.href;
    renderHome();
    const [first, second] = homeWorks();

    fireEvent(second, pointerEvent("pointerdown", 71));
    fireEvent.scroll(window);
    moveViewportCenterTo(second, first);
    fireEvent(second, pointerEvent("pointercancel", 71));

    if (ordering === "scrollend-first") {
      fireEvent(document, new Event("scrollend", { bubbles: true }));
      await Promise.resolve();
      expect(activeHomeWork()).toEqual([first]);
      fireEvent(document, physicalTouchEnd());
    } else {
      fireEvent(document, physicalTouchEnd());
      await Promise.resolve();
      expect(activeHomeWork()).toEqual([first]);
      fireEvent(document, new Event("scrollend", { bubbles: true }));
    }

    await waitFor(() => expect(activeHomeWork()).toEqual([second]));
    expect(first).toHaveAttribute("data-home-active", "false");
    expect(second).toHaveAttribute("data-home-active", "true");
    expect(window.location.href).toBe(originalUrl);

    const title = document.getElementById(second.getAttribute("aria-labelledby"));
    expect(title).toHaveTextContent(getCatalog("en").find(({ id }) => (
      id === second.dataset.homeWorkId
    )).name);
  });

  it("requires five stable legacy animation frames before selecting the centered work", async () => {
    const frames = new Map();
    let nextFrameId = 1;
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      const id = nextFrameId;
      nextFrameId += 1;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id) => frames.delete(id));
    renderHome();
    const [first, second] = homeWorks();
    frames.clear();

    fireEvent.scroll(window);
    moveViewportCenterTo(second, first);
    expect(frames.size).toBeGreaterThan(0);

    const runFrame = () => {
      const queued = [...frames.entries()];
      frames.clear();
      for (const [, callback] of queued) callback(0);
    };
    for (let frame = 1; frame < 5; frame += 1) {
      runFrame();
      await Promise.resolve();
      expect(activeHomeWork()).toEqual([first]);
    }

    runFrame();
    await waitFor(() => expect(activeHomeWork()).toEqual([second]));
  });

  it("keeps every featured work and reveal phase semantic in server markup", () => {
    const html = renderToString(
      <SiteProvider initialLocale="en">
        <HomePage />
      </SiteProvider>,
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    const works = homeWorks(container);
    const expectedCount = expectedHomeArtworks().length;

    expect(works).toHaveLength(expectedCount);
    expect(works[0]).toHaveAttribute("data-home-work-id", "july-pines");
    for (const work of works) {
      expect(work.tagName).toBe("ARTICLE");
      expect(work).not.toHaveAttribute("inert");
      expect(work).not.toHaveAttribute("aria-hidden");
      const artworkImage = work.querySelector(
        "[data-stay-phase='artwork'] .home-work__image",
      );
      expect(artworkImage).toHaveAttribute("alt");
      expect(artworkImage.getAttribute("alt")).not.toBe("");
      for (const phase of ["materials", "story", "availability"]) {
        const phaseElement = work.querySelector(`[data-stay-phase='${phase}']`);
        expect(phaseElement?.getAttribute("data-stay-state")).toMatch(/^(pending|resolved)$/);
        expect(phaseElement.textContent.trim()).not.toBe("");
      }

      const title = container.querySelector(
        `[id="${work.getAttribute("aria-labelledby")}"]`,
      );
      expect(title).not.toBeNull();
      expect(title).not.toBeEmptyDOMElement();
    }
    expect(container.textContent).toContain("Materials");
    expect(container.textContent).toContain("Memory");
    expect(container.textContent).toContain("Availability");
  });
});
