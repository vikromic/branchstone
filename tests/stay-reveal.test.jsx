// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useLayoutEffect, useRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  StayArtworkImage,
  StayPhase,
  StayReveal,
  StayRevealControl,
  useStayReveal,
  useStayRevealContext,
} from "../src/features/stay/index.js";

function makeDeferredAnimation() {
  let resolve;
  let reject;
  const finished = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {
    animation: { finished, cancel: vi.fn() },
    resolve,
    reject,
  };
}

function HookHarness({ controllerRef, onAvailabilityAction, ...options }) {
  const controller = useStayReveal(options);
  controllerRef.current = controller;
  return (
    <main data-testid="root" {...controller.getRootProps()}>
      <button type="button">Close chrome</button>
      <button type="button" data-stay-reveal-on-focus>Reveal marker</button>
      <div data-testid="motion-surface" {...controller.getMotionSurfaceProps()}>
        Motion surface
      </div>
      <section data-testid="artwork" {...controller.getPhaseProps("artwork")}>
        <img
          data-testid="image"
          src="/active-work.webp"
          alt="Active work"
          {...controller.getArtworkImageProps()}
        />
        <button type="button">Active artwork</button>
      </section>
      <section data-testid="materials" {...controller.getPhaseProps("materials")}>
        Materials
      </section>
      <section data-testid="story" {...controller.getPhaseProps("story")}>
        Story
      </section>
      <section data-testid="availability" {...controller.getPhaseProps("availability")}>
        <button type="button" onClick={onAvailabilityAction}>Availability</button>
      </section>
    </main>
  );
}

function DescendantScrollHarness({ controllerRef }) {
  const layerRef = useRef(null);
  const controller = useStayReveal({
    activeKey: "earth",
    scrollTargetRef: layerRef,
    animatePhase: () => makeDeferredAnimation().animation,
  });
  controllerRef.current = controller;
  return (
    <div ref={layerRef} data-testid="scroll-layer">
      <main data-testid="root" {...controller.getRootProps()}>
        <section {...controller.getPhaseProps("artwork")}>Artwork</section>
        <div data-testid="descendant-scroll">Scrollable narrative</div>
        <section data-testid="materials" {...controller.getPhaseProps("materials")}>Materials</section>
        <section {...controller.getPhaseProps("story")}>Story</section>
        <section {...controller.getPhaseProps("availability")}>Availability</section>
      </main>
    </div>
  );
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function touchEvent(type, identifier, target) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "changedTouches", {
    configurable: true,
    value: [{ identifier, target }],
  });
  return event;
}

function pointerEvent(type, pointerId, pointerType = "touch", isPrimary = true) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { configurable: true, value: pointerId },
    pointerType: { configurable: true, value: pointerType },
    button: { configurable: true, value: 0 },
    isPrimary: { configurable: true, value: isPrimary },
  });
  return event;
}

function EarlySettle() {
  const controller = useStayRevealContext();
  useLayoutEffect(() => {
    controller.settle();
  }, []);
  return null;
}

function armAndSettle(controllerRef, source = "programmatic") {
  act(() => {
    controllerRef.current.motion.begin(source);
    controllerRef.current.motion.settle(source);
  });
}

