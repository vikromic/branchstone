// @vitest-environment jsdom

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
import { SiteProvider } from "../../src/app/SiteContext.jsx";
import { getCatalog } from "../../src/content/artworks.js";
import { GalleryPage } from "../../src/pages/GalleryPage.jsx";
import { installLocalStorage, pointerEvent } from "../support/dom.js";

vi.mock("../../src/app/shell/SiteShell.jsx", () => ({
  SiteShell: ({ children }) => <main data-testid="site-shell">{children}</main>,
}));

function galleryPage(locale = "en") {
  return (
    <SiteProvider initialLocale={locale}>
      <GalleryPage />
    </SiteProvider>
  );
}

function renderGallery(locale = "en") {
  return render(galleryPage(locale));
}

// The archive stays in the DOM while a dialog hides it from assistive technology.
function archiveItems() {
  return document.querySelector(".works-archive").querySelectorAll(".works-grid__item");
}

function dialogImage(dialog) {
  return dialog.querySelector(".artwork-surface img");
}

function filterGroup(name) {
  return screen.getByRole("group", { name });
}

// Server-render, attach, and hydrate the page the way the browser receives it.
async function hydrateGallery() {
  const container = document.createElement("div");
  container.innerHTML = renderToString(galleryPage());
  document.body.append(container);
  const onRecoverableError = vi.fn();
  return { container, onRecoverableError, hydrate: async () => {
    let root;
    await act(async () => {
      root = hydrateRoot(container, galleryPage(), { onRecoverableError });
      await Promise.resolve();
    });
    return root;
  } };
}

