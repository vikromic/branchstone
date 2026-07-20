// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

function renderGallery() {
  return render(
    <SiteProvider initialLocale="en">
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
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("requestAnimationFrame", (callback) => window.setTimeout(() => callback(0), 0));
    vi.stubGlobal("cancelAnimationFrame", (id) => window.clearTimeout(id));
    Object.defineProperty(window, "onscrollend", { configurable: true, value: undefined });
    Object.defineProperty(document, "onscrollend", { configurable: true, value: undefined });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("stay-enhanced");
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
        String(goldenWorks.length),
        String(goldenWorks.filter(({ sold }) => !sold).length),
        String(goldenWorks.filter(({ sold }) => sold).length),
      ]);
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