describe("Stay reveal choreography", () => {
  let frames;
  let nextFrameId;

  beforeEach(() => {
    frames = new Map();
    nextFrameId = 1;
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      const id = nextFrameId;
      nextFrameId += 1;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id) => frames.delete(id));
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    document.documentElement.classList.add("stay-enhanced");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("stay-enhanced");
  });

  const runAnimationFrames = () => {
    act(() => {
      const queued = [...frames.entries()];
      frames.clear();
      for (const [, callback] of queued) callback(0);
    });
  };

  it("keeps server markup fully available without enhanced-only inert state", () => {
    const html = renderToString(
      <StayReveal activeKey="earth" reducedMotion={false} waitForArtwork>
        <StayPhase phase="artwork">
          <StayArtworkImage src="/earth.webp" alt="Earth" />
        </StayPhase>
        <StayPhase phase="materials">Wax and soil</StayPhase>
        <StayPhase phase="story">A story</StayPhase>
        <StayPhase phase="availability">Available</StayPhase>
      </StayReveal>,
    );

    expect(html).toContain('data-stay-state="pending"');
    expect(html).not.toContain(" inert");
    expect(html).not.toContain("aria-hidden");
  });

  it("fails open without matchMedia even when the enhancement marker is present", async () => {
    vi.stubGlobal("matchMedia", undefined);
    const controllerRef = { current: null };

    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        waitForArtwork
      />,
    );
    await flushMicrotasks();

    expect(screen.getByTestId("root")).toHaveAttribute("data-stay-fully-revealed", "true");
    for (const phase of ["materials", "story", "availability"]) {
      const node = screen.getByTestId(phase);
      expect(node).toHaveAttribute("data-stay-state", "resolved");
      expect(node.inert).toBe(false);
    }
  });

  it("keeps forced-resolved phases interactive across an active-key image change", async () => {
    const controllerRef = { current: null };
    const { rerender } = render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth:0"
        forceResolved
        waitForArtwork
      />,
    );
    await flushMicrotasks();

    rerender(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth:1"
        forceResolved
        waitForArtwork
      />,
    );
    await flushMicrotasks();

    expect(screen.getByTestId("root")).toHaveAttribute("data-stay-fully-revealed", "true");
    expect(screen.getByTestId("root")).toHaveAttribute("data-stay-image-state", "pending");
    for (const phase of ["materials", "story", "availability"]) {
      const node = screen.getByTestId(phase);
      expect(node).toHaveAttribute("data-stay-state", "resolved");
      expect(node.inert).toBe(false);
    }
  });

  it("restores enhanced choreography when a hydration-only force resolves", async () => {
    const controllerRef = { current: null };
    const { rerender } = render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        forceResolved
        settleOnMount
        waitForArtwork
      />,
    );
    await flushMicrotasks();
    expect(controllerRef.current.isEnhanced).toBe(false);
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");

    rerender(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        forceResolved={false}
        settleOnMount
        waitForArtwork
      />,
    );
    await flushMicrotasks();
    await flushMicrotasks();

    expect(controllerRef.current.isEnhanced).toBe(true);
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");
    expect(screen.getByTestId("materials").inert).toBe(true);
  });

  it("never makes a skipped phase inert while force-resolved", async () => {
    render(
      <HookHarness
        controllerRef={{ current: null }}
        activeKey="earth"
        forceResolved
        phasePresence={{ story: false }}
      />,
    );
    await flushMicrotasks();

    expect(screen.getByTestId("story")).toHaveAttribute("data-stay-state", "skipped");
    expect(screen.getByTestId("story").inert).toBe(false);
  });

  it("shares one reduced-motion media subscription across Stay roots", async () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener,
      removeEventListener,
    }));
    vi.stubGlobal("matchMedia", matchMedia);

    render(
      <>
        <HookHarness controllerRef={{ current: null }} activeKey="earth" />
        <HookHarness controllerRef={{ current: null }} activeKey="stone" />
      </>,
    );
    await flushMicrotasks();

    expect(matchMedia).toHaveBeenCalledTimes(1);
    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("keeps pristine ready artwork unarmed, then resolves in order after real motion", async () => {
    const controllerRef = { current: null };
    const deferred = new Map();
    const animatePhase = vi.fn((_node, { phase }) => {
      const animation = makeDeferredAnimation();
      deferred.set(phase, animation);
      return animation.animation;
    });
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        waitForArtwork
        animatePhase={animatePhase}
      />,
    );

    runAnimationFrames();
    await flushMicrotasks();
    expect(screen.getByTestId("artwork")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    fireEvent.load(screen.getByTestId("image"));
    await flushMicrotasks();
    expect(screen.getByTestId("root")).toHaveAttribute("data-stay-armed", "false");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    armAndSettle(controllerRef);
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
    expect(animatePhase).toHaveBeenLastCalledWith(
      screen.getByTestId("materials"),
      expect.objectContaining({ phase: "materials", activeKey: "earth" }),
    );

    deferred.get("materials").resolve();
    await flushMicrotasks();
    expect(screen.getByTestId("story")).toHaveAttribute("data-stay-state", "entering");
    deferred.get("story").resolve();
    await flushMicrotasks();
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "entering");
    deferred.get("availability").resolve();
    await flushMicrotasks();

    expect(controllerRef.current.isFullyRevealed).toBe(true);
    expect([...deferred.keys()]).toEqual(["materials", "story", "availability"]);
  });

  it("runs the ordered reveal when the visible Stay control is activated", async () => {
    const deferred = new Map();
    const animatePhase = vi.fn((_node, { phase }) => {
      const animation = makeDeferredAnimation();
      deferred.set(phase, animation);
      return animation.animation;
    });

    render(
      <StayReveal activeKey="earth" animatePhase={animatePhase}>
        <StayPhase phase="artwork">Artwork</StayPhase>
        <StayRevealControl>Release the seam</StayRevealControl>
        <StayPhase phase="materials">Materials</StayPhase>
        <StayPhase phase="story">Story</StayPhase>
        <StayPhase phase="availability">Availability</StayPhase>
      </StayReveal>,
    );

    const control = screen.getByRole("button", { name: "Release the seam" });
    fireEvent.focus(control);
    expect(screen.getByText("Materials")).toHaveAttribute("data-stay-state", "pending");

    fireEvent.click(control);
    await flushMicrotasks();

    expect(screen.getByText("Materials")).toHaveAttribute("data-stay-state", "entering");
    expect(screen.getByText("Story")).toHaveAttribute("data-stay-state", "pending");
    expect(screen.getByText("Availability")).toHaveAttribute("data-stay-state", "pending");
    expect(deferred.has("materials")).toBe(true);
  });

  it("reconciles a settle that occurs before the passive mount lifecycle", async () => {
    const deferred = new Map();
    render(
      <StayReveal
        activeKey="earth"
        animatePhase={(_node, { phase }) => {
          const animation = makeDeferredAnimation();
          deferred.set(phase, animation);
          return animation.animation;
        }}
      >
        <EarlySettle />
        <StayPhase phase="artwork">Artwork</StayPhase>
        <StayPhase phase="materials">Materials</StayPhase>
        <StayPhase phase="story">Story</StayPhase>
        <StayPhase phase="availability">Availability</StayPhase>
      </StayReveal>,
    );
    await flushMicrotasks();

    expect(screen.getByText("Materials")).toHaveAttribute("data-stay-state", "entering");
    expect(deferred.has("materials")).toBe(true);
  });

  it("synchronously resets to artwork, cancels owned WAAPI, and waits for every source/contact", async () => {
    const controllerRef = { current: null };
    const deferred = [];
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        animatePhase={() => {
          const animation = makeDeferredAnimation();
          deferred.push(animation);
          return animation.animation;
        }}
      />,
    );
    armAndSettle(controllerRef);
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");

    act(() => {
      controllerRef.current.motion.begin("carousel");
      controllerRef.current.motion.begin("pointer", { token: 7, contact: true });
      expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");
      expect(screen.getByTestId("materials").inert).toBe(true);
      expect(deferred[0].animation.cancel).toHaveBeenCalledOnce();
    });

    act(() => controllerRef.current.motion.settle("pointer", { token: 7, contact: true }));
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    act(() => controllerRef.current.motion.settle("carousel"));
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("re-arms the reveal after a batched reset-settle ABA transition", async () => {
    const controllerRef = { current: null };
    let interruptFirstMaterialsEntry = true;
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        animatePhase={() => makeDeferredAnimation().animation}
        onPhaseChange={(phase, state) => {
          if (phase !== "materials" || state !== "entering" || !interruptFirstMaterialsEntry) return;
          interruptFirstMaterialsEntry = false;
          controllerRef.current.motion.begin("scroll", { token: "late-scroll" });
          controllerRef.current.motion.settle("scroll", { token: "late-scroll" });
        }}
      />,
    );

    armAndSettle(controllerRef);
    await flushMicrotasks();

    expect(interruptFirstMaterialsEntry).toBe(false);
    expect(screen.getByTestId("root")).toHaveAttribute("data-stay-still", "true");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("cancels and re-hides in the active-key commit before selection settles", async () => {
    const controllerRef = { current: null };
    const first = makeDeferredAnimation();
    const { rerender } = render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        animatePhase={() => first.animation}
      />,
    );
    armAndSettle(controllerRef);
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");

    rerender(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="stone"
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    expect(first.animation.cancel).toHaveBeenCalledOnce();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");
    expect(screen.getByTestId("materials").inert).toBe(true);
  });

  it("keeps revealed actions clickable across pointer, Tab, and Enter input", async () => {
    const controllerRef = { current: null };
    const onAvailabilityAction = vi.fn();
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        onAvailabilityAction={onAvailabilityAction}
      />,
    );
    act(() => controllerRef.current.revealAll("test"));
    const action = screen.getByRole("button", { name: "Availability" });

    fireEvent.pointerDown(action, { pointerId: 9, pointerType: "mouse", button: 0 });
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("availability").inert).toBe(false);
    fireEvent.pointerUp(action, { pointerId: 9, pointerType: "mouse", button: 0 });
    fireEvent.click(action);
    expect(onAvailabilityAction).toHaveBeenCalledOnce();

    fireEvent(action, pointerEvent("pointerdown", 10, "touch"));
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("availability").inert).toBe(false);
    fireEvent(action, pointerEvent("pointerup", 10, "touch"));
    fireEvent.click(action);
    expect(onAvailabilityAction).toHaveBeenCalledTimes(2);

    fireEvent(action, touchEvent("touchstart", 11, action));
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("availability").inert).toBe(false);
    fireEvent(action, touchEvent("touchend", 11, action));
    fireEvent.click(action);
    expect(onAvailabilityAction).toHaveBeenCalledTimes(3);

    fireEvent.keyDown(action, { key: "Tab", code: "Tab" });
    fireEvent.keyUp(action, { key: "Tab", code: "Tab" });
    fireEvent.keyDown(action, { key: "Enter", code: "Enter" });
    fireEvent.keyUp(action, { key: "Enter", code: "Enter" });
    fireEvent.click(action);
    expect(onAvailabilityAction).toHaveBeenCalledTimes(4);
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("availability").inert).toBe(false);
  });

  it("does not treat keyboard focus scrolling to a revealed phase as new browsing motion", () => {
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        observeWindowScroll
      />,
    );
    act(() => controllerRef.current.revealAll("test"));
    const root = screen.getByTestId("root");
    const revealControl = screen.getByRole("button", { name: "Reveal marker" });
    const action = screen.getByRole("button", { name: "Availability" });

    fireEvent.keyDown(revealControl, { key: "Tab", code: "Tab" });
    action.focus();
    fireEvent.scroll(window);

    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("availability").inert).toBe(false);

    fireEvent.wheel(root);
    fireEvent.scroll(window);
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "pending");
    expect(screen.getByTestId("availability").inert).toBe(true);
  });

  it("still interrupts from an explicitly marked motion surface", async () => {
    const controllerRef = { current: null };
    render(<HookHarness controllerRef={controllerRef} activeKey="earth" />);
    act(() => controllerRef.current.revealAll("test"));
    const surface = screen.getByTestId("motion-surface");

    fireEvent.pointerDown(surface, { pointerId: 10, pointerType: "mouse", button: 0 });
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");
    expect(screen.getByTestId("materials").inert).toBe(true);
  });

  it("waits for native scrollend instead of treating an inter-frame pause as a stop", async () => {
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    await flushMicrotasks();

    const root = screen.getByTestId("root");
    Object.defineProperty(root, "onscrollend", { configurable: true, value: null });
    Object.defineProperty(root, "scrollTop", { configurable: true, writable: true, value: 10 });
    fireEvent.scroll(root);
    for (let index = 0; index < 8; index += 1) runAnimationFrames();
    await flushMicrotasks();

    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    root.dispatchEvent(new Event("scrollend", { bubbles: true }));
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("keeps canceled native-scroll contact unknown until scrollend", async () => {
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        epsilon={0.5}
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    runAnimationFrames();
    await flushMicrotasks();

    const root = screen.getByTestId("root");
    Object.defineProperty(root, "scrollTop", { configurable: true, writable: true, value: 10 });
    fireEvent.scroll(root);
    root.dispatchEvent(touchEvent("touchstart", 42, root));
    root.scrollTop = 14;
    runAnimationFrames();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    root.dispatchEvent(touchEvent("touchcancel", 42, root));
    runAnimationFrames();
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");
    expect(root).toHaveAttribute("data-stay-contact-state", "unknown");

    root.dispatchEvent(new Event("scrollend", { bubbles: true }));
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("uses position stability as the legacy fallback when scrollend is unavailable", async () => {
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    await flushMicrotasks();

    const root = screen.getByTestId("root");
    vi.stubGlobal("onscrollend", undefined);
    Object.defineProperty(root, "onscrollend", { configurable: true, value: undefined });
    Object.defineProperty(root, "scrollTop", { configurable: true, writable: true, value: 8 });
    root.dispatchEvent(touchEvent("touchstart", 17, root));
    root.dispatchEvent(touchEvent("touchcancel", 17, root));
    expect(root).toHaveAttribute("data-stay-contact-state", "unknown");

    root.scrollTop = 24;
    fireEvent.scroll(root);
    for (let index = 0; index < 5; index += 1) runAnimationFrames();
    await flushMicrotasks();

    expect(root).toHaveAttribute("data-stay-contact-state", "idle");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("keeps an owned canceled touch pointer fail-closed when a TouchEvent reuses its numeric id", async () => {
    const controllerRef = { current: null };
    render(
      <>
        <button type="button" data-testid="outside">Outside</button>
        <HookHarness
          controllerRef={controllerRef}
          activeKey="earth"
          animatePhase={() => makeDeferredAnimation().animation}
        />
      </>,
    );
    await flushMicrotasks();

    const root = screen.getByTestId("root");
    const surface = screen.getByTestId("motion-surface");
    fireEvent(surface, pointerEvent("pointerdown", 42));
    fireEvent(surface, pointerEvent("pointercancel", 42));
    fireEvent(surface, pointerEvent("lostpointercapture", 42));
    await flushMicrotasks();

    expect(root).toHaveAttribute("data-stay-contact-state", "unknown");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    screen.getByTestId("outside").dispatchEvent(
      touchEvent("touchend", 42, screen.getByTestId("outside")),
    );
    await flushMicrotasks();

    expect(root).toHaveAttribute("data-stay-contact-state", "unknown");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    root.dispatchEvent(new Event("scrollend", { bubbles: true }));
    await flushMicrotasks();
    expect(root).toHaveAttribute("data-stay-contact-state", "idle");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("settles the specific descendant that emitted native scrollend", async () => {
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    await flushMicrotasks();

    const surface = screen.getByTestId("motion-surface");
    Object.defineProperty(surface, "onscrollend", { configurable: true, value: null });
    fireEvent.scroll(surface);
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    surface.dispatchEvent(new Event("scrollend", { bubbles: true }));
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("releases a canceled contact with the descendant scroller that actually stops", async () => {
    const controllerRef = { current: null };
    render(<DescendantScrollHarness controllerRef={controllerRef} />);
    await flushMicrotasks();

    const root = screen.getByTestId("root");
    const record = screen.getByTestId("descendant-scroll");
    Object.defineProperty(record, "onscrollend", { configurable: true, value: null });
    fireEvent(record, pointerEvent("pointerdown", 73));
    fireEvent.scroll(record);
    fireEvent(record, pointerEvent("pointercancel", 73));
    await flushMicrotasks();

    expect(root).toHaveAttribute("data-stay-contact-state", "unknown");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    record.dispatchEvent(new Event("scrollend", { bubbles: true }));
    await flushMicrotasks();
    expect(root).toHaveAttribute("data-stay-contact-state", "idle");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("owns a canceled touch safely while the viewport scroll is still active", async () => {
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        observeWindowScroll
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    await flushMicrotasks();

    const root = screen.getByTestId("root");
    const surface = screen.getByTestId("motion-surface");
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    fireEvent.scroll(window);
    fireEvent(surface, pointerEvent("pointerdown", 74));
    expect(() => fireEvent(surface, pointerEvent("pointercancel", 74))).not.toThrow();
    await flushMicrotasks();

    expect(root).toHaveAttribute("data-stay-contact-state", "unknown");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    window.dispatchEvent(new Event("scrollend"));
    await flushMicrotasks();
    expect(root).toHaveAttribute("data-stay-contact-state", "idle");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("recovers a canceled non-scrolling primary contact on the next clean gesture", async () => {
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    await flushMicrotasks();

    const root = screen.getByTestId("root");
    const surface = screen.getByTestId("motion-surface");
    fireEvent(surface, pointerEvent("pointerdown", 41));
    fireEvent(surface, pointerEvent("pointercancel", 41));
    expect(root).toHaveAttribute("data-stay-contact-state", "unknown");

    fireEvent(surface, pointerEvent("pointerdown", 52));
    fireEvent(surface, pointerEvent("pointerup", 52));
    await flushMicrotasks();

    expect(root).toHaveAttribute("data-stay-contact-state", "idle");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("recovers a blurred window-owned contact on the next clean gesture", async () => {
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        observeWindowScroll
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    await flushMicrotasks();

    const root = screen.getByTestId("root");
    const surface = screen.getByTestId("motion-surface");
    fireEvent(surface, pointerEvent("pointerdown", 61));
    fireEvent.blur(window);
    await flushMicrotasks();
    expect(root).toHaveAttribute("data-stay-contact-state", "unknown");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    fireEvent(surface, pointerEvent("pointerdown", 62));
    fireEvent(surface, pointerEvent("pointerup", 62));
    await flushMicrotasks();

    expect(root).toHaveAttribute("data-stay-contact-state", "idle");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
  });

  it("skips empty phases and lets an image error unlock a neutral reveal", async () => {
    const controllerRef = { current: null };
    const animatePhase = vi.fn(() => makeDeferredAnimation().animation);
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        waitForArtwork
        phasePresence={{ materials: false, story: false, availability: true }}
        animatePhase={animatePhase}
      />,
    );
    runAnimationFrames();
    fireEvent.error(screen.getByTestId("image"));
    armAndSettle(controllerRef);
    await flushMicrotasks();

    expect(controllerRef.current.artworkImageState).toBe("error");
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "skipped");
    expect(screen.getByTestId("story")).toHaveAttribute("data-stay-state", "skipped");
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "entering");
    expect(animatePhase).toHaveBeenCalledWith(
      screen.getByTestId("availability"),
      expect.objectContaining({ phase: "availability" }),
    );
  });

  it("keeps inactive roots pending, then auto-settles a real inactive-to-active selection pulse", async () => {
    const controllerRef = { current: null };
    const animatePhase = vi.fn(() => makeDeferredAnimation().animation);
    const { rerender } = render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        active={false}
        animatePhase={animatePhase}
      />,
    );
    runAnimationFrames();
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");
    expect(animatePhase).not.toHaveBeenCalled();
    fireEvent.focusIn(screen.getByRole("button", { name: "Active artwork" }));
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");

    rerender(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        active
        animatePhase={animatePhase}
      />,
    );
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");
    expect(animatePhase).not.toHaveBeenCalled();

    runAnimationFrames();
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "entering");
    expect(animatePhase).toHaveBeenCalledWith(
      screen.getByTestId("materials"),
      expect.objectContaining({ phase: "materials", activeKey: "earth" }),
    );
  });

  it("resolves every phase and removes inert in reduced motion and on artwork focus", async () => {
    const controllerRef = { current: null };
    const animatePhase = vi.fn();
    const { rerender } = render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        reducedMotion
        animatePhase={animatePhase}
      />,
    );
    await flushMicrotasks();
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("availability").inert).toBe(false);
    expect(animatePhase).not.toHaveBeenCalled();

    rerender(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        reducedMotion={false}
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    await flushMicrotasks();
    fireEvent.focusIn(screen.getByRole("button", { name: "Close chrome" }));
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "pending");
    fireEvent.focusIn(screen.getByRole("button", { name: "Active artwork" }));
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("availability").inert).toBe(false);

    act(() => controllerRef.current.motion.begin("programmatic"));
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "pending");
    fireEvent.focusIn(screen.getByRole("button", { name: "Reveal marker" }));
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
  });

  it("does not misreport a pending artwork image as broken when focus reveals the narrative", async () => {
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        waitForArtwork
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    await flushMicrotasks();

    expect(screen.getByTestId("image")).toHaveAttribute("data-stay-image-state", "pending");
    fireEvent.focusIn(screen.getByRole("button", { name: "Active artwork" }));

    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("availability").inert).toBe(false);
    expect(screen.getByTestId("root")).toHaveAttribute("data-stay-image-state", "pending");
    expect(screen.getByTestId("image")).toHaveAttribute("data-stay-image-state", "pending");

    fireEvent.load(screen.getByTestId("image"));
    expect(screen.getByTestId("root")).toHaveAttribute("data-stay-image-state", "ready");
    expect(screen.getByTestId("image")).toHaveAttribute("data-stay-image-state", "ready");
  });

  it("keeps a stalled image pending when the watchdog releases the narrative", async () => {
    vi.useFakeTimers();
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        waitForArtwork
        watchdogMs={1900}
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    armAndSettle(controllerRef);
    await flushMicrotasks();

    fireEvent.focusIn(screen.getByRole("button", { name: "Active artwork" }));
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("image")).toHaveAttribute("data-stay-image-state", "pending");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1900);
    });
    await flushMicrotasks();

    expect(screen.getByTestId("image")).toHaveAttribute("data-stay-image-state", "pending");
    expect(controllerRef.current.failure).toBe("watchdog");
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");

    fireEvent.load(screen.getByTestId("image"));
    expect(screen.getByTestId("image")).toHaveAttribute("data-stay-image-state", "ready");
  });

  it("treats AbortError as artwork reset and non-abort failures as fail-open", async () => {
    const controllerRef = { current: null };
    const first = makeDeferredAnimation();
    const { rerender } = render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        animatePhase={() => first.animation}
      />,
    );
    armAndSettle(controllerRef);
    await flushMicrotasks();

    first.reject(new DOMException("Interrupted", "AbortError"));
    await flushMicrotasks();
    expect(screen.getByTestId("materials")).toHaveAttribute("data-stay-state", "pending");
    expect(controllerRef.current.failure).toBeNull();

    const second = makeDeferredAnimation();
    rerender(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="stone"
        animatePhase={() => second.animation}
      />,
    );
    runAnimationFrames();
    await flushMicrotasks();
    second.reject(new Error("Broken animation"));
    await flushMicrotasks();
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(controllerRef.current.failure).toBe("animation");
  });

  it("keeps the watchdog beyond the healthy 1.8s budget and fail-opens only afterward", async () => {
    vi.useFakeTimers();
    const controllerRef = { current: null };
    const deferred = makeDeferredAnimation();
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        watchdogMs={1900}
        animatePhase={() => deferred.animation}
      />,
    );
    armAndSettle(controllerRef);
    await flushMicrotasks();

    act(() => vi.advanceTimersByTime(1800));
    await flushMicrotasks();
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "pending");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    await flushMicrotasks();
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(controllerRef.current.failure).toBe("watchdog");
  });

  it("resolves narrative after the watchdog but waits for a native image outcome", async () => {
    vi.useFakeTimers();
    const controllerRef = { current: null };
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        waitForArtwork
        watchdogMs={1900}
        animatePhase={() => makeDeferredAnimation().animation}
      />,
    );
    armAndSettle(controllerRef);
    await flushMicrotasks();

    act(() => vi.advanceTimersByTime(1800));
    await flushMicrotasks();
    expect(screen.getByTestId("image")).toHaveAttribute("data-stay-image-state", "pending");
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "pending");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    await flushMicrotasks();

    expect(controllerRef.current.artworkImageState).toBe("pending");
    expect(screen.getByTestId("root")).toHaveAttribute("data-stay-image-state", "pending");
    expect(screen.getByTestId("image")).toHaveAttribute("data-stay-image-state", "pending");
    expect(screen.getByTestId("availability")).toHaveAttribute("data-stay-state", "resolved");
    expect(screen.getByTestId("availability").inert).toBe(false);
    expect(controllerRef.current.failure).toBe("watchdog");

    fireEvent.error(screen.getByTestId("image"));
    expect(controllerRef.current.artworkImageState).toBe("error");
    expect(screen.getByTestId("root")).toHaveAttribute("data-stay-image-state", "error");
    expect(screen.getByTestId("image")).toHaveAttribute("data-stay-image-state", "error");
  });

  it("returns an errored image to pending and ignores terminal events from a stale node", () => {
    const controllerRef = { current: null };
    const externalLoad = vi.fn();
    render(
      <HookHarness
        controllerRef={controllerRef}
        activeKey="earth"
        waitForArtwork
      />,
    );

    const currentImage = screen.getByTestId("image");
    fireEvent.error(currentImage);
    expect(controllerRef.current.artworkImageState).toBe("error");

    act(() => controllerRef.current.retryArtworkImage());
    expect(controllerRef.current.artworkImageState).toBe("pending");
    expect(currentImage).toHaveAttribute("data-stay-image-state", "pending");

    const staleImage = document.createElement("img");
    act(() => {
      controllerRef.current.getArtworkImageProps({ onLoad: externalLoad }).onLoad({
        currentTarget: staleImage,
      });
    });
    expect(controllerRef.current.artworkImageState).toBe("pending");
    expect(externalLoad).not.toHaveBeenCalled();

    fireEvent.load(currentImage);
    expect(controllerRef.current.artworkImageState).toBe("ready");
  });
});