describe("Works page", () => {
  beforeEach(() => {
    installLocalStorage();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/gallery.html");
    document.body.dataset.page = "gallery";
    vi.stubGlobal("PointerEvent", Event);
    vi.stubGlobal("matchMedia", vi.fn((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    vi.stubGlobal("requestAnimationFrame", (callback) => window.setTimeout(() => callback(0), 0));
    vi.stubGlobal("cancelAnimationFrame", (id) => window.clearTimeout(id));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.hydrated;
    document.body.className = "";
  });

  it("filters the grid and keeps availability and collection state in the URL", async () => {
    renderGallery();
    expect(archiveItems()).toHaveLength(32);

    const availability = filterGroup("Filter by availability");
    fireEvent.click(within(availability).getByRole("button", { name: /Available/ }));
    await waitFor(() => expect(archiveItems()).toHaveLength(19));
    expect(new URL(window.location.href).searchParams.get("availability")).toBe("available");

    fireEvent.click(within(availability).getByRole("button", { name: /Collected/ }));
    await waitFor(() => expect(archiveItems()).toHaveLength(13));
    expect(new URL(window.location.href).searchParams.get("availability")).toBe("collected");

    fireEvent.click(within(availability).getByRole("button", { name: /All/ }));
    expect(new URL(window.location.href).searchParams.has("availability")).toBe(false);
    fireEvent.click(within(filterGroup("Filter by collection")).getByRole("button", { name: "Golden" }));
    await waitFor(() => expect(archiveItems()).toHaveLength(4));
    expect(new URL(window.location.href).searchParams.get("collection")).toBe("golden");

    const goldenWorks = getCatalog("en").filter(({ collectionId }) => collectionId === "golden");
    expect(within(availability).getByRole("button", { name: /Available/ }))
      .toHaveTextContent(String(goldenWorks.filter(({ sold }) => !sold).length));
    expect([...screen.getByLabelText("Archive status").querySelectorAll("dd")].map(({ textContent }) => textContent))
      .toEqual(["32", "19", "13"]);
  });

  it("keeps SSR filters disabled until hydration applies canonical URL state", async () => {
    window.history.replaceState({}, "", "/gallery.html?collection=deep-ocean&availability=collected");
    const { container, onRecoverableError, hydrate } = await hydrateGallery();
    const filters = [...container.querySelectorAll(".works-controls button")];

    expect(filters).not.toHaveLength(0);
    expect(filters.every((button) => button.disabled)).toBe(true);
    expect(container.querySelectorAll(".works-grid__link")).toHaveLength(32);
    expect(container.querySelectorAll(".gallery-progressive-detail")).toHaveLength(32);

    const root = await hydrate();
    try {
      await waitFor(() => expect(filters.every((button) => !button.disabled)).toBe(true));
      expect(container.querySelector('[aria-pressed="true"]')).toHaveTextContent("Collected");
      expect(container.querySelectorAll(".works-grid__item")).toHaveLength(4);
      expect(container.querySelector(".gallery-progressive-details")).not.toBeInTheDocument();
      expect(container.querySelector(".works-grid__link")).toHaveAttribute("aria-haspopup", "dialog");
      expect(onRecoverableError).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it.each([
    ["en", "/gallery.html", "Image temporarily unavailable", "Born Of Burn Available 2025"],
    ["uk", "/uk/gallery.html", "Зображення тимчасово недоступне", "Народженне з Попілу Доступна 2025"],
  ])("keeps a failed %s preview visible, localized, and actionable", (locale, path, unavailableLabel, accessibleName) => {
    window.history.replaceState({}, "", path);
    renderGallery(locale);

    const firstLink = document.getElementById("artwork-open-born-of-burn");
    fireEvent.error(firstLink.querySelector("img"));

    expect(within(firstLink).getByText(unavailableLabel)).toBeVisible();
    expect(firstLink.querySelector(".works-grid__frame")).toHaveAttribute("data-preview-error", "true");
    expect(firstLink).toHaveAccessibleName(accessibleName);

    fireEvent.click(firstLink);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("uses locale-correct singular and plural result counts", async () => {
    window.history.replaceState({}, "", "/uk/gallery.html");
    renderGallery("uk");
    const collection = filterGroup("Фільтр за колекцією");
    const availability = filterGroup("Фільтр за доступністю");

    expect(screen.getByText("32 роботи")).toBeInTheDocument();
    fireEvent.click(within(collection).getByRole("button", { name: "Магніт" }));
    await waitFor(() => expect(screen.getByText("01 робота")).toBeInTheDocument());

    fireEvent.click(within(collection).getByRole("button", { name: "Про Попіл і Квіти" }));
    fireEvent.click(within(availability).getByRole("button", { name: /У колекції/ }));
    await waitFor(() => expect(screen.getByText("02 роботи")).toBeInTheDocument());

    fireEvent.click(within(availability).getByRole("button", { name: /Усі/ }));
    fireEvent.click(within(collection).getByRole("button", { name: "Велика Вода" }));
    await waitFor(() => expect(screen.getByText("05 робіт")).toBeInTheDocument());
  });

  it("opens details in place, steps between works, and saves a work", async () => {
    renderGallery();
    const [first, second] = getCatalog("en");
    const pushState = vi.spyOn(window.history, "pushState");
    const firstOpener = document.getElementById(`artwork-open-${first.id}`);

    fireEvent.click(firstOpener);
    fireEvent.click(firstOpener);
    expect(pushState).toHaveBeenCalledTimes(1);
    const dialog = await screen.findByRole("dialog");
    expect(new URL(window.location.href).searchParams.get("art")).toBe(first.id);
    expect(within(dialog).getByText("Ponderosa pine, burned wood pieces, acrylic on canvas")).toBeInTheDocument();

    const save = within(dialog).getByRole("button", { name: `Save work: ${first.name}` });
    fireEvent.click(save);
    await waitFor(() => expect(save).toHaveAttribute("aria-pressed", "true"));
    expect(JSON.parse(window.localStorage.getItem("branchstone_favorites"))).toEqual([`artwork-${first.id}`]);

    fireEvent.click(within(dialog).getByRole("button", { name: "Next work" }));
    await waitFor(() => expect(within(dialog).getByRole("heading", { name: second.name })).toBeInTheDocument());
    expect(new URL(window.location.href).searchParams.get("art")).toBe(second.id);
    expect(within(dialog).getByText("02 / 32")).toBeInTheDocument();
    expect(within(dialog).getByText(`${second.name} — work 2 of 32`)).toBeInTheDocument();

    fireEvent.keyDown(within(dialog).getByRole("button", { name: "Next work" }), { key: "ArrowLeft" });
    await waitFor(() => expect(within(dialog).getByRole("heading", { name: first.name })).toBeInTheDocument());
  });

  it("switches modal locale without losing the open work or active filters", async () => {
    window.history.replaceState({}, "", "/gallery.html?collection=the-calm-of-the-forest&availability=collected");
    renderGallery();

    fireEvent.click(document.getElementById("artwork-open-july-pines"));
    const dialog = await screen.findByRole("dialog");
    const localeLink = within(dialog).getByRole("link", { name: /Switch to Ukrainian/ });
    const destination = new URL(localeLink.href);

    expect(destination.pathname).toBe("/uk/gallery.html");
    expect(destination.searchParams.get("collection")).toBe("the-calm-of-the-forest");
    expect(destination.searchParams.get("availability")).toBe("collected");
    expect(destination.searchParams.get("art")).toBe("july-pines");
    expect(localeLink).toHaveTextContent("УКР");
  });

  it("announces only an image wait that crosses the delay threshold", () => {
    renderGallery();
    const [first, second] = getCatalog("en");

    vi.useFakeTimers();
    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = screen.getByRole("dialog");
    act(() => vi.advanceTimersByTime(300));
    fireEvent.load(dialogImage(dialog));
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

    fireEvent.load(dialogImage(dialog));
    expect(status).toHaveTextContent("Image ready");
  });

  it("offers recovery only after a genuine long wait and accepts a later native load", () => {
    renderGallery();
    vi.useFakeTimers();
    fireEvent.click(document.getElementById(`artwork-open-${getCatalog("en")[0].id}`));
    const dialog = screen.getByRole("dialog");
    const surface = dialog.querySelector(".artwork-surface");

    act(() => vi.advanceTimersByTime(14999));
    expect(within(dialog).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(surface).toHaveAttribute("data-image-state", "pending");
    expect(within(dialog).getByRole("heading", { level: 2 })).toBeVisible();

    act(() => vi.advanceTimersByTime(1));
    expect(within(dialog).getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(dialog.querySelector(".artwork-surface__recovery p")).toHaveTextContent(
      "This image is taking longer than expected. You can keep waiting or try again.",
    );

    fireEvent.load(dialogImage(dialog));
    expect(within(dialog).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(surface).toHaveAttribute("data-image-state", "ready");
  });

  it.each([
    ["en", "/gallery.html", "Image temporarily unavailable", "Try again", "Trying the image again…", "Previous image"],
    ["uk", "/uk/gallery.html", "Зображення тимчасово недоступне", "Спробувати ще раз", "Пробуємо завантажити зображення ще раз…", "Попереднє зображення"],
  ])("recovers a native image error with one consistent %s status", async (
    locale,
    path,
    unavailableLabel,
    retryLabel,
    retryingLabel,
    previousImageLabel,
  ) => {
    window.history.replaceState({}, "", path);
    renderGallery(locale);
    fireEvent.click(document.getElementById(`artwork-open-${getCatalog(locale)[0].id}`));
    const dialog = screen.getByRole("dialog");
    const oldImage = dialogImage(dialog);
    Object.defineProperty(oldImage, "currentSrc", {
      configurable: true,
      value: "https://images.branchstone.test/stalled.webp",
    });

    fireEvent.error(oldImage);
    expect(dialog.querySelector(".artwork-surface__recovery p")).toHaveTextContent(unavailableLabel);
    expect(within(dialog).getByRole("status")).toHaveTextContent(unavailableLabel);

    const retry = within(dialog).getByRole("button", { name: retryLabel });
    retry.focus();
    fireEvent.click(retry);
    const retriedImage = dialogImage(dialog);
    expect(retriedImage).not.toBe(oldImage);
    expect(retriedImage.src).toContain("images.branchstone.test/stalled.webp");
    expect(retriedImage.src).toContain("branchstone-retry=");
    expect(retriedImage).not.toHaveAttribute("srcset");
    expect(within(dialog).getByRole("status")).toHaveTextContent(retryingLabel);
    expect(retry).toHaveFocus();
    expect(retry).toHaveAttribute("aria-disabled", "true");

    const previousImage = within(dialog).getByRole("button", { name: previousImageLabel });
    fireEvent.load(retriedImage);
    await act(async () => Promise.resolve());
    expect(previousImage).toHaveFocus();
    expect(dialog.querySelector(".artwork-surface")).toHaveAttribute("data-image-state", "ready");
    expect(dialog.querySelector(".artwork-surface__recovery")).not.toBeInTheDocument();
  });

  it("cancels a stale recovery timer across carousel and work steps", () => {
    renderGallery();
    vi.useFakeTimers();
    fireEvent.click(document.getElementById(`artwork-open-${getCatalog("en")[0].id}`));
    const dialog = screen.getByRole("dialog");
    act(() => vi.advanceTimersByTime(14999));

    fireEvent.click(within(dialog).getByRole("button", { name: "Next image" }));
    act(() => vi.advanceTimersByTime(14999));
    expect(within(dialog).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Next work" }));
    act(() => vi.advanceTimersByTime(1));
    expect(within(dialog).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(14999));
    expect(within(dialog).getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it.each([
    ["en", "/gallery.html?art=born-of-burn", "USD 200"],
    ["en", "/gallery.html?art=july-pines", "This work is held in a private collection."],
    ["uk", "/uk/gallery.html?art=july-pines", "Робота у приватній колекції."],
  ])("keeps %s commercial context in the artwork record", async (locale, path, expected) => {
    window.history.replaceState({}, "", path);
    renderGallery(locale);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(expected, { exact: false })).toBeInTheDocument();
  });

  it("resets carousel, record scroll, and a held gesture atomically when stepping works", async () => {
    renderGallery();
    const [first, second] = getCatalog("en");
    const firstSecondary = first.images.find((image) => image !== first.streamPrimary);
    const secondSecondary = second.images.find((image) => image !== second.streamPrimary);

    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Next image" }));
    const image = dialogImage(dialog);
    expect(image).toHaveAttribute("src", firstSecondary);

    const sourceMutations = [];
    const sourceObserver = new MutationObserver((records) => sourceMutations.push(...records));
    sourceObserver.observe(image, { attributes: true, attributeFilter: ["src"], attributeOldValue: true });

    const gestureSurface = dialog.querySelector(".artwork-dialog__gesture-surface");
    gestureSurface.setPointerCapture = vi.fn();
    gestureSurface.hasPointerCapture = vi.fn(() => true);
    gestureSurface.releasePointerCapture = vi.fn();
    fireEvent(gestureSurface, pointerEvent("pointerdown", 41, true, { clientX: 260, clientY: 120 }));

    const record = dialog.querySelector(".artwork-dialog__record");
    Object.defineProperty(record, "scrollTop", { configurable: true, writable: true, value: 420 });
    const nextWork = within(dialog).getByRole("button", { name: "Next work" });
    nextWork.focus();
    fireEvent.click(nextWork);

    await waitFor(() => expect(within(dialog).getByRole("heading", { name: second.name })).toBeInTheDocument());
    await Promise.resolve();
    sourceMutations.push(...sourceObserver.takeRecords());
    sourceObserver.disconnect();

    const nextRecord = dialog.querySelector(".artwork-dialog__record");
    expect(nextRecord).not.toBe(record);
    expect(nextRecord.scrollTop).toBe(0);
    expect(within(dialog).getByRole("button", { name: "Next work" })).toHaveFocus();
    expect(dialogImage(dialog)).toHaveAttribute("src", second.streamPrimary);
    expect(sourceMutations.map(({ oldValue }) => oldValue)).not.toContain(secondSecondary);
    expect(gestureSurface.releasePointerCapture).toHaveBeenCalledWith(41);

    fireEvent(
      dialog.querySelector(".artwork-dialog__gesture-surface"),
      pointerEvent("pointerup", 41, true, { clientX: 80, clientY: 120 }),
    );
    expect(dialogImage(dialog)).toHaveAttribute("src", second.streamPrimary);
  });

  it("swipes the carousel with one captured pointer and ignores secondary pointers", async () => {
    const artwork = getCatalog("en").find(({ id }) => id === "born-of-burn");
    window.history.replaceState({}, "", "/gallery.html?art=born-of-burn");
    renderGallery();

    const dialog = await screen.findByRole("dialog");
    expect(dialogImage(dialog).getAttribute("src")).toBe(artwork.streamPrimary);

    const nextButton = within(dialog).getByRole("button", { name: "Next image" });
    nextButton.focus();
    fireEvent.click(nextButton);
    expect(dialogImage(dialog).getAttribute("src")).toBe(artwork.images[0]);
    expect(nextButton).toHaveFocus();

    const gestureSurface = dialog.querySelector(".artwork-dialog__gesture-surface");
    gestureSurface.setPointerCapture = vi.fn();
    gestureSurface.hasPointerCapture = vi.fn(() => true);
    gestureSurface.releasePointerCapture = vi.fn();
    fireEvent(gestureSurface, pointerEvent("pointerdown", 4, true, { clientX: 260, clientY: 120 }));
    fireEvent(gestureSurface, pointerEvent("pointerdown", 5, false, { clientX: 20, clientY: 120 }));
    fireEvent(gestureSurface, pointerEvent("pointerup", 5, false, { clientX: 300, clientY: 120 }));
    expect(dialogImage(dialog).getAttribute("src")).toBe(artwork.images[0]);
    fireEvent(gestureSurface, pointerEvent("pointerup", 4, true, { clientX: 100, clientY: 126 }));
    expect(gestureSurface.setPointerCapture).toHaveBeenCalledTimes(1);
    expect(gestureSurface.releasePointerCapture).toHaveBeenCalledWith(4);
    expect(dialogImage(dialog).getAttribute("src")).toBe(artwork.images[1]);
  });

  it("keeps visible Ukrainian work-step labels inside their accessible names", async () => {
    window.history.replaceState({}, "", "/uk/gallery.html");
    renderGallery("uk");
    fireEvent.click(document.getElementById(`artwork-open-${getCatalog("uk")[0].id}`));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "Назад до попередньої роботи" })).toHaveTextContent("Назад");
    expect(within(dialog).getByRole("button", { name: "Далі до наступної роботи" })).toHaveTextContent("Далі");
  });

  it("returns focus and scroll to the visible grid tile after stepping works", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    renderGallery();
    const [first, second] = getCatalog("en");

    fireEvent.click(document.getElementById(`artwork-open-${first.id}`));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Next work" }));
    await waitFor(() => expect(within(dialog).getByRole("heading", { name: second.name })).toBeInTheDocument());

    const secondOpener = document.getElementById(`artwork-open-${second.id}`);
    const focusOpener = vi.spyOn(secondOpener, "focus");
    window.history.replaceState({}, "", "/gallery.html");
    fireEvent(window, new PopStateEvent("popstate", { state: {} }));

    await waitFor(() => expect(secondOpener).toHaveFocus());
    expect(focusOpener).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "instant" });
  });

  it("cancels stale close-focus restoration when the same work reopens immediately", async () => {
    renderGallery();
    const opener = document.getElementById(`artwork-open-${getCatalog("en")[0].id}`);
    const focusOpener = vi.spyOn(opener, "focus");

    fireEvent.click(opener);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    window.history.replaceState({}, "", "/gallery.html");
    fireEvent(window, new PopStateEvent("popstate", { state: {} }));
    fireEvent.click(opener);

    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(focusOpener).not.toHaveBeenCalled();
  });

  it("keeps a stepped direct link unowned so Close stays in the Gallery", async () => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    const [first, second] = getCatalog("en");
    const retainedState = { retained: "proof" };
    window.history.replaceState(retainedState, "", `/gallery.html?art=${first.id}#artwork-details-${first.id}`);
    const back = vi.spyOn(window.history, "back");
    renderGallery();

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Next work" }));
    await waitFor(() => expect(within(dialog).getByRole("heading", { name: second.name })).toBeInTheDocument());
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    await waitFor(() => expect(document.getElementById(`artwork-open-${second.id}`)).toHaveFocus());
    expect(back).not.toHaveBeenCalled();
    const url = new URL(window.location.href);
    expect(url.searchParams.has("art")).toBe(false);
    expect(url.hash).toBe("");
    expect(window.history.state).toEqual(retainedState);
  });

  it("does not silently step outside an incompatible deep-link filter", async () => {
    const collected = getCatalog("en").find(({ sold }) => sold);
    window.history.replaceState({}, "", `/gallery.html?availability=available&art=${collected.id}`);
    renderGallery();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Next work" })).not.toBeInTheDocument();
    expect(archiveItems()).toHaveLength(19);
  });

  it("opens exactly one modal from canonical and legacy deep links", async () => {
    window.history.replaceState({}, "", "/gallery.html?art=july-pines");
    const firstRender = renderGallery();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    firstRender.unmount();
    window.history.replaceState({}, "", "/gallery.html?artwork=artwork-july-pines");
    renderGallery();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    const normalizedUrl = new URL(window.location.href);
    expect(normalizedUrl.searchParams.get("art")).toBe("july-pines");
    expect(normalizedUrl.searchParams.has("artwork")).toBe(false);
  });

  it("hands a hash-selected static detail into the modal during hydration", async () => {
    const retainedState = { retained: "progressive-selection" };
    window.history.replaceState(retainedState, "", "/gallery.html#artwork-details-born-of-burn");
    const pushState = vi.spyOn(window.history, "pushState");
    const { container, onRecoverableError, hydrate } = await hydrateGallery();

    expect(container.querySelector("#artwork-details-born-of-burn")).toBeInTheDocument();
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();

    const root = await hydrate();
    const dialog = await screen.findByRole("dialog");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(within(dialog).getByRole("heading", { name: "Born Of Burn" })).toBeInTheDocument();
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
});
