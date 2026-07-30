// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteProvider, useSite } from "../src/app/SiteContext.jsx";
import {
  readEnvelope,
  storageKeys,
  storageTtls,
  writeEnvelope,
} from "../src/domain/storage.js";
import { CommissionsPage } from "../src/pages/CommissionsPage.jsx";
import { ContactPage } from "../src/pages/ContactPage.jsx";

vi.mock("../src/app/SiteShell.jsx", () => ({
  SiteShell: ({ children }) => <main data-testid="site-shell">{children}</main>,
}));

const NOW = 2_000_000_000_000;

function installLocalStorage() {
  const values = new Map();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key) => values.get(String(key)) ?? null,
      removeItem: (key) => values.delete(String(key)),
      setItem: (key, value) => values.set(String(key), String(value)),
    },
  });
}

function LocaleSwitch() {
  const { locale, setLocale } = useSite();
  return (
    <button data-testid="locale-switch" type="button" onClick={() => setLocale(locale === "en" ? "uk" : "en")}>
      {locale}
    </button>
  );
}

function renderPage(page, initialLocale = "en") {
  return render(
    <SiteProvider initialLocale={initialLocale}>
      <LocaleSwitch />
      {page}
    </SiteProvider>,
  );
}

describe("temporary storage contracts", () => {
  beforeEach(() => {
    installLocalStorage();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/about.html?lang=en");
    document.body.dataset.page = "about";
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the one-hour and 24-hour TTLs in one contract", () => {
    expect(storageTtls).toEqual({
      pendingInquiry: 60 * 60 * 1000,
      commissionDraft: 24 * 60 * 60 * 1000,
    });

    const inquiry = { artworks: [{ id: "july-pines" }] };
    writeEnvelope(storageKeys.pendingInquiry, inquiry, NOW - storageTtls.pendingInquiry + 1);
    expect(readEnvelope(storageKeys.pendingInquiry)).toEqual(inquiry);

    writeEnvelope(storageKeys.pendingInquiry, inquiry, NOW - storageTtls.pendingInquiry);
    expect(readEnvelope(storageKeys.pendingInquiry)).toBeNull();
    expect(window.localStorage.getItem(storageKeys.pendingInquiry)).toBeNull();
  });

  it("purges both expired temporary envelopes when any SiteProvider mounts", async () => {
    writeEnvelope(
      storageKeys.pendingInquiry,
      { artworks: [{ id: "july-pines" }] },
      NOW - storageTtls.pendingInquiry,
    );
    writeEnvelope(
      storageKeys.commissionDraft,
      { data: { name: "Old" }, step: 0 },
      NOW - storageTtls.commissionDraft,
    );

    render(
      <SiteProvider initialLocale="en">
        <p>Unrelated page</p>
      </SiteProvider>,
    );

    await waitFor(() => {
      expect(window.localStorage.getItem(storageKeys.pendingInquiry)).toBeNull();
      expect(window.localStorage.getItem(storageKeys.commissionDraft)).toBeNull();
    });
  });
});

