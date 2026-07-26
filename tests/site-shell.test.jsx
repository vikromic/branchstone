// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteProvider } from "../src/app/SiteContext.jsx";
import { SiteShell } from "../src/app/SiteShell.jsx";
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

function renderShell(page = "home") {
  return render(
    <SiteProvider initialLocale="en">
      <SiteShell page={page}><p>Page content</p></SiteShell>
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
    vi.unstubAllGlobals();
    document.body.className = "";
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
    expect(screen.queryByRole("button", { name: "Close: July Pines" })).not.toBeInTheDocument();
  });
});
