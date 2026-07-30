export function safeMatchMedia(query, runtime = globalThis) {
  try {
    const matcher = runtime?.matchMedia;
    if (typeof matcher !== "function") return null;
    const media = matcher.call(runtime, query);
    return media && typeof media.matches === "boolean" ? media : null;
  } catch {
    return null;
  }
}

export function subscribeMediaQuery(media, callback) {
  if (!media) return () => {};

  try {
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", callback);
      return () => {
        try {
          media.removeEventListener?.("change", callback);
        } catch {
          // The current state remains usable if a restricted host rejects cleanup.
        }
      };
    }

    if (typeof media.addListener === "function") {
      media.addListener(callback);
      return () => {
        try {
          media.removeListener?.(callback);
        } catch {
          // The current state remains usable if a restricted host rejects cleanup.
        }
      };
    }
  } catch {
    return () => {};
  }

  return () => {};
}