describe("commission form behavior", () => {
  beforeEach(() => {
    installLocalStorage();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/commissions.html?lang=en");
    document.body.dataset.page = "commissions";
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("requestAnimationFrame", (callback) => window.setTimeout(() => callback(0), 0));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("routes native form submission through the same validation and navigation as Continue", async () => {
    renderPage(<CommissionsPage />);
    const name = screen.getByLabelText(/Your name/);
    const email = screen.getByLabelText(/Email address/);
    const form = name.closest("form");
    await waitFor(() => expect(name).toBeEnabled());

    fireEvent.submit(form);
    expect(await screen.findByText("Please add your name.")).toBeInTheDocument();
    expect(screen.getByText("Please add your email address.")).toBeInTheDocument();

    fireEvent.change(name, { target: { value: "River Stone" } });
    fireEvent.change(email, { target: { value: "river@example.com" } });
    fireEvent.submit(form);

    const scaleHeading = await screen.findByRole("heading", { name: "How should the work meet the space?" });
    await waitFor(() => expect(scaleHeading).toHaveFocus());
    const continueButton = screen.getByRole("button", { name: /Continue/ });
    expect(continueButton).toHaveAttribute("type", "submit");
    fireEvent.click(continueButton);
    const directionHeading = await screen.findByRole("heading", { name: "What should the material carry?" });
    await waitFor(() => expect(directionHeading).toHaveFocus());
  });

  it("enforces live field limits and sanitizes an older restored draft to those same limits", async () => {
    const name = "N".repeat(140);
    const email = `${"e".repeat(290)}@example.com`;
    writeEnvelope(storageKeys.commissionDraft, {
      data: { name, email, commissionType: "open", scale: "intimate" },
      step: 0,
    });

    renderPage(<CommissionsPage />);
    const nameInput = await screen.findByLabelText(/Your name/);
    const emailInput = screen.getByLabelText(/Email address/);
    await waitFor(() => expect(screen.getByText("Your draft from this browser has been restored.")).toBeInTheDocument());

    expect(nameInput).toHaveAttribute("maxlength", "120");
    expect(emailInput).toHaveAttribute("maxlength", "254");
    expect(nameInput).toHaveValue(name.slice(0, 120));
    expect(emailInput).toHaveValue(email.slice(0, 254));
  });

  it("relocalizes existing validation errors and handoff status without revalidation", async () => {
    const view = renderPage(<CommissionsPage />);
    const name = screen.getByLabelText(/Your name/);
    await waitFor(() => expect(name).toBeEnabled());
    fireEvent.submit(name.closest("form"));
    expect(await screen.findByText("Please add your name.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("locale-switch"));
    expect(await screen.findByText("Додайте, будь ласка, ваше ім’я.")).toBeInTheDocument();
    expect(screen.queryByText("Please add your name.")).not.toBeInTheDocument();

    view.unmount();
    window.history.replaceState({}, "", "/commissions.html?lang=en");
    writeEnvelope(storageKeys.commissionDraft, {
      data: {
        name: "River Stone",
        email: "river@example.com",
        commissionType: "open",
        scale: "intimate",
      },
      step: 3,
    });
    renderPage(<CommissionsPage />);
    expect(await screen.findByRole("heading", { name: "Read the note before it leaves your hands." })).toBeInTheDocument();
    fireEvent.change(document.getElementById("commission-website"), { target: { value: "bot" } });
    fireEvent.click(screen.getByRole("button", { name: /Copy message instead/ }));
    expect(await screen.findByText("The request could not be prepared. Please check the required fields.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("locale-switch"));
    expect(await screen.findByText("Не вдалося підготувати запит. Перевірте обов’язкові поля.")).toBeInTheDocument();
    expect(screen.queryByText("The request could not be prepared. Please check the required fields.")).not.toBeInTheDocument();
  });

  it("keeps compact progress labels named for assistive technology in both locales", async () => {
    renderPage(<CommissionsPage />);
    const progress = screen.getByRole("progressbar", { name: "Request progress" });
    expect(progress).toHaveAttribute("aria-valuenow", "1");

    const list = screen.getByRole("list", { name: "Request steps" });
    const steps = within(list).getAllByRole("listitem");
    expect(steps.map((step) => step.getAttribute("aria-label"))).toEqual([
      "Correspondence",
      "Scale",
      "Direction",
      "Review",
    ]);
    for (const step of steps) expect(step).toHaveAccessibleName();

    fireEvent.click(screen.getByTestId("locale-switch"));
    expect(await screen.findByRole("progressbar", { name: "Прогрес запиту" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Етапи запиту" })).toBeInTheDocument();
  });
});

describe("contact form localized status", () => {
  beforeEach(() => {
    installLocalStorage();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/contact.html?lang=en");
    document.body.dataset.page = "contact";
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("requestAnimationFrame", (callback) => window.setTimeout(() => callback(0), 0));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("relocalizes an existing invalid status when the locale changes", async () => {
    renderPage(<ContactPage />);
    const name = screen.getByLabelText(/Your name/);
    await waitFor(() => expect(name).toBeEnabled());
    fireEvent.submit(name.closest("form"));
    expect(await screen.findByText("Complete the first highlighted field before continuing.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("locale-switch"));
    expect(await screen.findByText("Заповніть перше виділене поле, перш ніж продовжити.")).toBeInTheDocument();
    expect(screen.queryByText("Complete the first highlighted field before continuing.")).not.toBeInTheDocument();
  });

  it("removes only the generated artwork sentence while preserving the visitor's note", async () => {
    const generatedMessage = "Hello, I’m interested in the original work “Born Of Burn.” Please share its current availability and acquisition details.";
    window.history.replaceState({}, "", `/contact.html?art=born-of-burn&message=${encodeURIComponent(generatedMessage)}`);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderPage(<ContactPage />);
    const message = await screen.findByLabelText(/Message/);
    const visitorNote = "I would also like to ask about shipping to California.";
    await waitFor(() => expect(message).toHaveValue(generatedMessage));
    fireEvent.change(message, { target: { value: `${generatedMessage}\n\n${visitorNote}` } });

    fireEvent.click(screen.getByRole("button", { name: "Remove from this inquiry: Born Of Burn" }));

    await waitFor(() => expect(message).toHaveValue(visitorNote));
    expect(screen.queryByRole("button", { name: /Remove from this inquiry/ })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/Your name/)).toHaveFocus());

    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: "River Stone" } });
    fireEvent.change(screen.getByLabelText(/Your email/), { target: { value: "river@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const preparedLetter = writeText.mock.calls[0][0];
    expect(preparedLetter).toContain(visitorNote);
    expect(preparedLetter).not.toContain(generatedMessage);
    expect(preparedLetter).not.toContain("Works included:");
  });

  it.each([
    ["en", "I’m interested in these saved works and would like to know more about them.", "Please include shipping options.", /Message/, /Remove from this inquiry/],
    ["uk", "Мене цікавлять ці збережені роботи, і я хотів би дізнатися про них більше.", "Будь ласка, додайте варіанти доставки.", /Повідомлення/, /Прибрати із запиту/],
  ])("removes the generated %s group sentence only after the final saved work", async (locale, generatedMessage, visitorNote, messageLabel, removeLabel) => {
    window.history.replaceState({}, "", locale === "uk" ? "/uk/contact.html" : "/contact.html");
    writeEnvelope(storageKeys.pendingInquiry, {
      artworks: [{ id: "july-pines" }, { id: "magnet" }],
    });

    renderPage(<ContactPage />, locale);
    const message = await screen.findByLabelText(messageLabel);
    await waitFor(() => expect(message).toHaveValue(generatedMessage));
    fireEvent.change(message, { target: { value: `${generatedMessage}\n\n${visitorNote}` } });

    const firstRemove = (await screen.findAllByRole("button", { name: removeLabel }))[0];
    fireEvent.click(firstRemove);
    await waitFor(() => expect(message).toHaveValue(`${generatedMessage}\n\n${visitorNote}`));

    fireEvent.click(screen.getAllByRole("button", { name: removeLabel })[0]);
    await waitFor(() => expect(message).toHaveValue(visitorNote));
    expect(screen.queryByRole("button", { name: removeLabel })).not.toBeInTheDocument();
  });
});
