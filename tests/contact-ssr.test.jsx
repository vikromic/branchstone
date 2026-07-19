import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteProvider } from "../src/app/SiteContext.jsx";
import { ContactPage } from "../src/pages/ContactPage.jsx";
import { CommissionsPage } from "../src/pages/CommissionsPage.jsx";

describe("contact progressive safety", () => {
  it("renders the pre-hydration form inert with a direct-email fallback", () => {
    const html = renderToString(
      <SiteProvider initialLocale="en"><ContactPage /></SiteProvider>,
    );

    expect(html).toMatch(/<fieldset[^>]*disabled/);
    expect(html).toContain("<noscript>");
    expect(html).toContain("mailto:thebranchstone@gmail.com");
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
