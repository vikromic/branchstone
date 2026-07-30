// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteProvider, useSite } from "../src/app/SiteContext.jsx";
import { SiteShell } from "../src/app/SiteShell.jsx";
import { getPageMetadata } from "../src/domain/metadata.js";
import { storageKeys } from "../src/domain/storage.js";

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

function LocaleProbe() {
  const { locale } = useSite();
  return <output data-testid="locale-probe">{locale}</output>;
}

function renderShell(page = "home") {
  return render(
    <SiteProvider initialLocale="en">
      <SiteShell page={page}>
        <p>Page content</p>
        <LocaleProbe />
      </SiteShell>
    </SiteProvider>,
  );
}

describe("shared site shell", () => {
  beforeEach(() => {
    installLocalStorage();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
    document.body.dataset.page = "home";
    delete document.documentElement.dataset.hydrated;
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.className = "";
    document.head.querySelectorAll("[data-test-metadata]").forEach((node) => node.remove());
    delete document.documentElement.dataset.hydrated;
  });

  it("makes all works a direct Gallery link while retaining a distinct index control", () => {
    const { container } = renderShell("home");

    expect(screen.getByRole("link", { name: "all works" })).toHaveAttribute("href", "/gallery.html");
    const primaryNavigation = container.querySelector(".primary-navigation");
    expect(within(primaryNavigation).getByRole("link", { name: "Works" })).toHaveAttribute("href", "/gallery.html");
    expect(within(primaryNavigation).getByRole("link", { name: "Exhibitions" })).toHaveAttribute("href", "/exhibitions.html");
    expect(within(primaryNavigation).getByRole("link", { name: "Practice" })).toHaveAttribute("href", "/about.html");
    expect(within(primaryNavigation).getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact.html");
    expect(within(primaryNavigation).queryByRole("link", { name: "Commission" })).not.toBeInTheDocument();
    const indexControl = container.querySelector("button.index-control");
    expect(indexControl).toHaveAccessibleName("Open the site index");

    fireEvent.click(indexControl);
    expect(screen.getByRole("dialog", { name: "index" })).toBeInTheDocument();
    const desktopMaterial = container.querySelector(".site-index__material source");
    expect(desktopMaterial).toHaveAttribute("media", "(min-width: 760px)");
    expect(container.querySelector(".site-index__material img")).not.toHaveAttribute("src");
    expect(within(screen.getByRole("dialog", { name: "index" })).getByRole("link", { name: "Commission guide" }))
      .toHaveAttribute("href", "/commissions.html");
  });

  it("keeps Index mounted while cleaning navigation history, restores a canceled click, and keeps Back closed", async () => {
    const retainedState = { retained: "proof" };
    window.history.replaceState(retainedState, "", "/about.html");
    const source = renderShell("about");
    const { container } = source;
    fireEvent.click(container.querySelector("button.index-control"));
    expect(window.history.state).toMatchObject({
      ...retainedState,
      branchstoneShellLayer: "index",
    });

    const works = within(screen.getByRole("dialog", { name: "index" }))
      .getByRole("link", { name: /Works/ });
    works.focus();
    let stateAtNavigation;
    window.addEventListener("click", (event) => {
      stateAtNavigation = window.history.state;
      event.preventDefault();
    }, { once: true });
    fireEvent.click(works);

    expect(stateAtNavigation).toEqual(retainedState);
    expect(screen.getByRole("dialog", { name: "index" })).toBeInTheDocument();
    expect(works).toHaveFocus();
    const cleanedSourceEntry = stateAtNavigation;
    await waitFor(() => expect(window.history.state).toEqual({
      ...retainedState,
      branchstoneShellLayer: "index",
    }));
    expect(screen.getByRole("dialog", { name: "index" })).toBeInTheDocument();

    source.unmount();
    window.history.replaceState({ destination: "gallery" }, "", "/gallery.html");
    const destination = renderShell("gallery");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    destination.unmount();

    window.history.replaceState(cleanedSourceEntry, "", "/about.html");
    const returned = renderShell("about");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(returned.container.querySelector("button.index-control"))
      .toHaveAttribute("aria-expanded", "false");
    expect(window.history.state).toEqual(retainedState);
  });

  it("reconciles cleaned shell history when Back restores an open Index from BFCache", async () => {
    const retainedState = { retained: "proof" };
    window.history.replaceState(retainedState, "", "/about.html");
    const { container } = renderShell("about");
    const indexControl = container.querySelector("button.index-control");

    fireEvent.click(indexControl);
    expect(window.history.state).toEqual({
      ...retainedState,
      branchstoneShellLayer: "index",
    });
    expect(screen.getByRole("dialog", { name: "index" })).toBeInTheDocument();

    window.history.replaceState(retainedState, "", "/about.html");
    const pageShow = new Event("pageshow");
    Object.defineProperty(pageShow, "persisted", { value: true });
    fireEvent(window, pageShow);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(indexControl).toHaveFocus());
    expect(window.history.state).toEqual(retainedState);
  });

  it.each([
    ["Ctrl", { ctrlKey: true }],
    ["Command", { metaKey: true }],
    ["middle", { button: 1 }],
  ])("keeps Index history ownership for a %s-click", (_label, clickOptions) => {
    const retainedState = { retained: "proof" };
    window.history.replaceState(retainedState, "", "/about.html");
    renderShell("about");
    fireEvent.click(document.querySelector("button.index-control"));
    const works = within(screen.getByRole("dialog", { name: "index" }))
      .getByRole("link", { name: /Works/ });
    window.addEventListener("click", (event) => event.preventDefault(), { once: true });

    fireEvent.click(works, clickOptions);

    expect(window.history.state).toEqual({
      ...retainedState,
      branchstoneShellLayer: "index",
    });
    expect(screen.getByRole("dialog", { name: "index" })).toBeInTheDocument();
  });

  it("names Instagram truthfully and marks legal links as the current page", () => {
    document.body.dataset.page = "privacy";
    window.history.replaceState({}, "", "/privacy.html");
    const { container } = renderShell("privacy");

    const instagramLinks = screen.getAllByRole("link", { name: "Studio notes / Instagram" });
    expect(instagramLinks.every((link) => link.href === "https://www.instagram.com/thebranchstone/")).toBe(true);

    const privacyLinks = screen.getAllByRole("link", { name: "Privacy" });
    expect(privacyLinks.length).toBeGreaterThanOrEqual(2);
    expect(privacyLinks.every((link) => link.getAttribute("aria-current") === "page")).toBe(true);
    expect(container.querySelector("main#main-content")).toHaveAttribute("tabindex", "-1");
  });

  it("describes saved-work removal as removal rather than closing", async () => {
    window.localStorage.setItem(storageKeys.favorites, JSON.stringify(["artwork-july-pines"]));
    const { container } = renderShell("about");

    await waitFor(() => expect(container.querySelector("button.index-control")).toHaveAccessibleName("Open the site index"));
    fireEvent.click(container.querySelector("button.index-control"));
    const indexDialog = screen.getByRole("dialog", { name: "index" });
    fireEvent.click(within(indexDialog).getByRole("button", { name: "Saved works: 1" }));

    expect(await screen.findByRole("button", { name: "Remove from saved works: July Pines" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to index" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close: July Pines" })).not.toBeInTheDocument();
  });

  it("maps Index and Saved to browser history so Back and Forward restore shell context", async () => {
    const { container } = renderShell("about");
    const indexControl = container.querySelector("button.index-control");

    fireEvent.click(indexControl);
    expect(window.history.state).toMatchObject({ branchstoneShellLayer: "index" });
    expect(screen.getByRole("dialog", { name: "index" })).toBeInTheDocument();

    fireEvent.click(within(
      screen.getByRole("dialog", { name: "index" }),
    ).getByRole("button", { name: "Saved works: 0" }));
    expect(window.history.state).toMatchObject({ branchstoneShellLayer: "favorites" });
    expect(screen.getByRole("dialog", { name: "Saved works" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "index" })).not.toBeInTheDocument();

    const indexState = { branchstoneShellLayer: "index" };
    window.history.replaceState(indexState, "", "/about.html");
    fireEvent(window, new PopStateEvent("popstate", { state: indexState }));
    await waitFor(() => expect(screen.getByRole("dialog", { name: "index" }))
      .toBeInTheDocument());
    expect(screen.queryByRole("dialog", { name: "Saved works" })).not.toBeInTheDocument();

    window.history.replaceState({}, "", "/about.html");
    fireEvent(window, new PopStateEvent("popstate", { state: {} }));
    await waitFor(() => expect(container.querySelector(".drawer-layer")).not.toBeInTheDocument());
    await waitFor(() => expect(indexControl).toHaveFocus());

    const favoritesState = { branchstoneShellLayer: "favorites" };
    window.history.replaceState(favoritesState, "", "/about.html");
    fireEvent(window, new PopStateEvent("popstate", { state: favoritesState }));
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Saved works" }))
      .toBeInTheDocument());
  });

  it("cancels stale shell focus restoration when browser Forward immediately reopens Index", () => {
    const frames = new Map();
    let nextFrame = 0;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback) => {
      nextFrame += 1;
      frames.set(nextFrame, callback);
      return nextFrame;
    }));
    const cancelAnimationFrame = vi.fn((frame) => frames.delete(frame));
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
    const { container } = renderShell("about");
    const indexControl = container.querySelector("button.index-control");

    fireEvent.click(indexControl);
    expect(screen.getByRole("dialog", { name: "index" })).toBeInTheDocument();

    window.history.replaceState({}, "", "/about.html");
    fireEvent(window, new PopStateEvent("popstate", { state: {} }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(frames.size).toBe(1);

    const indexState = { branchstoneShellLayer: "index" };
    window.history.replaceState(indexState, "", "/about.html");
    fireEvent(window, new PopStateEvent("popstate", { state: indexState }));

    expect(screen.getByRole("dialog", { name: "index" })).toBeInTheDocument();
    expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });

  it.each(["visible Close", "browser Back"])(
    "keeps an explicit locale choice after closing Index with %s",
    async (closeTrigger) => {
    document.body.dataset.page = "about";
    window.history.replaceState({}, "", "/about.html");
    const description = document.createElement("meta");
    description.name = "description";
    description.dataset.testMetadata = "";
    const openGraphTitle = document.createElement("meta");
    openGraphTitle.setAttribute("property", "og:title");
    openGraphTitle.dataset.testMetadata = "";
    const openGraphDescription = document.createElement("meta");
    openGraphDescription.setAttribute("property", "og:description");
    openGraphDescription.dataset.testMetadata = "";
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.dataset.testMetadata = "";
    const openGraphUrl = document.createElement("meta");
    openGraphUrl.setAttribute("property", "og:url");
    openGraphUrl.dataset.testMetadata = "";
    document.head.append(
      description,
      openGraphTitle,
      openGraphDescription,
      canonical,
      openGraphUrl,
    );
    const restoreBaseEntry = () => {
      window.history.replaceState({}, "", "/about.html");
      window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    };
    const historyBack = vi.spyOn(window.history, "back").mockImplementation(restoreBaseEntry);
    const { container } = renderShell("about");

    fireEvent.click(container.querySelector("button.index-control"));
    expect(window.history.state).toMatchObject({ branchstoneShellLayer: "index" });

    fireEvent.click(within(
      screen.getByRole("dialog", { name: "index" }),
    ).getByRole("link", { name: "Українська" }));

    await waitFor(() => expect(window.location.pathname).toBe("/uk/about.html"));
    const metadata = getPageMetadata("about", "uk");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("locale-probe")).toHaveTextContent("uk");
    expect(document.documentElement.lang).toBe("uk");
    expect(document.title).toBe(metadata.title);
    expect(description.content).toBe(metadata.description);
    expect(openGraphTitle.content).toBe(metadata.title);
    expect(openGraphDescription.content).toBe(metadata.description);
    expect(new URL(canonical.href).pathname).toBe("/uk/about.html");
    expect(new URL(openGraphUrl.content).pathname).toBe("/uk/about.html");
    expect(window.localStorage.getItem(storageKeys.language)).toBe("uk");
    expect(container.querySelector(".index-control")).toHaveTextContent("індекс");

    if (closeTrigger === "visible Close") {
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Закрити" }));
      expect(historyBack).toHaveBeenCalledOnce();
    } else {
      restoreBaseEntry();
    }

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(window.location.pathname).toBe("/uk/about.html"));
    expect(screen.getByTestId("locale-probe")).toHaveTextContent("uk");
    expect(document.documentElement.lang).toBe("uk");
    expect(document.title).toBe(metadata.title);
    expect(description.content).toBe(metadata.description);
    expect(openGraphTitle.content).toBe(metadata.title);
    expect(openGraphDescription.content).toBe(metadata.description);
    expect(new URL(canonical.href).pathname).toBe("/uk/about.html");
    expect(new URL(openGraphUrl.content).pathname).toBe("/uk/about.html");
    expect(window.localStorage.getItem(storageKeys.language)).toBe("uk");
  });

  it("hands a fallback Index opened before hydration to the history-backed layer", async () => {
    const nativeQuerySelector = document.querySelector.bind(document);
    const fallbackIndex = { open: true };
    vi.spyOn(document, "querySelector").mockImplementation((selector) => (
      selector === ".prehydrate-index[open]"
        ? fallbackIndex
        : nativeQuerySelector(selector)
    ));

    renderShell("gallery");

    await waitFor(() => expect(fallbackIndex.open).toBe(false));
    expect(document.documentElement.dataset.hydrated).toBe("true");
    expect(window.history.state).toMatchObject({ branchstoneShellLayer: "index" });
    expect(screen.getByRole("dialog", { name: "index" })).toBeInTheDocument();
  });

  it("adopts a restored shell history layer on mount so the first Close is effective", async () => {
    const baseState = { retained: "proof" };
    const restoredState = {
      ...baseState,
      branchstoneShellLayer: "index",
    };
    window.history.replaceState(restoredState, "", "/contact.html");
    vi.spyOn(window.history, "back").mockImplementation(() => {
      window.history.replaceState(baseState, "", "/contact.html");
      window.dispatchEvent(new PopStateEvent("popstate", { state: baseState }));
    });
    const { container } = renderShell("contact");

    const index = await screen.findByRole("dialog", { name: "index" });
    fireEvent.click(within(index).getByRole("button", { name: "Close" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(container.querySelector(".index-control")).toHaveFocus());
    expect(window.history.state).toEqual(baseState);
  });

  it("routes visible Close and Escape through the owned history entry", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const { container } = renderShell("contact");
    fireEvent.click(container.querySelector("button.index-control"));

    fireEvent.click(within(
      screen.getByRole("dialog", { name: "index" }),
    ).getByRole("button", { name: "Close" }));
    expect(back).toHaveBeenCalledTimes(1);

    const state = { branchstoneShellLayer: "index" };
    window.history.replaceState(state, "", "/contact.html");
    fireEvent(window, new PopStateEvent("popstate", { state }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(back).toHaveBeenCalledTimes(2);
  });
});
