// @vitest-environment jsdom

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runBranchstonePrehydrate } from "../scripts/prehydrate.mjs";
import { SiteProvider } from "../src/app/SiteContext.jsx";
import { ContactPage } from "../src/pages/ContactPage.jsx";
import { CommissionsPage } from "../src/pages/CommissionsPage.jsx";

afterEach(() => {
  document.body.replaceChildren();
  document.head.querySelectorAll("[data-test-contact-css]").forEach((node) => node.remove());
  document.documentElement.classList.remove("stay-enhanced");
  delete document.documentElement.dataset.hydrated;
  delete document.documentElement.dataset.hydrationStalled;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("contact progressive safety", () => {
  it("renders the pre-hydration form inert with a direct-email fallback", () => {
    const html = renderToString(
      <SiteProvider initialLocale="en"><ContactPage /></SiteProvider>,
    );

    expect(html).toMatch(/<fieldset[^>]*disabled/);
    expect(html).toContain("<noscript>");
    expect(html).toContain("mailto:thebranchstone@gmail.com");
    expect(html).toContain("The letter is still preparing. You can email the studio directly:");

    const ukrainianHtml = renderToString(
      <SiteProvider initialLocale="uk"><ContactPage /></SiteProvider>,
    );
    expect(ukrainianHtml).toContain("Лист ще готується. Ви можете написати студії напряму:");
  });

  it("reveals the direct-email fallback only after an unhydrated boot timeout", async () => {
    const html = renderToString(
      <SiteProvider initialLocale="en"><ContactPage /></SiteProvider>,
    );
    const style = document.createElement("style");
    style.dataset.testContactCss = "";
    style.textContent = await readFile(resolve(process.cwd(), "src/styles/contact.css"), "utf8");
    document.head.append(style);
    document.body.innerHTML = html;

    const callbacks = [];
    const runtime = {
      document,
      location: window.location,
      localStorage: null,
      navigator: window.navigator,
      matchMedia: undefined,
      setTimeout: vi.fn((callback, delay) => {
        callbacks.push({ callback, delay });
        return callbacks.length;
      }),
    };
    const fallback = document.querySelector(".correspondence-form__boot-fallback");

    expect(fallback).not.toBeNull();
    expect(fallback.matches("[data-contact-boot-fallback]")).toBe(true);
    expect(fallback.getAttribute("role")).toBe("status");
    expect(fallback.getAttribute("aria-live")).toBeNull();
    expect(fallback.getAttribute("aria-atomic")).toBeNull();
    expect(getComputedStyle(fallback).display).toBe("none");
    expect(runBranchstonePrehydrate("contact", runtime)).toEqual({
      enhanced: false,
      redirected: false,
    });
    expect(callbacks).toHaveLength(1);
    expect(callbacks[0].delay).toBe(8000);

    callbacks[0].callback();
    expect(document.documentElement.dataset.hydrationStalled).toBe("true");
    expect(fallback.getAttribute("role")).toBe("status");
    expect(fallback.getAttribute("aria-live")).toBe("polite");
    expect(fallback.getAttribute("aria-atomic")).toBe("true");
    expect(getComputedStyle(fallback).display).toBe("block");

    document.documentElement.dataset.hydrated = "true";
    expect(getComputedStyle(fallback).display).toBe("none");
  });

  it("hydrates without a mismatch and clears the promoted live-region state", async () => {
    const page = () => (
      <SiteProvider initialLocale="en"><ContactPage /></SiteProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(page());
    document.body.append(container);

    const callbacks = [];
    runBranchstonePrehydrate("contact", {
      document,
      location: window.location,
      localStorage: null,
      navigator: window.navigator,
      matchMedia: undefined,
      setTimeout: (callback) => {
        callbacks.push(callback);
        return callbacks.length;
      },
    });
    callbacks[0]();

    const fallback = container.querySelector("[data-contact-boot-fallback]");
    expect(fallback.getAttribute("role")).toBe("status");
    expect(fallback.getAttribute("aria-live")).toBe("polite");
    expect(fallback.getAttribute("aria-atomic")).toBe("true");
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const onRecoverableError = vi.fn();
    let root;

    try {
      await act(async () => {
        root = hydrateRoot(container, page(), { onRecoverableError });
        await Promise.resolve();
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      expect(document.documentElement.dataset.hydrated).toBe("true");
      expect(fallback.getAttribute("role")).toBe("status");
      expect(fallback.getAttribute("aria-live")).toBeNull();
      expect(fallback.getAttribute("aria-atomic")).toBeNull();
    } finally {
      if (root) await act(async () => root.unmount());
      container.remove();
    }
  });
});

describe("commission progressive safety", () => {
  it("renders the pre-hydration wizard inert with direct contact fallbacks", () => {
    const html = renderToString(
      <SiteProvider initialLocale="en"><CommissionsPage /></SiteProvider>,
    );

    expect(html).toMatch(/<fieldset[^>]*class="commission-form__interactive"[^>]*disabled/);
    expect(html).toContain("<noscript>");
    expect(html).toContain("mailto:thebranchstone@gmail.com");
    expect(html).toContain('href="/contact.html"');
  });
});
