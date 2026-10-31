import { describe, expect, it } from "vitest";
import { artworkContactHref, contactInquiryHref } from "../../src/domain/inquiry.js";

describe("inquiry contract", () => {
  it("keeps direct artwork inquiries inside the Ukrainian namespace", () => {
    const href = artworkContactHref({ id: "july-pines", name: "Липневі сосни" }, "uk", "original");
    expect(href).toMatch(/^\/uk\/contact\.html\?art=july-pines&message=/);
    expect(href).not.toContain("lang=");
  });

  it("keeps every saved artwork attached to a storage-fallback inquiry", () => {
    expect(contactInquiryHref("uk", "Вітаю", ["july-pines", "magnet"]))
      .toBe("/uk/contact.html?art=july-pines&art=magnet&message=%D0%92%D1%96%D1%82%D0%B0%D1%8E");
  });
});
