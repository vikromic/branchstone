// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteProvider } from "../src/app/SiteContext.jsx";
import { getCatalog } from "../src/domain/catalog.js";
import { GalleryPage } from "../src/pages/GalleryPage.jsx";

vi.mock("../src/app/SiteShell.jsx", () => ({
  SiteShell: ({ children }) => <main data-testid="site-shell">{children}</main>,
}));

class IntersectionObserverStub {
  static instances = [];

  constructor(callback) {
    this.callback = callback;
    IntersectionObserverStub.instances.push(this);
  }

  observe() {}

  unobserve() {}

  disconnect() {}

  trigger(entries) {
    for (const entry of entries) {
      if (!entry.target || !entry.boundingClientRect) continue;
      const { top = 0, height = 0 } = entry.boundingClientRect;
      entry.target.getBoundingClientRect = () => ({
        ...entry.boundingClientRect,
        top,
        height,
        bottom: entry.boundingClientRect.bottom ?? top + height,
      });
    }
    this.callback(entries);
  }
}

function pointerEvent(type, pointerId, isPrimary = true, coordinates = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { configurable: true, value: pointerId },
    pointerType: { configurable: true, value: "touch" },
    isPrimary: { configurable: true, value: isPrimary },
    button: { configurable: true, value: 0 },
    clientX: { configurable: true, value: coordinates.clientX ?? 0 },
    clientY: { configurable: true, value: coordinates.clientY ?? 0 },
  });
  return event;
}

function physicalTouchTerminal(type = "touchend", touches = []) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    touches: { configurable: true, value: touches },
    changedTouches: { configurable: true, value: [] },
  });
  return event;
}

function renderGallery(locale = "en") {
  return render(
    <SiteProvider initialLocale={locale}>
      <GalleryPage />
    </SiteProvider>,
  );
}

function archiveArticles() {
  return screen.getByRole("region", { name: "Artwork archive" }).querySelectorAll("article");
}

function installLocalStorage() {
  const values = new Map();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key) => values.get(String(key)) ?? null,
      removeItem: (key) => values.delete(String(key)),
      setItem: (key, value) => values.set(String(key), String(value)),
    },
  });
}

