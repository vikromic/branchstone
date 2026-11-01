import { describe, expect, it } from "vitest";
import { localeHref } from "../../src/domain/locale.js";

describe("localized route contract", () => {
  it("uses real Ukrainian paths and preserves functional URL state", () => {
    expect(localeHref("/", "uk")).toBe("/uk/");
    expect(localeHref("/gallery.html?art=july-pines&collection=golden#work", "uk"))
      .toBe("/uk/gallery.html?art=july-pines&collection=golden#work");
  });

  it("removes both the path prefix and legacy language query for English", () => {
    expect(localeHref("/uk/contact.html?lang=uk&message=hello", "en"))
      .toBe("/contact.html?message=hello");
    expect(localeHref("/gallery.html?lang=uk&art=magnet", "uk"))
      .toBe("/uk/gallery.html?art=magnet");
  });
});
