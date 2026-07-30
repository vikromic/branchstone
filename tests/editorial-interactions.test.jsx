// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteProvider } from "../src/app/SiteContext.jsx";
import { AboutPage } from "../src/pages/AboutPage.jsx";
import { ExhibitionsPage } from "../src/pages/ExhibitionsPage.jsx";

vi.mock("../src/app/SiteShell.jsx", () => ({
  SiteShell: ({ children }) => <main data-testid="site-shell">{children}</main>,
}));

describe("professional editorial routes", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/about.html?lang=en");
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps all five public records on the Exhibitions page as one keyboard stop each", () => {
    window.history.replaceState({}, "", "/exhibitions.html?lang=en");
    render(
      <SiteProvider initialLocale="en">
        <ExhibitionsPage />
      </SiteProvider>,
    );

    const entries = document.querySelectorAll(".highlight-entry");
    expect(entries).toHaveLength(5);

    for (const entry of entries) {
      const links = within(entry).getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveTextContent(/View event record|Read feature/);
      expect(links[0]).toHaveAttribute("target", "_blank");
      expect(links[0]).toHaveAttribute("rel", "noreferrer");
    }
  });

  it("exposes statement, biography, and method directly on Practice", () => {
    render(
      <SiteProvider initialLocale="en">
        <AboutPage />
      </SiteProvider>,
    );

    expect(document.getElementById("artist-statement")).toHaveTextContent("Artist statement");
    expect(document.getElementById("biography")).toHaveTextContent("Biography");
    expect(document.getElementById("method")).toHaveTextContent("The creative process");
    expect(document.querySelector(".about-hero__routes")).toHaveTextContent("Statement");
    expect(document.querySelector(".about-page")).not.toHaveTextContent("Field notes");
  });
});
