// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useModalLayer } from "../src/app/useModalLayer.js";

function ModalHarness({ revealed }) {
  const containerRef = useRef(null);
  const closeRef = useRef(null);
  useModalLayer({ containerRef, initialFocusRef: closeRef, onClose: vi.fn() });

  return (
    <div>
      <button type="button" data-testid="outside">Outside</button>
      <section ref={containerRef} role="dialog" aria-modal="true" tabIndex={-1}>
        <button ref={closeRef} type="button">Close</button>
        <button type="button">Reveal details</button>
        <div style={{ visibility: revealed ? "visible" : "hidden" }}>
          <a href="/contact.html" data-testid="inquire">Inquire</a>
        </div>
        <div style={{ display: "none" }}>
          <button type="button" data-testid="display-none-control">Display-none control</button>
        </div>
        <div hidden>
          <button type="button" data-testid="hidden-control">Hidden control</button>
        </div>
        <div inert>
          <button type="button" data-testid="inert-control">Inert control</button>
        </div>
      </section>
    </div>
  );
}

afterEach(() => cleanup());

describe("useModalLayer focus discovery", () => {
  it("excludes computed-hidden ancestors, includes revealed Inquire, and never lets the loop escape", () => {
    const { rerender } = render(<ModalHarness revealed={false} />);
    const close = screen.getByRole("button", { name: "Close" });
    const reveal = screen.getByRole("button", { name: "Reveal details" });
    const inquire = screen.getByTestId("inquire");

    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(reveal).toHaveFocus();

    reveal.focus();
    fireEvent.keyDown(reveal, { key: "Tab" });
    expect(close).toHaveFocus();

    rerender(<ModalHarness revealed />);
    close.focus();
    fireEvent.keyDown(close, { key: "Tab" });
    expect(reveal).toHaveFocus();

    fireEvent.keyDown(reveal, { key: "Tab" });
    expect(inquire).toHaveFocus();

    close.focus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(inquire).toHaveFocus();

    fireEvent.keyDown(inquire, { key: "Tab" });
    expect(close).toHaveFocus();

    screen.getByTestId("outside").focus();
    expect(close).toHaveFocus();
  });

  it("recovers immediately when the currently focused control becomes computed-hidden", async () => {
    const { rerender } = render(<ModalHarness revealed />);
    const close = screen.getByRole("button", { name: "Close" });
    const inquire = screen.getByRole("link", { name: "Inquire" });
    inquire.focus();
    expect(inquire).toHaveFocus();

    rerender(<ModalHarness revealed={false} />);
    await waitFor(() => expect(close).toHaveFocus());
  });
});