function installMatchMedia({ desktop = true } = {}) {
  vi.stubGlobal("matchMedia", vi.fn((query) => ({
    matches: query === "(min-width: 760px)"
      ? desktop
      : query === "(max-width: 759px)"
        ? !desktop
        : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
}

function installControllableMatchMedia({ desktop = false } = {}) {
  let desktopMatches = desktop;
  const mediaByQuery = new Map();

  const mediaFor = (query) => {
    if (mediaByQuery.has(query)) return mediaByQuery.get(query);
    const listeners = new Set();
    const media = {
      get matches() {
        if (query === "(min-width: 760px)") return desktopMatches;
        if (query === "(max-width: 759px)") return !desktopMatches;
        return false;
      },
      media: query,
      addEventListener: (type, listener) => {
        if (type === "change") listeners.add(listener);
      },
      removeEventListener: (type, listener) => {
        if (type === "change") listeners.delete(listener);
      },
      notify: () => {
        const event = { matches: media.matches, media: query };
        listeners.forEach((listener) => listener(event));
      },
    };
    mediaByQuery.set(query, media);
    return media;
  };

  vi.stubGlobal("matchMedia", vi.fn(mediaFor));

  return {
    setDesktop(nextDesktop) {
      desktopMatches = nextDesktop;
      mediaByQuery.get("(min-width: 760px)")?.notify();
      mediaByQuery.get("(max-width: 759px)")?.notify();
    },
  };
}

describe("Gallery Stay stream", () => {
  beforeEach(() => {
    installLocalStorage();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/gallery.html");
    document.body.dataset.page = "gallery";
    document.documentElement.classList.add("stay-enhanced");
    IntersectionObserverStub.instances = [];
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
    vi.stubGlobal("PointerEvent", Event);
    installMatchMedia();
    vi.stubGlobal("requestAnimationFrame", (callback) => window.setTimeout(() => callback(0), 0));
    vi.stubGlobal("cancelAnimationFrame", (id) => window.clearTimeout(id));
    Object.defineProperty(window, "onscrollend", { configurable: true, value: undefined });
    Object.defineProperty(document, "onscrollend", { configurable: true, value: undefined });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("stay-enhanced");
    delete document.documentElement.dataset.galleryLayout;
    delete document.documentElement.dataset.hydrated;
    delete document.documentElement.dataset.hydrationStalled;
    delete document.documentElement.dataset.theme;
    document.body.className = "";
  });

  it("keeps the record in artwork, reveal, materials, story, availability order", async () => {
    renderGallery();
    const first = archiveArticles()[0];
    const orderedFlow = [...first.querySelectorAll(
      "[data-stay-phase], [data-stay-reveal-control]",
    )].map((node) => node.dataset.stayPhase ?? "reveal");

    expect(orderedFlow).toEqual([
      "artwork",
      "reveal",
      "materials",
      "story",
      "availability",
    ]);

    const image = first.querySelector("[data-stay-phase='artwork'] img");
    const materials = first.querySelector("[data-stay-phase='materials']");
    const availability = first.querySelector("[data-stay-phase='availability']");
    expect(materials).toHaveAttribute("data-stay-state", "pending");
    expect(materials).toHaveAttribute("inert");

    fireEvent.load(image);
    expect(materials).toHaveAttribute("data-stay-state", "pending");

    const revealControl = first.querySelector("[data-stay-reveal-control]");
    fireEvent.focus(revealControl);
    expect(materials).toHaveAttribute("data-stay-state", "pending");
    fireEvent.click(revealControl);
    await waitFor(() => expect(materials).toHaveAttribute("data-stay-state", "resolved"));
    expect(availability).toHaveAttribute("data-stay-state", "resolved");

    const save = within(first).getByRole("button", { name: /Save work: Born Of Burn/ });
    fireEvent.click(save);
    await waitFor(() => expect(save).toHaveAttribute("aria-pressed", "true"));
    expect(JSON.parse(window.localStorage.getItem("branchstone_favorites")))
      .toEqual(["artwork-born-of-burn"]);
  });

  it("filters the continuous stream and keeps collection state in the URL", async () => {
    renderGallery();
    expect(archiveArticles()).toHaveLength(32);

    const availability = screen.getByRole("group", { name: "Filter by availability" });
    fireEvent.click(within(availability).getByRole("button", { name: /Available/ }));
    await waitFor(() => expect(archiveArticles()).toHaveLength(19));
    expect(new URL(window.location.href).searchParams.get("availability")).toBe("available");

    fireEvent.click(within(availability).getByRole("button", { name: /Collected/ }));
    await waitFor(() => expect(archiveArticles()).toHaveLength(13));
    expect(new URL(window.location.href).searchParams.get("availability")).toBe("collected");

    fireEvent.click(within(availability).getByRole("button", { name: /All/ }));
    expect(new URL(window.location.href).searchParams.has("availability")).toBe(false);
    const collection = screen.getByRole("group", { name: "Filter by collection" });
    fireEvent.click(within(collection).getByRole("button", { name: /Golden/ }));
    await waitFor(() => expect(archiveArticles()).toHaveLength(4));
    expect(new URL(window.location.href).searchParams.get("collection")).toBe("golden");

    const goldenWorks = getCatalog("en").filter(({ collectionId }) => collectionId === "golden");
    expect(within(availability).getByRole("button", { name: /All/ }))
      .toHaveTextContent(String(goldenWorks.length).padStart(2, "0"));
    expect(within(availability).getByRole("button", { name: /Available/ }))
      .toHaveTextContent(String(goldenWorks.filter(({ sold }) => !sold).length).padStart(2, "0"));
    expect(within(availability).getByRole("button", { name: /Collected/ }))
      .toHaveTextContent(String(goldenWorks.filter(({ sold }) => sold).length).padStart(2, "0"));
    expect([...screen.getByLabelText("Archive status").querySelectorAll("dd")].map(({ textContent }) => textContent))
      .toEqual([
        "32",
        "19",
        "13",
      ]);
  });

  it("renders a scan-first mobile index with native filters and lightweight previews", async () => {
    installMatchMedia({ desktop: false });
    renderGallery();

    const archive = screen.getByRole("region", { name: "Artwork archive" });
    expect(archive.querySelectorAll(".gallery-index-work")).toHaveLength(32);
    expect(within(archive).getAllByRole("listitem")).toHaveLength(32);
    expect(archive.querySelector(".gallery-work")).not.toBeInTheDocument();
    expect(archive.querySelector("[data-stay-root]")).not.toBeInTheDocument();
    expect(screen.getByText("32 works")).toHaveAttribute("aria-atomic", "true");

    const firstLink = document.getElementById("artwork-open-born-of-burn");
    expect(firstLink).toHaveAttribute("aria-haspopup", "dialog");
    expect(firstLink).toHaveAccessibleName("Born Of Burn Available View work");
    const firstPreview = firstLink.querySelector("img");
    expect(firstPreview).toHaveAttribute("loading", "eager");
    expect(firstPreview).toHaveAttribute("fetchpriority", "high");
    expect(firstPreview).toHaveAttribute("width");
    expect(firstPreview).toHaveAttribute("height");
    expect(firstPreview.getAttribute("src")).toMatch(/artwork-index.*\.webp/);
    const previews = [...archive.querySelectorAll(".gallery-index-work__visual img")];
    expect(previews[1]).toHaveAttribute("loading", "eager");
    expect(previews[1]).toHaveAttribute("fetchpriority", "high");
    expect(previews[2]).toHaveAttribute("loading", "lazy");
    expect(previews[2]).toHaveAttribute("fetchpriority", "auto");
    expect(screen.getByRole("combobox", { name: "Availability" })).toBeEnabled();
    expect(screen.getByRole("combobox", { name: "Collection" })).toBeEnabled();
    expect(firstLink).toHaveAttribute(
      "href",
      "?art=born-of-burn#artwork-details-born-of-burn",
    );
    await waitFor(() => expect(document.querySelector(".gallery-progressive-details"))
      .not.toBeInTheDocument());

    fireEvent.change(screen.getByRole("combobox", { name: "Availability" }), {
      target: { value: "available" },
    });
    await waitFor(() => expect(archive.querySelectorAll(".gallery-index-work")).toHaveLength(19));
    expect(new URL(window.location.href).searchParams.get("availability")).toBe("available");
    expect(screen.getByText("19 works")).toHaveAttribute("aria-atomic", "true");

    fireEvent.change(screen.getByRole("combobox", { name: "Collection" }), {
      target: { value: "golden" },
    });
    const goldenAvailable = getCatalog("en")
      .filter(({ collectionId, sold }) => collectionId === "golden" && !sold);
    await waitFor(() => expect(archive.querySelectorAll(".gallery-index-work"))
      .toHaveLength(goldenAvailable.length));
    expect(new URL(window.location.href).searchParams.get("collection")).toBe("golden");
  });

  it.each([
    ["throws", () => { throw new Error("restricted WebView"); }],
    ["returns null", () => null],
  ])("fails open to the mobile index and soil theme when matchMedia %s", (
    _label,
    matchMedia,
  ) => {
    vi.stubGlobal("matchMedia", vi.fn(matchMedia));

    expect(() => renderGallery()).not.toThrow();
    expect(screen.getByRole("region", { name: "Artwork archive" })
      .querySelectorAll(".gallery-index-work")).toHaveLength(32);
    expect(document.querySelector(".gallery-stream")).not.toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("soil");
  });

  it("keeps SSR filters disabled until hydration applies canonical URL state", async () => {
    installMatchMedia({ desktop: false });
    window.history.replaceState(
      {},
      "",
      "/gallery.html?collection=deep-ocean&availability=collected",
    );
    const page = () => (
      <SiteProvider initialLocale="en">
        <GalleryPage />
      </SiteProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(page());
    document.body.append(container);
    const prerenderedFilters = [...container.querySelectorAll(".gallery-mobile-filters select")];
    const prerenderedDesktopFilters = [...container.querySelectorAll(
      ".gallery-status-filter button, .gallery-collection-filter button",
    )];

    expect(prerenderedFilters).toHaveLength(2);
    expect(prerenderedFilters.every((select) => select.disabled)).toBe(true);
    expect(prerenderedDesktopFilters).not.toHaveLength(0);
    expect(prerenderedDesktopFilters.every((button) => button.disabled)).toBe(true);
    expect(container.querySelectorAll(".gallery-index-work__link")).toHaveLength(32);
    expect(container.querySelectorAll(".gallery-progressive-detail")).toHaveLength(32);

    const onRecoverableError = vi.fn();
    let root;
    try {
      await act(async () => {
        root = hydrateRoot(container, page(), { onRecoverableError });
        await Promise.resolve();
      });

      await waitFor(() => expect(prerenderedFilters.every((select) => !select.disabled))
        .toBe(true));
      expect(prerenderedDesktopFilters.every((button) => !button.disabled)).toBe(true);
      expect(prerenderedFilters[0]).toHaveValue("collected");
      expect(prerenderedFilters[1]).toHaveValue("deep-ocean");
      expect(container.querySelectorAll(".gallery-index-work")).toHaveLength(4);
      expect(onRecoverableError).not.toHaveBeenCalled();
    } finally {
      if (root) await act(async () => root.unmount());
      container.remove();
    }
  });

  it.each([
    ["en", "/gallery.html", "Image temporarily unavailable"],
    ["uk", "/uk/gallery.html", "Зображення тимчасово недоступне"],
  ])("keeps a failed %s index preview visible, localized, and actionable", (
    locale,
    path,
    unavailableLabel,
  ) => {
    installMatchMedia({ desktop: false });
    window.history.replaceState({}, "", path);
    renderGallery(locale);

    const firstLink = document.getElementById("artwork-open-born-of-burn");
    const firstPreview = firstLink.querySelector("img");
    fireEvent.error(firstPreview);

    expect(within(firstLink).getByText(unavailableLabel)).toBeVisible();
    expect(firstLink.querySelector(".gallery-index-work__visual"))
      .toHaveAttribute("data-preview-error", "true");
    expect(firstLink).toHaveAccessibleName(
      locale === "uk"
        ? "Народженне з Попілу Доступна Переглянути"
        : "Born Of Burn Available View work",
    );

    fireEvent.click(firstLink);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("uses locale-correct singular and plural result counts", async () => {
    installMatchMedia({ desktop: false });
    window.history.replaceState({}, "", "/uk/gallery.html");
    renderGallery("uk");
    const collection = screen.getByRole("combobox", { name: "Колекція" });
    const availability = screen.getByRole("combobox", { name: "Доступність" });

    expect(screen.getByText("32 роботи")).toBeInTheDocument();
    fireEvent.change(collection, { target: { value: "magnet" } });
    await waitFor(() => expect(screen.getByText("01 робота")).toBeInTheDocument());

    fireEvent.change(collection, { target: { value: "of-ash-and-flowers" } });
    fireEvent.change(availability, { target: { value: "collected" } });
    await waitFor(() => expect(screen.getByText("02 роботи")).toBeInTheDocument());

    fireEvent.change(availability, { target: { value: "all" } });
    fireEvent.change(collection, { target: { value: "deep-ocean" } });
    await waitFor(() => expect(screen.getByText("05 робіт")).toBeInTheDocument());
  });

  it("uses the English singular result label", async () => {
    installMatchMedia({ desktop: false });
    renderGallery();

    fireEvent.change(screen.getByRole("combobox", { name: "Collection" }), {
      target: { value: "magnet" },
    });
    await waitFor(() => expect(screen.getByText("01 work")).toBeInTheDocument());
  });

  it("keeps each artwork frame tied to its composition while filters reorder the index", async () => {
    installMatchMedia({ desktop: false });
    renderGallery();
    const aspectFor = (id) => document.getElementById(`artwork-open-${id}`)
      ?.closest(".gallery-index-work")
      ?.style.getPropertyValue("--gallery-index-aspect");

    expect(aspectFor("core")).toBe("4 / 5");
    expect(aspectFor("whales")).toBe("5 / 4");
    expect(aspectFor("compass")).toBe("1788 / 1756");

    fireEvent.change(screen.getByRole("combobox", { name: "Availability" }), {
      target: { value: "available" },
    });
    await waitFor(() => expect(aspectFor("core")).toBe("4 / 5"));

    fireEvent.change(screen.getByRole("combobox", { name: "Availability" }), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Collection" }), {
      target: { value: "deep-ocean" },
    });
    await waitFor(() => expect(aspectFor("whales")).toBe("5 / 4"));

    fireEvent.change(screen.getByRole("combobox", { name: "Collection" }), {
      target: { value: "following-her-steps" },
    });
    await waitFor(() => expect(aspectFor("compass")).toBe("1788 / 1756"));
  });

  it("uses artwork-aware intrinsic estimates that remain stable through filtering", async () => {
    installMatchMedia({ desktop: false });
    renderGallery();
    const estimatesFor = (id) => {
      const style = document.getElementById(`artwork-open-${id}`)
        ?.closest(".gallery-index-work")
        ?.style;
      return [
        style?.getPropertyValue("--gallery-index-estimate"),
        style?.getPropertyValue("--gallery-index-estimate-narrow"),
      ];
    };

    expect(estimatesFor("core")).toEqual(["24rem", "31rem"]);
    expect(estimatesFor("whales")).toEqual(["19rem", "23rem"]);
    expect(estimatesFor("compass")).toEqual(["21rem", "26rem"]);

    fireEvent.change(screen.getByRole("combobox", { name: "Collection" }), {
      target: { value: "following-her-steps" },
    });
    await waitFor(() => expect(estimatesFor("compass")).toEqual(["21rem", "26rem"]));
  });

  it("shows desktop zero-result filters without retaining the pre-hydration pending state", () => {
    installMatchMedia({ desktop: true });
    document.documentElement.dataset.galleryLayout = "stream";
    window.history.replaceState(
      {},
      "",
      "/gallery.html?collection=golden&availability=available",
    );
    renderGallery();

    const archive = screen.getByRole("region", { name: "Artwork archive" });
    const pending = archive.querySelector(".gallery-archive__pending");
    const preHydrationPendingSelector = [
      'html[data-gallery-layout="stream"]',
      ':not([data-hydrated="true"])',
      ':not([data-hydration-stalled="true"])',
      " .gallery-archive > .gallery-archive__pending",
    ].join("");

    expect(within(archive).getByText("No works sit in this layer yet."))
      .toBeInTheDocument();
    expect(archive.querySelector(".gallery-stream")).not.toBeInTheDocument();
    expect(pending.matches(preHydrationPendingSelector)).toBe(true);

    document.documentElement.dataset.hydrated = "true";
    expect(pending.matches(preHydrationPendingSelector)).toBe(false);
  });

  it("opens mobile details without waiting for the image and steps between works in place", async () => {
    installMatchMedia({ desktop: false });
    renderGallery();
    const catalog = getCatalog("en");
    const first = catalog[0];
    const second = catalog[1];
    const pushState = vi.spyOn(window.history, "pushState");
    const firstOpener = document.getElementById(`artwork-open-${first.id}`);

    fireEvent.click(firstOpener);
    fireEvent.click(firstOpener);
    expect(pushState).toHaveBeenCalledTimes(1);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(
      dialog.querySelector("[data-stay-phase='availability']"),
    ).toHaveAttribute("data-stay-state", "resolved"));
    expect(new URL(window.location.href).searchParams.get("art")).toBe(first.id);

    fireEvent.click(within(dialog).getByRole("button", { name: "Next image" }));
    expect(dialog.querySelector("[data-stay-phase='availability']"))
      .toHaveAttribute("data-stay-state", "resolved");
    expect(dialog).toHaveAttribute("data-stay-fully-revealed", "true");
    await new Promise((resolve) => globalThis.setTimeout(resolve, 0));
    expect(dialog.querySelector("[data-stay-phase='availability']"))
      .toHaveAttribute("data-stay-state", "resolved");
    expect(dialog).toHaveAttribute("data-stay-fully-revealed", "true");

    fireEvent.click(within(dialog).getByRole("button", { name: "Next work" }));
    await waitFor(() => expect(within(dialog).getByRole("heading", { name: second.name }))
      .toBeInTheDocument());
    expect(new URL(window.location.href).searchParams.get("art")).toBe(second.id);
    expect(within(dialog).getByText("02 / 32")).toBeInTheDocument();
    expect(within(dialog).getByText(`${second.name} — work 2 of 32`)).toBeInTheDocument();
    fireEvent.load(dialog.querySelector(".artwork-dialog__visual img"));
    expect(within(dialog).getByRole("status")).toBeEmptyDOMElement();
  });

  it("switches modal locale without losing the open work or active filters", async () => {
    installMatchMedia({ desktop: false });
    window.history.replaceState(
      {},
      "",
      "/gallery.html?collection=the-calm-of-the-forest&availability=collected",
    );
    renderGallery();
    const julyPines = getCatalog("en").find(({ id }) => id === "july-pines");

    fireEvent.click(document.getElementById(`artwork-open-${julyPines.id}`));
    const dialog = await screen.findByRole("dialog");
    const localeLink = within(dialog).getByRole("link", {
      name: "Switch to Ukrainian",
    });
    const destination = new URL(localeLink.href);

    expect(destination.pathname).toBe("/uk/gallery.html");
    expect(destination.searchParams.get("collection")).toBe("the-calm-of-the-forest");
    expect(destination.searchParams.get("availability")).toBe("collected");
    expect(destination.searchParams.get("art")).toBe(julyPines.id);
    expect(localeLink).toHaveTextContent("УКР");
  });

  it("announces only an image wait that crosses the delay threshold", async () => {
    installMatchMedia({ desktop: false });
    renderGallery();
    const [first, second] = getCatalog("en");

    vi.useFakeTimers();
    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = screen.getByRole("dialog");
    act(() => vi.advanceTimersByTime(300));
    fireEvent.load(dialog.querySelector(".artwork-dialog__visual img"));
    act(() => vi.advanceTimersByTime(300));
    expect(within(dialog).getByRole("status")).toBeEmptyDOMElement();

    fireEvent.click(within(dialog).getByRole("button", { name: "Next work" }));
    expect(within(dialog).getByRole("heading", { name: second.name })).toBeInTheDocument();
    const status = within(dialog).getByRole("status");
    expect(status).toBeEmptyDOMElement();

    act(() => vi.advanceTimersByTime(499));
    expect(status).toBeEmptyDOMElement();
    act(() => vi.advanceTimersByTime(1));
    expect(status).toHaveTextContent("Material coming into view");

    fireEvent.load(dialog.querySelector(".artwork-dialog__visual img"));
    expect(status).toHaveTextContent("Image ready");
    vi.useRealTimers();
  });

  it("offers recovery only after a genuine long wait and accepts a later native load", () => {
    installMatchMedia({ desktop: false });
    renderGallery();
    vi.useFakeTimers();
    const first = getCatalog("en")[0];

    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = screen.getByRole("dialog");
    const image = dialog.querySelector(".artwork-dialog__visual img");
    const availability = dialog.querySelector("[data-stay-phase='availability']");

    act(() => vi.advanceTimersByTime(14999));
    expect(within(dialog).queryByRole("button", { name: "Try again" }))
      .not.toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-stay-image-state", "pending");
    expect(availability).toHaveAttribute("data-stay-state", "resolved");
    expect(availability).not.toHaveAttribute("inert");

    act(() => vi.advanceTimersByTime(1));
    expect(within(dialog).getByRole("button", { name: "Try again" }))
      .toBeInTheDocument();
    expect(dialog.querySelector(".artwork-surface__recovery p")).toHaveTextContent(
      "This image is taking longer than expected. You can keep waiting or try again.",
    );
    expect(dialog).toHaveAttribute("data-stay-image-state", "pending");

    fireEvent.load(image);
    expect(within(dialog).queryByRole("button", { name: "Try again" }))
      .not.toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-stay-image-state", "ready");
  });

  it.each([
    [
      "en",
      "/gallery.html",
      "Image temporarily unavailable",
      "Try again",
      "Trying the image again…",
      "Previous image",
    ],
    [
      "uk",
      "/uk/gallery.html",
      "Зображення тимчасово недоступне",
      "Спробувати ще раз",
      "Пробуємо завантажити зображення ще раз…",
      "Попереднє зображення",
    ],
  ])("recovers a native image error with one consistent %s status", async (
    locale,
    path,
    unavailableLabel,
    retryLabel,
    retryingLabel,
    previousImageLabel,
  ) => {
    installMatchMedia({ desktop: false });
    window.history.replaceState({}, "", path);
    renderGallery(locale);
    const first = getCatalog(locale)[0];
    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = screen.getByRole("dialog");
    const oldImage = dialog.querySelector(".artwork-dialog__visual img");
    Object.defineProperty(oldImage, "currentSrc", {
      configurable: true,
      value: "https://images.branchstone.test/stalled.webp",
    });

    fireEvent.error(oldImage);
    expect(dialog.querySelector(".artwork-surface__recovery p"))
      .toHaveTextContent(unavailableLabel);
    expect(within(dialog).getByRole("status")).toHaveTextContent(unavailableLabel);

    const retry = within(dialog).getByRole("button", { name: retryLabel });
    retry.focus();
    fireEvent.click(retry);
    const retriedImage = dialog.querySelector(".artwork-dialog__visual img");
    expect(retriedImage).not.toBe(oldImage);
    expect(retriedImage.src).toContain("images.branchstone.test/stalled.webp");
    expect(retriedImage.src).toContain("branchstone-retry=");
    expect(retriedImage).not.toHaveAttribute("srcset");
    expect(dialog).toHaveAttribute("data-stay-image-state", "pending");
    expect(within(dialog).getByRole("status")).toHaveTextContent(retryingLabel);
    expect(retry).toHaveFocus();
    expect(retry).toHaveAttribute("aria-disabled", "true");
    expect(dialog.querySelector("[data-stay-phase='availability']"))
      .toHaveAttribute("data-stay-state", "resolved");
    expect(dialog.querySelector("[data-stay-phase='availability']"))
      .not.toHaveAttribute("inert");

    const previousImage = within(dialog).getByRole("button", { name: previousImageLabel });
    fireEvent.load(retriedImage);
    await act(async () => Promise.resolve());
    expect(previousImage).toHaveFocus();
    expect(previousImage).toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-stay-image-state", "ready");
    expect(dialog.querySelector(".artwork-surface__recovery")).not.toBeInTheDocument();
  });

  it("cancels a stale recovery timer across carousel and work steps", () => {
    installMatchMedia({ desktop: false });
    renderGallery();
    vi.useFakeTimers();
    const first = getCatalog("en")[0];

    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = screen.getByRole("dialog");
    act(() => vi.advanceTimersByTime(14999));

    fireEvent.click(within(dialog).getByRole("button", { name: "Next image" }));
    act(() => vi.advanceTimersByTime(14999));
    expect(within(dialog).queryByRole("button", { name: "Try again" }))
      .not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Next work" }));
    act(() => vi.advanceTimersByTime(1));
    expect(within(dialog).queryByRole("button", { name: "Try again" }))
      .not.toBeInTheDocument();
    expect(dialog.querySelector("[data-stay-phase='availability']"))
      .toHaveAttribute("data-stay-state", "resolved");

    act(() => vi.advanceTimersByTime(14999));
    expect(within(dialog).getByRole("button", { name: "Try again" }))
      .toBeInTheDocument();
  });

  it.each([
    ["en", "/gallery.html?art=born-of-burn", "USD 200"],
    [
      "en",
      "/gallery.html?art=july-pines",
      "This work is held in a private collection.",
    ],
    [
      "uk",
      "/uk/gallery.html?art=july-pines",
      "Робота у приватній колекції.",
    ],
  ])("keeps hydrated %s commercial context in the artwork record", async (
    locale,
    path,
    expected,
  ) => {
    installMatchMedia({ desktop: false });
    window.history.replaceState({}, "", path);
    renderGallery(locale);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(expected)).toBeInTheDocument();
  });

  it("resets carousel, narrative scroll, and a held gesture atomically when stepping works", async () => {
    renderGallery();
    const [first, second] = getCatalog("en");
    const firstSecondary = first.images.find((image) => image !== first.streamPrimary);
    const secondSecondary = second.images.find((image) => image !== second.streamPrimary);

    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Next image" }));
    const image = dialog.querySelector(".artwork-dialog__visual img");
    expect(image).toHaveAttribute("src", firstSecondary);

    const sourceMutations = [];
    const sourceObserver = new MutationObserver((records) => sourceMutations.push(...records));
    sourceObserver.observe(image, {
      attributes: true,
      attributeFilter: ["src"],
      attributeOldValue: true,
    });

    const gestureSurface = dialog.querySelector(".artwork-dialog__gesture-surface");
    gestureSurface.setPointerCapture = vi.fn();
    gestureSurface.hasPointerCapture = vi.fn(() => true);
    gestureSurface.releasePointerCapture = vi.fn();
    fireEvent(gestureSurface, pointerEvent("pointerdown", 41, true, {
      clientX: 260,
      clientY: 120,
    }));

    const record = dialog.querySelector(".artwork-dialog__record");
    Object.defineProperty(record, "scrollTop", {
      configurable: true,
      writable: true,
      value: 420,
    });
    const nextWork = within(dialog).getByRole("button", { name: "Next work" });
    nextWork.focus();
    fireEvent.click(nextWork);

    await waitFor(() => expect(within(dialog).getByRole("heading", { name: second.name }))
      .toBeInTheDocument());
    await Promise.resolve();
    sourceMutations.push(...sourceObserver.takeRecords());
    sourceObserver.disconnect();

    const nextRecord = dialog.querySelector(".artwork-dialog__record");
    expect(nextRecord).not.toBe(record);
    expect(nextRecord.scrollTop).toBe(0);
    expect(nextWork).toHaveFocus();
    expect(nextWork.isConnected).toBe(true);
    expect(dialog.querySelector(".artwork-dialog__visual img"))
      .toHaveAttribute("src", second.streamPrimary);
    expect(sourceMutations.map(({ oldValue }) => oldValue))
      .not.toContain(secondSecondary);
    expect(gestureSurface.releasePointerCapture).toHaveBeenCalledWith(41);

    fireEvent(
      dialog.querySelector(".artwork-dialog__gesture-surface"),
      pointerEvent("pointerup", 41, true, { clientX: 80, clientY: 120 }),
    );
    expect(dialog.querySelector(".artwork-dialog__visual img"))
      .toHaveAttribute("src", second.streamPrimary);
    expect(within(dialog).getByText(/01 \//)).toBeInTheDocument();
  });

  it("keeps visible Ukrainian work-step labels inside their accessible names", async () => {
    installMatchMedia({ desktop: false });
    window.history.replaceState({}, "", "/uk/gallery.html");
    renderGallery("uk");
    const first = getCatalog("uk")[0];
    expect(document.getElementById(`artwork-open-${first.id}`))
      .toHaveAccessibleName(`${first.name} Доступна Переглянути`);

    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = await screen.findByRole("dialog");
    const previous = within(dialog).getByRole("button", {
      name: "Назад до попередньої роботи",
    });
    const next = within(dialog).getByRole("button", {
      name: "Далі до наступної роботи",
    });

    expect(previous).toHaveTextContent("Назад");
    expect(next).toHaveTextContent("Далі");
    expect(within(dialog).getByText("Робота")).toBeInTheDocument();
  });

  it("returns focus and scroll to the visible archive record after stepping works", async () => {
    installMatchMedia({ desktop: false });
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    renderGallery();
    const [first, second] = getCatalog("en");

    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Next work" }));
    await waitFor(() => expect(within(dialog).getByRole("heading", { name: second.name }))
      .toBeInTheDocument());

    const secondOpener = document.getElementById(`artwork-open-${second.id}`);
    const focusOpener = vi.spyOn(secondOpener, "focus");
    window.history.replaceState({}, "", "/gallery.html");
    fireEvent(window, new PopStateEvent("popstate", { state: {} }));

    await waitFor(() => expect(secondOpener).toHaveFocus());
    expect(focusOpener).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "instant" });
    expect(focusOpener.mock.invocationCallOrder[0])
      .toBeLessThan(scrollIntoView.mock.invocationCallOrder[0]);
  });

  it("cancels stale close-focus restoration when the same work reopens immediately", async () => {
    installMatchMedia({ desktop: false });
    renderGallery();
    const first = getCatalog("en")[0];
    const opener = document.getElementById(`artwork-open-${first.id}`);
    const focusOpener = vi.spyOn(opener, "focus");
    const scrollIntoView = vi.fn();
    Object.defineProperty(opener, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    fireEvent.click(opener);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    window.history.replaceState({}, "", "/gallery.html");
    fireEvent(window, new PopStateEvent("popstate", { state: {} }));
    fireEvent.click(opener);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(focusOpener).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("returns a direct-link close to the matching mobile archive record", async () => {
    installMatchMedia({ desktop: false });
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    window.history.replaceState({}, "", "/gallery.html?art=july-pines");
    renderGallery();

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    const opener = document.getElementById("artwork-open-july-pines");
    await waitFor(() => expect(opener).toHaveFocus());
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "instant" });
    expect(new URL(window.location.href).searchParams.has("art")).toBe(false);
  });

  it("keeps a stepped direct link unowned so Close stays in the Gallery", async () => {
    installMatchMedia({ desktop: false });
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    const [first, second] = getCatalog("en");
    const retainedState = { retained: "proof" };
    window.history.replaceState(
      retainedState,
      "",
      `/gallery.html?art=${first.id}#artwork-details-${first.id}`,
    );
    const back = vi.spyOn(window.history, "back");
    renderGallery();

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Next work" }));
    await waitFor(() => expect(within(dialog).getByRole("heading", { name: second.name }))
      .toBeInTheDocument());
    expect(window.history.state).toEqual(retainedState);

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    const secondOpener = document.getElementById(`artwork-open-${second.id}`);
    await waitFor(() => expect(secondOpener).toHaveFocus());
    expect(back).not.toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "instant" });
    expect(new URL(window.location.href).searchParams.has("art")).toBe(false);
    expect(new URL(window.location.href).hash).toBe("");
    expect(window.history.state).toEqual(retainedState);
  });

  it("does not silently step outside an incompatible deep-link filter", async () => {
    installMatchMedia({ desktop: false });
    const collected = getCatalog("en").find(({ sold }) => sold);
    window.history.replaceState(
      {},
      "",
      `/gallery.html?availability=available&art=${collected.id}`,
    );
    renderGallery();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Next work" }))
      .not.toBeInTheDocument();
    expect(document.querySelector(".gallery-archive")
      .querySelectorAll(".gallery-index-work")).toHaveLength(19);
  });

  it("does not hand an active selection to the next work while touch scrolling is still held", async () => {
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    renderGallery();
    const [first, second] = archiveArticles();
    const firstMaterials = first.querySelector("[data-stay-phase='materials']");
    const secondMaterials = second.querySelector("[data-stay-phase='materials']");
    const observer = IntersectionObserverStub.instances[0];

    expect(first).toHaveAttribute("data-gallery-active", "true");
    fireEvent(second, pointerEvent("pointerdown", 71));
    fireEvent.scroll(window);
    observer.trigger([{
      isIntersecting: true,
      target: second,
      boundingClientRect: { top: 300, height: 400 },
    }]);
    await Promise.resolve();

    expect(first).toHaveAttribute("data-gallery-active", "true");
    expect(second).toHaveAttribute("data-gallery-active", "false");
    expect(secondMaterials).toHaveAttribute("data-stay-state", "pending");

    fireEvent(second, pointerEvent("pointerup", 71));
    await Promise.resolve();
    expect(first).toHaveAttribute("data-gallery-active", "true");
    expect(firstMaterials).toHaveAttribute("data-stay-state", "pending");

    fireEvent(document, new Event("scrollend", { bubbles: true }));
    await waitFor(() => expect(
      [...archiveArticles()]
        .filter((article) => article.dataset.galleryActive === "true")
        .map((article) => article.dataset.artworkId),
    ).toEqual([second.dataset.artworkId]));
    expect(first).toHaveAttribute("data-gallery-active", "false");
  });

  it.each([
    ["hands lost Retry focus to the new active work", false],
    ["preserves focus that moved to a connected filter", true],
  ])("%s", async (_label, moveFocusBeforeCommit) => {
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    renderGallery();
    const [first, second] = archiveArticles();
    const observer = IntersectionObserverStub.instances[0];
    fireEvent.error(first.querySelector("[data-stay-phase='artwork'] img"));
    const retry = within(first).getByRole("button", { name: "Try again" });
    retry.focus();
    expect(retry).toHaveFocus();

    let retainedFocus = null;
    if (moveFocusBeforeCommit) {
      retainedFocus = within(
        screen.getByRole("group", { name: "Filter by availability" }),
      ).getByRole("button", { name: /^All/ });
      retainedFocus.focus();
      expect(retainedFocus).toHaveFocus();
    }

    fireEvent.scroll(window);
    observer.trigger([{
      isIntersecting: true,
      target: second,
      boundingClientRect: { top: 300, height: 400 },
    }]);
    fireEvent(document, new Event("scrollend", { bubbles: true }));

    await waitFor(() => expect(second).toHaveAttribute("data-gallery-active", "true"));
    expect(retry).not.toBeInTheDocument();
    if (retainedFocus) {
      expect(retainedFocus).toHaveFocus();
    } else {
      expect(document.getElementById(`artwork-open-${second.dataset.artworkId}`))
        .toHaveFocus();
      expect(document.activeElement).not.toBe(document.body);
    }
  });

  it("waits for every finger before committing a mobile selection", async () => {
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    renderGallery();
    const [first, second] = archiveArticles();
    const observer = IntersectionObserverStub.instances[0];

    fireEvent(second, pointerEvent("pointerdown", 71, true));
    fireEvent(second, pointerEvent("pointerdown", 72, false));
    fireEvent.scroll(window);
    observer.trigger([{
      isIntersecting: true,
      target: second,
      boundingClientRect: { top: 300, height: 400 },
    }]);
    fireEvent(second, pointerEvent("pointerup", 71, true));
    fireEvent(document, new Event("scrollend", { bubbles: true }));
    await Promise.resolve();

    expect(first).toHaveAttribute("data-gallery-active", "true");
    expect(second).toHaveAttribute("data-gallery-active", "false");

    fireEvent(second, pointerEvent("pointerup", 72, false));
    await waitFor(() => expect(second).toHaveAttribute("data-gallery-active", "true"));
    expect(first).toHaveAttribute("data-gallery-active", "false");
  });

  it("does not treat native scrollend as physical release after pointer cancellation", async () => {
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    renderGallery();
    const [first, second] = archiveArticles();
    const observer = IntersectionObserverStub.instances[0];

    fireEvent(second, pointerEvent("pointerdown", 79));
    fireEvent.scroll(window);
    observer.trigger([{
      isIntersecting: true,
      target: second,
      boundingClientRect: { top: 300, height: 400 },
    }]);
    fireEvent(second, pointerEvent("pointercancel", 79));
    fireEvent(document, new Event("scrollend", { bubbles: true }));
    await Promise.resolve();

    expect(first).toHaveAttribute("data-gallery-active", "true");
    expect(second).toHaveAttribute("data-gallery-active", "false");

    fireEvent(document, physicalTouchTerminal());
    await waitFor(() => expect(second).toHaveAttribute("data-gallery-active", "true"));
    expect(first).toHaveAttribute("data-gallery-active", "false");
  });

  it("keeps a canceled scrolling pointer owned until physical touch release on legacy Safari", async () => {
    expect(window.onscrollend).toBeUndefined();
    expect(document.onscrollend).toBeUndefined();
    renderGallery();
    const [first, second] = archiveArticles();
    const observer = IntersectionObserverStub.instances[0];

    fireEvent(second, pointerEvent("pointerdown", 81));
    fireEvent.scroll(window);
    observer.trigger([{
      isIntersecting: true,
      target: second,
      boundingClientRect: { top: 300, height: 400 },
    }]);
    fireEvent(second, pointerEvent("pointercancel", 81));

    await new Promise((resolve) => window.setTimeout(resolve, 30));
    expect(first).toHaveAttribute("data-gallery-active", "true");
    expect(second).toHaveAttribute("data-gallery-active", "false");

    fireEvent(document, physicalTouchTerminal());
    await waitFor(() => expect(second).toHaveAttribute("data-gallery-active", "true"));
    expect(first).toHaveAttribute("data-gallery-active", "false");
  });

  it("releases a terminal touchcancel after legacy stillness without waiting for touchend", async () => {
    renderGallery();
    const [first, second] = archiveArticles();
    const observer = IntersectionObserverStub.instances[0];

    fireEvent(second, pointerEvent("pointerdown", 82));
    fireEvent.scroll(window);
    observer.trigger([{
      isIntersecting: true,
      target: second,
      boundingClientRect: { top: 300, height: 400 },
    }]);
    fireEvent(second, pointerEvent("pointercancel", 82));
    fireEvent(document, physicalTouchTerminal("touchcancel"));

    await waitFor(() => expect(second).toHaveAttribute("data-gallery-active", "true"));
    expect(first).toHaveAttribute("data-gallery-active", "false");
  });

  it("does not replace a filtered-out active work until the held contact ends", async () => {
    renderGallery();
    const first = archiveArticles()[0];
    const firstArtwork = getCatalog("en")[0];
    const nextAvailability = firstArtwork.sold ? "Available" : "Collected";

    fireEvent(first, pointerEvent("pointerdown", 93));
    fireEvent.click(within(
      screen.getByRole("group", { name: "Filter by availability" }),
    ).getByRole("button", { name: new RegExp(nextAvailability) }));
    await waitFor(() => expect(document.body).not.toContainElement(first));

    expect([...archiveArticles()].filter(
      (article) => article.dataset.galleryActive === "true",
    )).toHaveLength(0);

    fireEvent(document, pointerEvent("pointerup", 93));
    await waitFor(() => expect([...archiveArticles()].filter(
      (article) => article.dataset.galleryActive === "true",
    )).toHaveLength(1));
  });

  it("ignores queued IntersectionObserver entries for a work removed by filtering", async () => {
    renderGallery();
    const staleFirst = archiveArticles()[0];
    const staleId = staleFirst.dataset.artworkId;
    const firstArtwork = getCatalog("en")[0];
    const nextAvailability = firstArtwork.sold ? "Available" : "Collected";
    const observer = IntersectionObserverStub.instances[0];

    fireEvent.click(within(
      screen.getByRole("group", { name: "Filter by availability" }),
    ).getByRole("button", { name: new RegExp(nextAvailability) }));
    await waitFor(() => expect(document.body).not.toContainElement(staleFirst));

    observer.trigger([{
      isIntersecting: true,
      target: staleFirst,
      boundingClientRect: { top: 300, height: 400 },
    }]);
    await Promise.resolve();

    const currentArticles = [...archiveArticles()];
    const activeArticles = currentArticles.filter(
      (article) => article.dataset.galleryActive === "true",
    );
    expect(activeArticles).toHaveLength(1);
    expect(activeArticles[0].dataset.artworkId).not.toBe(staleId);
  });

  it("ignores descendant scrollers when deciding whether the artwork stream has stopped", async () => {
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    renderGallery();
    const [first, second] = archiveArticles();
    const observer = IntersectionObserverStub.instances[0];
    const collectionFilters = screen.getByRole("group", { name: "Filter by collection" });
    const firstReveal = first.querySelector("[data-stay-reveal-control]");

    expect(first).toHaveAttribute("data-gallery-active", "true");
    fireEvent.load(first.querySelector("[data-stay-phase='artwork'] img"));
    fireEvent.click(firstReveal);
    await waitFor(() => expect(
      first.querySelector("[data-stay-phase='availability']"),
    ).toHaveAttribute("data-stay-state", "resolved"));
    fireEvent.scroll(collectionFilters);
    observer.trigger([{
      isIntersecting: true,
      target: second,
      boundingClientRect: { top: 300, height: 400 },
    }]);

    await waitFor(() => expect(second).toHaveAttribute("data-gallery-active", "true"));
    expect(first).toHaveAttribute("data-gallery-active", "false");
  });

  it("releases a lost mobile contact on window blur so selection cannot remain frozen", async () => {
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    renderGallery();
    const [first, second] = archiveArticles();
    const observer = IntersectionObserverStub.instances[0];

    fireEvent(second, pointerEvent("pointerdown", 88));
    fireEvent.scroll(window);
    observer.trigger([{
      isIntersecting: true,
      target: second,
      boundingClientRect: { top: 300, height: 400 },
    }]);
    fireEvent(document, new Event("scrollend", { bubbles: true }));
    await Promise.resolve();
    expect(first).toHaveAttribute("data-gallery-active", "true");

    fireEvent.blur(window);
    await waitFor(() => expect(second).toHaveAttribute("data-gallery-active", "true"));
    expect(first).toHaveAttribute("data-gallery-active", "false");
  });

  it("opens exactly one modal from canonical and legacy deep links", async () => {
    window.history.replaceState({}, "", "/gallery.html?art=july-pines");
    const firstRender = renderGallery();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(new URL(window.location.href).searchParams.get("art")).toBe("july-pines");

    firstRender.unmount();
    window.history.replaceState({}, "", "/gallery.html?artwork=artwork-july-pines");
    renderGallery();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    const normalizedUrl = new URL(window.location.href);
    expect(normalizedUrl.searchParams.get("art")).toBe("july-pines");
    expect(normalizedUrl.searchParams.has("artwork")).toBe(false);
  });

  it("hands a hash-selected progressive detail into the modal during hydration", async () => {
    const retainedState = { retained: "progressive-selection" };
    window.history.replaceState(
      retainedState,
      "",
      "/gallery.html#artwork-details-born-of-burn",
    );
    const pushState = vi.spyOn(window.history, "pushState");
    const page = () => (
      <SiteProvider initialLocale="en">
        <GalleryPage />
      </SiteProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(page());
    document.body.append(container);

    expect(container.querySelector("#artwork-details-born-of-burn")).toBeInTheDocument();
    expect(container.querySelector(".gallery-mobile-index")).toBeInTheDocument();
    const pendingArchive = container.querySelector(".gallery-archive__pending");
    expect(pendingArchive).toBeInTheDocument();
    expect(container.querySelector(".gallery-stream")).not.toBeInTheDocument();
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();

    let root;
    const onRecoverableError = vi.fn();
    await act(async () => {
      root = hydrateRoot(container, page(), { onRecoverableError });
      await Promise.resolve();
    });

    const dialog = await screen.findByRole("dialog");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(within(dialog).getByRole("heading", { name: "Born Of Burn" }))
      .toBeInTheDocument();
    await waitFor(() => expect(container.querySelector(".gallery-stream")).toBeInTheDocument());
    expect(pendingArchive.isConnected).toBe(true);
    expect(container.querySelector(".gallery-progressive-details")).not.toBeInTheDocument();
    const normalizedUrl = new URL(window.location.href);
    expect(normalizedUrl.searchParams.get("art")).toBe("born-of-burn");
    expect(normalizedUrl.hash).toBe("");
    expect(window.history.state).toEqual(retainedState);
    expect(pushState).not.toHaveBeenCalled();
    expect(onRecoverableError).not.toHaveBeenCalled();

    await act(async () => root.unmount());
    container.remove();
  });

  it("moves a deep-linked modal from mobile force-resolution into desktop enhancement", async () => {
    const media = installControllableMatchMedia({ desktop: false });
    window.history.replaceState({}, "", "/gallery.html?art=born-of-burn");
    renderGallery();

    const dialog = await screen.findByRole("dialog");
    const originalDialog = dialog;
    const image = dialog.querySelector(".artwork-dialog__visual img");
    const materials = dialog.querySelector("[data-stay-phase='materials']");
    expect(image).toHaveAttribute("data-stay-image-state", "pending");
    expect(dialog).toHaveAttribute("data-stay-fully-revealed", "true");
    expect(materials).toHaveAttribute("data-stay-state", "resolved");
    expect(materials).not.toHaveAttribute("inert");

    act(() => media.setDesktop(true));

    await waitFor(() => expect(document.querySelector(".gallery-stream")).toBeInTheDocument());
    expect(screen.getByRole("dialog")).toBe(originalDialog);
    expect(new URL(window.location.href).searchParams.get("art")).toBe("born-of-burn");
    await waitFor(() => expect(dialog).toHaveAttribute("data-stay-fully-revealed", "false"));
    expect(materials).toHaveAttribute("data-stay-state", "pending");
    expect(materials).toHaveAttribute("inert");

    fireEvent.load(image);
    await waitFor(() => expect(materials).toHaveAttribute("data-stay-state", "resolved"));
    expect(dialog).toHaveAttribute("data-stay-fully-revealed", "true");
  });

  it("auto-settles art-first, keeps carousel focus, captures pointer swipe, and resets every frame", async () => {
    const artwork = getCatalog("en").find(({ id }) => id === "born-of-burn");
    window.history.replaceState({}, "", "/gallery.html?art=born-of-burn");
    renderGallery();

    const dialog = await screen.findByRole("dialog");
    let image = dialog.querySelector(".artwork-dialog__visual img");
    const materials = dialog.querySelector("[data-stay-phase='materials']");
    expect(image.getAttribute("src")).toBe(artwork.streamPrimary);
    expect(materials).toHaveAttribute("data-stay-state", "pending");

    fireEvent.load(image);
    await waitFor(() => expect(materials).toHaveAttribute("data-stay-state", "resolved"));
    expect(dialog.querySelector("[data-stay-phase='availability']"))
      .toHaveAttribute("data-stay-state", "resolved");
    expect(dialog).toHaveAttribute("data-stay-fully-revealed", "true");

    const scrollLayer = dialog.closest(".artwork-dialog-layer");
    Object.defineProperty(scrollLayer, "onscrollend", { configurable: true, value: null });
    fireEvent.scroll(scrollLayer);
    expect(materials).toHaveAttribute("data-stay-state", "pending");
    scrollLayer.dispatchEvent(new Event("scrollend", { bubbles: true }));
    await waitFor(() => expect(materials).toHaveAttribute("data-stay-state", "resolved"));

    const nextButton = within(dialog).getByRole("button", { name: "Next image" });
    nextButton.focus();
    fireEvent.click(nextButton);
    image = dialog.querySelector(".artwork-dialog__visual img");
    expect(image.getAttribute("src")).toBe(artwork.images[0]);
    expect(document.activeElement).toBe(nextButton);
    expect(nextButton.isConnected).toBe(true);
    expect(materials).toHaveAttribute("data-stay-state", "pending");
    expect(materials).toHaveAttribute("inert");
    fireEvent.load(image);
    await waitFor(() => expect(materials).toHaveAttribute("data-stay-state", "resolved"));

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(dialog.querySelector(".artwork-dialog__visual img").getAttribute("src"))
      .toBe(artwork.images[0]);

    const gestureSurface = dialog.querySelector(".artwork-dialog__gesture-surface");
    gestureSurface.setPointerCapture = vi.fn();
    gestureSurface.hasPointerCapture = vi.fn(() => true);
    gestureSurface.releasePointerCapture = vi.fn();
    fireEvent(gestureSurface, pointerEvent("pointerdown", 4, true, {
      clientX: 260,
      clientY: 120,
    }));
    fireEvent(gestureSurface, pointerEvent("pointerdown", 5, false, {
      clientX: 20,
      clientY: 120,
    }));
    fireEvent(gestureSurface, pointerEvent("pointerup", 5, false, {
      clientX: 300,
      clientY: 120,
    }));
    expect(dialog.querySelector(".artwork-dialog__visual img").getAttribute("src"))
      .toBe(artwork.images[0]);
    fireEvent(gestureSurface, pointerEvent("pointerup", 4, true, {
      clientX: 100,
      clientY: 126,
    }));
    expect(gestureSurface.setPointerCapture).toHaveBeenCalledWith(4);
    expect(gestureSurface.setPointerCapture).toHaveBeenCalledTimes(1);
    expect(gestureSurface.releasePointerCapture).toHaveBeenCalledWith(4);
    expect(dialog.querySelector(".artwork-dialog__visual img").getAttribute("src"))
      .toBe(artwork.images[1]);
  });
});
