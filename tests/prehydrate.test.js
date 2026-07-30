import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  branchstonePrehydratePlugin,
  inlinePrehydrateScript,
  runBranchstonePrehydrate,
} from "../scripts/prehydrate.mjs";
import { sitePages } from "../site-pages.js";

const root = process.cwd();

function runtimeFor(
  href,
  {
    desktop = false,
    reducedMotion = false,
    storedLocale = null,
    languages = ["en-US"],
  } = {},
) {
  const classes = new Set();
  const motionListeners = [];
  const timeouts = [];
  const motionPreference = {
    matches: reducedMotion,
    addEventListener: vi.fn((_event, listener) => motionListeners.push(listener)),
  };
  const location = {
    href,
    replace: vi.fn(),
  };
  const runtime = {
    document: {
      documentElement: {
        classList: {
          toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)),
        },
        dataset: {},
        style: { visibility: "" },
      },
    },
    location,
    localStorage: { getItem: vi.fn(() => storedLocale) },
    navigator: { languages, language: languages[0] },
    matchMedia: vi.fn((query) => (
      query === "(min-width: 760px)"
        ? {
          matches: desktop,
          addEventListener: vi.fn(),
        }
        : motionPreference
    )),
    setTimeout: vi.fn((callback, delay) => {
      timeouts.push({ callback, delay });
      return timeouts.length;
    }),
  };
  return { classes, location, motionListeners, motionPreference, runtime, timeouts };
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

    expect(result).toEqual({ enhanced: false, redirected: true, target });
    expect(harness.location.replace).toHaveBeenCalledOnce();
    expect(harness.location.replace).toHaveBeenCalledWith(target);
    expect(historyReplace).not.toHaveBeenCalled();
    expect(harness.runtime.document.documentElement.style.visibility).toBe("hidden");
  });

  it("leaves Gallery as the sole canonical artwork owner", () => {
    const harness = runtimeFor("https://branchstone.art/gallery.html?artwork=july-pines");

    const result = runBranchstonePrehydrate("gallery", harness.runtime);

    expect(result).toEqual({ enhanced: true, redirected: false });
    expect(harness.location.replace).not.toHaveBeenCalled();
    expect(harness.classes.has("stay-enhanced")).toBe(true);
  });

  it("marks the desktop Gallery layout before paint and fails open after a boot stall", () => {
    const harness = runtimeFor("https://branchstone.art/gallery.html", { desktop: true });

    runBranchstonePrehydrate("gallery", harness.runtime);

    expect(harness.runtime.document.documentElement.dataset.galleryLayout).toBe("stream");
    harness.timeouts[0].callback();
    expect(harness.runtime.document.documentElement.dataset.hydrationStalled).toBe("true");
  });

  it("gives Contact eight seconds before offering its progressive fallback", () => {
    const harness = runtimeFor("https://branchstone.art/contact.html");

    runBranchstonePrehydrate("contact", harness.runtime);

    expect(harness.timeouts).toHaveLength(1);
    expect(harness.timeouts[0].delay).toBe(8000);
  });

  it("adds the enhancement class before paint only for motion-capable sessions", () => {
    const harness = runtimeFor("https://branchstone.art/gallery.html");

    expect(runBranchstonePrehydrate("gallery", harness.runtime)).toEqual({
      enhanced: true,
      redirected: false,
    });
    expect(harness.classes.has("stay-enhanced")).toBe(true);
    expect(harness.motionPreference.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    harness.motionPreference.matches = true;
    harness.motionListeners[0]();
    expect(harness.classes.has("stay-enhanced")).toBe(false);
  });

  it.each(["reduced", "missing", "throwing"])(
    "keeps %s motion-preference sessions resolved while retaining the boot-failure timer",
    (motionContract) => {
      const harness = runtimeFor("https://branchstone.art/about.html", {
        reducedMotion: motionContract === "reduced",
      });
      if (motionContract === "missing") harness.runtime.matchMedia = undefined;
      if (motionContract === "throwing") {
        harness.runtime.matchMedia = vi.fn(() => {
          throw new Error("motion preference unavailable");
        });
      }

      expect(runBranchstonePrehydrate("about", harness.runtime)).toEqual({
        enhanced: false,
        redirected: false,
      });
      expect(harness.classes.has("stay-enhanced")).toBe(false);
      expect(harness.timeouts).toHaveLength(1);
      expect(harness.timeouts[0].delay).toBe(4000);

      harness.timeouts[0].callback();
      expect(harness.classes.has("stay-enhanced")).toBe(false);
      expect(harness.runtime.document.documentElement.dataset.hydrationStalled).toBe("true");
    },
  );

  it("fails open when the React bundle never marks the page hydrated", () => {
    const broken = runtimeFor("https://branchstone.art/gallery.html");
    runBranchstonePrehydrate("gallery", broken.runtime);

    expect(broken.timeouts).toHaveLength(1);
    expect(broken.timeouts[0].delay).toBe(4000);
    broken.timeouts[0].callback();
    expect(broken.classes.has("stay-enhanced")).toBe(false);
    expect(broken.runtime.document.documentElement.dataset.hydrationStalled).toBe("true");

    broken.motionPreference.matches = false;
    broken.motionListeners[0]();
    expect(broken.classes.has("stay-enhanced")).toBe(false);

    const hydrated = runtimeFor("https://branchstone.art/gallery.html");
    runBranchstonePrehydrate("gallery", hydrated.runtime);
    hydrated.runtime.document.documentElement.dataset.hydrated = "true";
    hydrated.timeouts[0].callback();
    expect(hydrated.classes.has("stay-enhanced")).toBe(true);
    expect(hydrated.runtime.document.documentElement.dataset.hydrationStalled).toBeUndefined();
  });

  it("injects the blocking contract at the start of head for every page template", async () => {
    const plugin = branchstonePrehydratePlugin();

    expect(plugin.enforce).toBe("pre");
    expect(plugin.transformIndexHtml.order).toBe("pre");

    for (const { filename, id } of sitePages) {
      const html = await readFile(resolve(root, filename), "utf8");
      const result = plugin.transformIndexHtml.handler(html);
      expect(html).not.toContain("stay-enhanced");
      expect(result).toEqual([expect.objectContaining({
        tag: "script",
        attrs: { "data-branchstone-prehydrate": "" },
        injectTo: "head-prepend",
      })]);
      expect(result[0].children).toBe(inlinePrehydrateScript(id));
      expect(result[0].children).toContain("location");
      expect(result[0].children).toContain("stay-enhanced");
    }
  });
});
