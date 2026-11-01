// Shared jsdom-environment helpers. Import only from tests that run under jsdom.
import { vi } from "vitest";

export function installLocalStorage() {
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

/** A `matchMedia` that matches nothing and never notifies. */
export function stubInertMatchMedia() {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

export class IntersectionObserverStub {
  static instances = [];

  constructor(callback) {
    this.callback = callback;
    IntersectionObserverStub.instances.push(this);
  }

  observe() {}

  unobserve() {}

  disconnect() {}

  trigger(entries) {
    for (const entry of entries) {
      if (!entry.target || !entry.boundingClientRect) continue;
      const { top = 0, height = 0 } = entry.boundingClientRect;
      entry.target.getBoundingClientRect = () => ({
        ...entry.boundingClientRect,
        top,
        height,
        bottom: entry.boundingClientRect.bottom ?? top + height,
      });
    }
    this.callback(entries);
  }
}

export function pointerEvent(type, pointerId, isPrimary = true, coordinates = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { configurable: true, value: pointerId },
    pointerType: { configurable: true, value: "touch" },
    isPrimary: { configurable: true, value: isPrimary },
    button: { configurable: true, value: 0 },
    clientX: { configurable: true, value: coordinates.clientX ?? 0 },
    clientY: { configurable: true, value: coordinates.clientY ?? 0 },
  });
  return event;
}
