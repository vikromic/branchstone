// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteProvider } from "../src/app/SiteContext.jsx";
import { AboutPage } from "../src/pages/AboutPage.jsx";

vi.mock("../src/app/SiteShell.jsx", () => ({
  SiteShell: ({ children }) => <main data-testid="site-shell">{children}</main>,
}));

describe("Practice editorial interactions", () => {
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

  it("keeps each Field Note as one keyboard stop while preserving its visible action", () => {
    render(
      <SiteProvider initialLocale="en">
        <AboutPage />
      </SiteProvider>,
    );

    const entries = document.querySelectorAll(".highlight-entry");
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      const links = within(entry).getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveTextContent("Open feature");
      expect(links[0]).toHaveAttribute("target", "_blank");
      expect(links[0]).toHaveAttribute("rel", "noreferrer");
    }
  });
});
