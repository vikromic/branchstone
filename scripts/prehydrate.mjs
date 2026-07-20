const PAGE_ATTRIBUTE = /<body\b[^>]*\bdata-page="([^"]+)"/;

/**
 * Runs from a parser-blocking inline script in <head>. Keep this function
 * self-contained: its serialized source is the production pre-hydration
 * contract, so it cannot close over module-scoped helpers.
 */
export function runBranchstonePrehydrate(pageId, runtime = globalThis) {
  const root = runtime.document?.documentElement;
  const currentLocation = runtime.location;
  if (!root || !currentLocation?.href) return { enhanced: false, redirected: false };

  const url = new URL(currentLocation.href);
  const legacyArtwork = pageId === "home" ? url.searchParams.get("artwork") : null;

  if (legacyArtwork) {
    let locale = "en";
    const pathIsUkrainian = url.pathname === "/uk" || url.pathname.startsWith("/uk/");
    const requestedLocale = url.searchParams.get("lang");

    if (pathIsUkrainian) locale = "uk";
    else if (requestedLocale === "uk" || requestedLocale === "en") locale = requestedLocale;
    else {
      let storedLocale = null;
      try {
        storedLocale = runtime.localStorage?.getItem("branchstone.language");
      } catch {
        // Storage can be unavailable in private or locked-down browser contexts.
      }

      if (storedLocale === "uk" || storedLocale === "en") locale = storedLocale;
      else {
        try {
          const languages = runtime.navigator?.languages?.length
            ? runtime.navigator.languages
            : [runtime.navigator?.language];
          if (languages.some((language) => /^uk(?:-|$)/i.test(language || ""))) locale = "uk";
        } catch {
          // English is the fail-closed locale when browser language is unreadable.
        }
      }
    }

    let artworkId = String(legacyArtwork).replace(/^artwork-/, "");
    if (artworkId === "mermaids-dream") artworkId = "mermaid-s-dream";

    url.pathname = locale === "uk" ? "/uk/gallery.html" : "/gallery.html";
    url.searchParams.delete("artwork");
    url.searchParams.delete("lang");
    url.searchParams.set("art", artworkId);
    const target = `${url.pathname}${url.search}${url.hash}`;

    const previousVisibility = root.style.visibility;
    root.style.visibility = "hidden";
    try {
      currentLocation.replace(target);
    } catch (error) {
      root.style.visibility = previousVisibility;
      throw error;
    }
    return { enhanced: false, redirected: true, target };
  }

  let motionPreference;
  try {
    if (typeof runtime.matchMedia === "function") {
      motionPreference = runtime.matchMedia("(prefers-reduced-motion: reduce)");
    }
  } catch {
    // Without a trustworthy motion preference, leave the fully resolved SSR state visible.
  }

  let enhancementExpired = false;
  const syncMotionClass = () => {
    const enhanced = Boolean(!enhancementExpired && motionPreference && !motionPreference.matches);
    root.classList.toggle("stay-enhanced", enhanced);
    return enhanced;
  };
  const enhanced = syncMotionClass();
  motionPreference?.addEventListener?.("change", syncMotionClass);
  if (enhanced && typeof runtime.setTimeout === "function") {
    runtime.setTimeout(() => {
      if (root.dataset?.hydrated === "true") return;
      enhancementExpired = true;
      syncMotionClass();
    }, 4000);
  }
  return { enhanced, redirected: false };
}

export function inlinePrehydrateScript(pageId) {
  return `(${runBranchstonePrehydrate.toString()})(${JSON.stringify(pageId)});`;
}

export function branchstonePrehydratePlugin() {
  return {
    name: "branchstone-prehydrate",
    enforce: "pre",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const pageId = html.match(PAGE_ATTRIBUTE)?.[1];
        if (!pageId) throw new Error("Branchstone entry is missing its data-page contract");
        return [{
          tag: "script",
          attrs: { "data-branchstone-prehydrate": "" },
          children: inlinePrehydrateScript(pageId),
          injectTo: "head-prepend",
        }];
      },
    },
  };
}
