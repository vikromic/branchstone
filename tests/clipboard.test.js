// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "../src/domain/clipboard.js";

afterEach(() => {
  vi.restoreAllMocks();
  document.querySelectorAll(".clipboard-copy-helper").forEach((element) => element.remove());
});

describe("clipboard handoff", () => {
  it("falls back when the exposed Clipboard API rejects", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    document.execCommand = vi.fn(() => true);

    await copyText("Branchstone note");

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Branchstone note");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector(".clipboard-copy-helper")).toBeNull();
  });

  it("cleans up the fallback helper when copying is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    document.execCommand = vi.fn(() => false);

    await expect(copyText("Branchstone note")).rejects.toThrow("copy unavailable");
    expect(document.querySelector(".clipboard-copy-helper")).toBeNull();
  });
});
