import { describe, expect, it, vi } from "vitest";
import {
  branchstonePrehydratePlugin,
  inlinePrehydrateScript,
  runBranchstonePrehydrate,
} from "../../scripts/prehydrate.mjs";
import { sitePages } from "../../site-pages.js";

function runtimeFor(href, { storedLocale = null, languages = ["en-US"] } = {}) {
  const timeouts = [];
  const location = { href, replace: vi.fn() };
  const runtime = {
    document: {
      documentElement: { dataset: {}, style: { visibility: "" } },
    },
    location,
    localStorage: { getItem: vi.fn(() => storedLocale) },
    navigator: { languages, language: languages[0] },
    setTimeout: vi.fn((callback, delay) => {
      timeouts.push({ callback, delay });
      return timeouts.length;
    }),
  };
  return { location, runtime, timeouts };
}

describe("Branchstone pre-hydration contract", () => {
  it.each([
    ["English home", "https://branchstone.art/?artwork=artwork-july-pines", {}, "/gallery.html?art=july-pines"],
    ["English index path", "https://branchstone.art/index.html?artwork=mermaids-dream#detail", {}, "/gallery.html?art=mermaid-s-dream#detail"],
    ["Ukrainian path", "https://branchstone.art/uk/?artwork=artwork-july-pines", {}, "/uk/gallery.html?art=july-pines"],
    ["Ukrainian path wins over stale lang", "https://branchstone.art/uk/?artwork=july-pines&lang=en", {}, "/uk/gallery.html?art=july-pines"],
    ["Ukrainian index path", "https://branchstone.art/uk/index.html?artwork=july-pines", {}, "/uk/gallery.html?art=july-pines"],
    ["lang query", "https://branchstone.art/?artwork=july-pines&lang=uk&ref=archive", {}, "/uk/gallery.html?ref=archive&art=july-pines"],
    ["stored locale", "https://branchstone.art/?artwork=july-pines", { storedLocale: "uk" }, "/uk/gallery.html?art=july-pines"],
    ["browser locale", "https://branchstone.art/?artwork=july-pines", { languages: ["uk-UA", "en-US"] }, "/uk/gallery.html?art=july-pines"],
  ])("canonicalizes legacy artwork history with location.replace: %s", (_label, href, options, target) => {
    const harness = runtimeFor(href, options);
    const historyReplace = vi.fn();
    harness.runtime.history = { replaceState: historyReplace };

    const result = runBranchstonePrehydrate("home", harness.runtime);

    expect(result).toEqual({ redirected: true, target });
    expect(harness.location.replace).toHaveBeenCalledOnce();
    expect(harness.location.replace).toHaveBeenCalledWith(target);
    expect(historyReplace).not.toHaveBeenCalled();
    expect(harness.runtime.document.documentElement.style.visibility).toBe("hidden");
  });

  it("leaves Gallery as the sole canonical artwork owner", () => {
    const harness = runtimeFor("https://branchstone.art/gallery.html?artwork=july-pines");

    expect(runBranchstonePrehydrate("gallery", harness.runtime)).toEqual({ redirected: false });
    expect(harness.location.replace).not.toHaveBeenCalled();
  });

  it("gives Contact eight seconds and other pages four before offering their fallbacks", () => {
    const contact = runtimeFor("https://branchstone.art/contact.html");
    runBranchstonePrehydrate("contact", contact.runtime);
    const about = runtimeFor("https://branchstone.art/about.html");
    runBranchstonePrehydrate("about", about.runtime);

    expect(contact.timeouts.map(({ delay }) => delay)).toEqual([8000]);
    expect(about.timeouts.map(({ delay }) => delay)).toEqual([4000]);
  });

  it("fails open only when the React bundle never marks the page hydrated", () => {
    const broken = runtimeFor("https://branchstone.art/gallery.html");
    runBranchstonePrehydrate("gallery", broken.runtime);
    broken.timeouts[0].callback();
    expect(broken.runtime.document.documentElement.dataset.hydrationStalled).toBe("true");

    const hydrated = runtimeFor("https://branchstone.art/gallery.html");
    runBranchstonePrehydrate("gallery", hydrated.runtime);
    hydrated.runtime.document.documentElement.dataset.hydrated = "true";
    hydrated.timeouts[0].callback();
    expect(hydrated.runtime.document.documentElement.dataset.hydrationStalled).toBeUndefined();
  });

  it("injects the blocking contract at the start of head, keyed by each page's data-page", () => {
    const plugin = branchstonePrehydratePlugin();

    expect(plugin.enforce).toBe("pre");
    expect(plugin.transformIndexHtml.order).toBe("pre");
    expect(() => plugin.transformIndexHtml.handler("<html><body></body></html>"))
      .toThrow(/data-page/);

    for (const { id } of sitePages) {
      const result = plugin.transformIndexHtml.handler(`<html><head></head><body data-page="${id}"></body></html>`);
      expect(result).toEqual([{
        tag: "script",
        attrs: { "data-branchstone-prehydrate": "" },
        children: inlinePrehydrateScript(id),
        injectTo: "head-prepend",
      }]);
    }
  });

  it.each([
    ["a Gallery visit only arms the stall fallback", "gallery", "https://branchstone.art/gallery.html", false],
    ["a legacy Home artwork link is redirected to Gallery", "home", "https://branchstone.art/?artwork=july-pines", true],
  ])("executes the serialized inline script so %s", (_label, pageId, href, redirected) => {
    const harness = runtimeFor(href);
    // The inline script defaults its runtime to `globalThis`; shadow it with the fake runtime.
    new Function("globalThis", inlinePrehydrateScript(pageId))(harness.runtime);

    expect(harness.location.replace).toHaveBeenCalledTimes(redirected ? 1 : 0);
    if (redirected) expect(harness.location.replace).toHaveBeenCalledWith("/gallery.html?art=july-pines");
    else expect(harness.timeouts).toHaveLength(1);
  });
});
