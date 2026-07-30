import { describe, expect, it, vi } from "vitest";
import {
  safeMatchMedia,
  subscribeMediaQuery,
} from "../src/domain/media-query.js";

describe("safe media-query boundary", () => {
  it.each([
    ["missing", {}],
    ["null", { matchMedia: () => null }],
    ["throwing", { matchMedia: () => { throw new Error("restricted host"); } }],
    ["invalid", { matchMedia: () => ({ matches: "yes" }) }],
  ])("fails closed for a %s matchMedia contract", (_label, runtime) => {
    expect(safeMatchMedia("(min-width: 760px)", runtime)).toBeNull();
  });

  it("preserves the host receiver and subscribes through modern listeners", () => {
    const callback = vi.fn();
    const media = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const runtime = {
      matchMedia(query) {
        expect(this).toBe(runtime);
        expect(query).toBe("(min-width: 760px)");
        return media;
      },
    };

    expect(safeMatchMedia("(min-width: 760px)", runtime)).toBe(media);
    const unsubscribe = subscribeMediaQuery(media, callback);
    expect(media.addEventListener).toHaveBeenCalledWith("change", callback);
    unsubscribe();
    expect(media.removeEventListener).toHaveBeenCalledWith("change", callback);
  });

  it("supports legacy listeners and contains listener failures", () => {
    const callback = vi.fn();
    const legacy = {
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };
    const broken = {
      matches: false,
      addEventListener: () => { throw new Error("listener denied"); },
    };

    const unsubscribeLegacy = subscribeMediaQuery(legacy, callback);
    expect(legacy.addListener).toHaveBeenCalledWith(callback);
    unsubscribeLegacy();
    expect(legacy.removeListener).toHaveBeenCalledWith(callback);
    expect(() => subscribeMediaQuery(broken, callback)()).not.toThrow();
  });
});
