import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const STAY_PHASES = Object.freeze([
  "artwork",
  "materials",
  "story",
  "availability",
]);

const DEFAULT_TOKEN = Symbol("stay-default-motion-token");
const LEGACY_SCROLL_STABLE_FRAMES = 5;
const MINIMUM_WATCHDOG_MS = 1900;
const PHASE_INDEX = new Map(STAY_PHASES.map((phase, index) => [phase, index]));
const MOTION_SURFACE_SELECTOR = "[data-stay-motion-surface]";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function shouldResetForInteractionTarget(target, root) {
  const phase = target?.closest?.("[data-stay-phase]")?.getAttribute("data-stay-phase");
  const motionSurface = target?.closest?.(MOTION_SURFACE_SELECTOR);
  return phase === "artwork" || Boolean(motionSurface && root?.contains?.(motionSurface));
}

function containsDomNode(container, candidate) {
  return Boolean(
    container?.nodeType
    && candidate?.nodeType
    && typeof container.contains === "function"
    && container.contains(candidate),
  );
}

let sharedMotionFactory = null;
let sharedMotionMedia = null;
let sharedMotionHandler = null;
const sharedMotionSubscribers = new Set();

function detachSharedMotionHandler() {
  if (sharedMotionMedia && sharedMotionHandler) {
    sharedMotionMedia.removeEventListener?.("change", sharedMotionHandler);
  }
  sharedMotionHandler = null;
}

function attachSharedMotionHandler() {
  if (!sharedMotionMedia || sharedMotionHandler || !sharedMotionSubscribers.size) return;
  sharedMotionHandler = () => {
    for (const subscriber of sharedMotionSubscribers) subscriber();
  };
  sharedMotionMedia.addEventListener?.("change", sharedMotionHandler);
}

function getSharedMotionMedia() {
  const factory = typeof globalThis.matchMedia === "function" ? globalThis.matchMedia : null;
  if (factory === sharedMotionFactory) return sharedMotionMedia;
  detachSharedMotionHandler();
  sharedMotionFactory = factory;
  sharedMotionMedia = null;
  if (factory) {
    try {
      sharedMotionMedia = factory.call(globalThis, REDUCED_MOTION_QUERY);
    } catch {
      sharedMotionMedia = null;
    }
  }
  attachSharedMotionHandler();
  return sharedMotionMedia;
}

function readSharedReducedMotion() {
  return Boolean(getSharedMotionMedia()?.matches);
}

function subscribeSharedReducedMotion(subscriber) {
  getSharedMotionMedia();
  sharedMotionSubscribers.add(subscriber);
  attachSharedMotionHandler();
  return () => {
    sharedMotionSubscribers.delete(subscriber);
    if (!sharedMotionSubscribers.size) detachSharedMotionHandler();
  };
}

function assignRef(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref && typeof ref === "object") ref.current = value;
}

function composeHandlers(internalHandler, externalHandler) {
  if (!externalHandler) return internalHandler;
  return (event) => {
    internalHandler(event);
    externalHandler(event);
  };
}

function requestFrame(callback) {
  if (typeof globalThis.requestAnimationFrame === "function") {
    return { kind: "animation-frame", id: globalThis.requestAnimationFrame(callback) };
  }
  return { kind: "timeout", id: globalThis.setTimeout(callback, 0) };
}

function cancelFrame(handle) {
  if (!handle) return;
  if (handle.kind === "animation-frame" && typeof globalThis.cancelAnimationFrame === "function") {
    globalThis.cancelAnimationFrame(handle.id);
    return;
  }
  globalThis.clearTimeout(handle.id);
}

function readScrollPosition(target, explicitPosition) {
  if (explicitPosition) {
    return {
      x: Number(explicitPosition.x ?? explicitPosition.left ?? 0),
      y: Number(explicitPosition.y ?? explicitPosition.top ?? 0),
    };
  }
  return {
    x: Number(target?.scrollLeft ?? target?.scrollX ?? 0),
    y: Number(target?.scrollTop ?? target?.scrollY ?? 0),
  };
}

function supportsNativeScrollEnd(target) {
  const ownerWindow = target?.window === target
    ? target
    : target?.ownerDocument?.defaultView;
  return Boolean(
    target?.onscrollend !== undefined
    || ownerWindow?.onscrollend !== undefined,
  );
}

function normalizeAnimationResult(result) {
  if (!result) return [];
  const values = Array.isArray(result) ? result : [result];
  return values.flatMap((value) => {
    if (!value) return [];
    if (value.finished && typeof value.finished.then === "function") return [value];
    if (typeof value.then === "function") return [{ finished: value }];
    return [];
  });
}

function isFiniteAnimation(animation) {
  try {
    const timing = animation.effect?.getComputedTiming?.();
    return timing?.iterations !== Infinity;
  } catch {
    return true;
  }
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function makePresence(phasePresence) {
  return STAY_PHASES.map((phase, index) => {
    if (index === 0) return true;
    if (!phasePresence || !Object.hasOwn(phasePresence, phase)) return true;
    return Boolean(phasePresence[phase]);
  });
}

function presenceMask(presence) {
  return presence.reduce((mask, isPresent, index) => mask | (isPresent ? 1 << index : 0), 0);
}

function firstPendingPhase(completedThrough, presence) {
  for (let index = completedThrough + 1; index < STAY_PHASES.length; index += 1) {
    if (presence[index]) return index;
  }
  return null;
}

function initialSnapshot(activeKey, fullyResolved = false, generation = 0) {
  return {
    key: activeKey,
    generation,
    completedThrough: fullyResolved ? STAY_PHASES.length - 1 : 0,
    entering: null,
    isStill: fullyResolved,
    failure: null,
  };
}

/**
 * Coordinates the "Stay" reveal without owning layout or hiding semantic content.
 * The artwork is always phase zero. Later empty phases can be disabled through
 * phasePresence, while the canonical reveal order remains fixed.
 */
export function useStayReveal({
  activeKey = "stay",
  active = true,
  forceResolved = false,
  phasePresence,
  reducedMotion,
  settleOnMount = false,
  waitForArtwork = false,
  epsilon = 0.5,
  watchdogMs = 2400,
  animatePhase,
  onPhaseChange,
  scrollTargetRef,
  observeWindowScroll = false,
} = {}) {
  const [detectedReducedMotion, setDetectedReducedMotion] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const isReducedMotion = reducedMotion ?? detectedReducedMotion;
  const effectiveWatchdogMs = Math.max(
    MINIMUM_WATCHDOG_MS,
    Number.isFinite(Number(watchdogMs)) ? Number(watchdogMs) : 2400,
  );
  const presence = makePresence(phasePresence);
  const currentPresenceMask = presenceMask(presence);
  const presenceRef = useRef(presence);
  presenceRef.current = presence;

  const [snapshot, setSnapshot] = useState(() => initialSnapshot(
    activeKey,
    reducedMotion === true || forceResolved,
  ));
  const [artworkImageSnapshot, setArtworkImageSnapshot] = useState(() => ({
    key: activeKey,
    state: waitForArtwork ? "pending" : "ready",
  }));
  const renderedArtworkImageSnapshot = artworkImageSnapshot.key === activeKey
    ? artworkImageSnapshot
    : { key: activeKey, state: waitForArtwork ? "pending" : "ready" };
  const mustResolve = isReducedMotion || forceResolved;
  let renderedSnapshot = snapshot;
  if (snapshot.key !== activeKey || (!active && !mustResolve)) {
    renderedSnapshot = initialSnapshot(activeKey, mustResolve);
  }
  else if (mustResolve && snapshot.completedThrough < STAY_PHASES.length - 1) {
    renderedSnapshot = {
      ...snapshot,
      completedThrough: STAY_PHASES.length - 1,
      entering: null,
      isStill: true,
    };
  }

  const mountedRef = useRef(false);
  const rootRef = useRef(null);
  const artworkImageRef = useRef(null);
  const phaseNodesRef = useRef(new Map());
  const phaseRefCallbacksRef = useRef(new Map());
  const artworkRefCallbacksRef = useRef(new Map());
  const rootRefCallbacksRef = useRef(new Map());
  const cancelAnimationOnCommitRef = useRef(false);
  const snapshotRef = useRef(renderedSnapshot);
  snapshotRef.current = renderedSnapshot;
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const reducedMotionRef = useRef(isReducedMotion);
  reducedMotionRef.current = isReducedMotion;
  const forceResolvedRef = useRef(forceResolved);
  forceResolvedRef.current = forceResolved;
  const activeRef = useRef(active);
  activeRef.current = active;
  const armedRef = useRef(Boolean(settleOnMount && active));
  const keyboardFocusNavigationRef = useRef(false);
  const keyboardFocusNavigationTimerRef = useRef(null);
  const enhancedRef = useRef(isEnhanced);
  enhancedRef.current = isEnhanced;
  const activeSourcesRef = useRef(new Map());
  const activeContactsRef = useRef(new Map());
  const unknownContactsRef = useRef(new Set());
  const unknownContactTargetsRef = useRef(new Map());
  const scrollStatesRef = useRef(new Map());
  const pulseFramesRef = useRef(new Set());
  const activeAnimationsRef = useRef(new Set());
  const animationWatchdogsRef = useRef(new Set());
  const runIdRef = useRef(0);
  const awaitingRef = useRef(null);
  const previousKeyRef = useRef(activeKey);
  const previousActiveRef = useRef(active);
  const previousReducedMotionRef = useRef(isReducedMotion);
  const previousForceResolvedRef = useRef(forceResolved);
  const artworkImageStateRef = useRef(renderedArtworkImageSnapshot);
  artworkImageStateRef.current = renderedArtworkImageSnapshot;
  const animatePhaseRef = useRef(animatePhase);
  const onPhaseChangeRef = useRef(onPhaseChange);
  animatePhaseRef.current = animatePhase;
  onPhaseChangeRef.current = onPhaseChange;

  const clearKeyboardFocusNavigation = useCallback(() => {
    keyboardFocusNavigationRef.current = false;
    if (keyboardFocusNavigationTimerRef.current !== null) {
      globalThis.clearTimeout(keyboardFocusNavigationTimerRef.current);
      keyboardFocusNavigationTimerRef.current = null;
    }
  }, []);

  const syncSnapshotToDom = useCallback((nextSnapshot) => {
    const root = rootRef.current;
    const currentPresence = presenceRef.current;
    const currentPhaseIndex = nextSnapshot.entering ?? nextSnapshot.completedThrough;
    if (root) {
      root.dataset.stayCurrentPhase = STAY_PHASES[currentPhaseIndex];
      root.dataset.stayStill = nextSnapshot.isStill ? "true" : "false";
      root.dataset.stayFullyRevealed = firstPendingPhase(
        nextSnapshot.completedThrough,
        currentPresence,
      ) === null && nextSnapshot.entering === null
        ? "true"
        : "false";
      root.dataset.stayContactState = unknownContactsRef.current.size
        ? "unknown"
        : activeContactsRef.current.size
          ? "active"
          : "idle";
      root.dataset.stayArmed = armedRef.current ? "true" : "false";
    }
    for (let index = 0; index < STAY_PHASES.length; index += 1) {
      const phase = STAY_PHASES[index];
      const node = phaseNodesRef.current.get(phase);
      if (!node) continue;
      let state = "pending";
      if (!currentPresence[index]) state = "skipped";
      else if (nextSnapshot.completedThrough >= index) state = "resolved";
      else if (nextSnapshot.entering === index) state = "entering";
      node.dataset.stayState = state;
      node.dataset.stayVisible = state === "resolved" || state === "entering" ? "true" : "false";
      node.inert = Boolean(
        enhancedRef.current
        && !reducedMotionRef.current
        && !forceResolvedRef.current
        && state !== "resolved"
        && state !== "entering",
      );
    }
  }, []);

  const publish = useCallback((nextSnapshot) => {
    snapshotRef.current = nextSnapshot;
    syncSnapshotToDom(nextSnapshot);
    if (mountedRef.current) setSnapshot(nextSnapshot);
  }, [syncSnapshotToDom]);

  const publishArtworkImageState = useCallback((state) => {
    const next = { key: activeKeyRef.current, state };
    artworkImageStateRef.current = next;
    if (artworkImageRef.current) artworkImageRef.current.dataset.stayImageState = state;
    if (rootRef.current) rootRef.current.dataset.stayImageState = state;
    if (mountedRef.current) setArtworkImageSnapshot(next);
  }, []);

  const cancelReveal = useCallback(() => {
    runIdRef.current += 1;
    awaitingRef.current = null;
    for (const animation of activeAnimationsRef.current) {
      try {
        animation.cancel?.();
      } catch {
        // A broken animation must not prevent the semantic content from recovering.
      }
    }
    activeAnimationsRef.current.clear();
    for (const timeoutId of animationWatchdogsRef.current) globalThis.clearTimeout(timeoutId);
    animationWatchdogsRef.current.clear();
    return runIdRef.current;
  }, []);

  const allSourcesIdle = useCallback(() => {
    if (unknownContactsRef.current.size) return false;
    for (const tokens of activeSourcesRef.current.values()) {
      if (tokens.size) return false;
    }
    for (const tokens of activeContactsRef.current.values()) {
      if (tokens.size) return false;
    }
    return true;
  }, []);

  const discardUnknownContacts = useCallback(() => {
    unknownContactsRef.current.clear();
    unknownContactTargetsRef.current.clear();
  }, []);

  const revealAll = useCallback(
    (reason = "imperative") => {
      armedRef.current = true;
      discardUnknownContacts();
      const generation = cancelReveal();
      const current = snapshotRef.current;
      const next = {
        ...current,
        key: activeKeyRef.current,
        generation,
        completedThrough: STAY_PHASES.length - 1,
        entering: null,
        isStill: true,
        failure: reason === "animation" || reason === "watchdog" ? reason : null,
      };
      publish(next);
      onPhaseChangeRef.current?.(STAY_PHASES.at(-1), "resolved", reason);
    },
    [cancelReveal, discardUnknownContacts, publish],
  );

  const evaluateStillness = useCallback(() => {
    if (!activeRef.current && !reducedMotionRef.current) return false;
    if (!armedRef.current && !reducedMotionRef.current) return false;
    if (!allSourcesIdle()) return false;
    if (reducedMotionRef.current) {
      revealAll("reduced-motion");
      return true;
    }
    const current = snapshotRef.current;
    if (!current.isStill || current.key !== activeKeyRef.current) {
      publish({
        ...current,
        key: activeKeyRef.current,
        isStill: true,
      });
    }
    return true;
  }, [allSourcesIdle, publish, revealAll]);

  const resetToArtwork = useCallback(() => {
    const generation = cancelReveal();
    if (reducedMotionRef.current || forceResolvedRef.current) {
      revealAll(reducedMotionRef.current ? "reduced-motion" : "force-resolved");
      return;
    }
    publish(initialSnapshot(activeKeyRef.current, false, generation));
  }, [cancelReveal, publish, revealAll]);

  const begin = useCallback(
    (source, { token = DEFAULT_TOKEN, contact = false } = {}) => {
      if (!activeRef.current && !reducedMotionRef.current) return token;
      armedRef.current = true;
      if (source === "selection") discardUnknownContacts();
      const sourceTokens = activeSourcesRef.current.get(source) ?? new Set();
      sourceTokens.add(token);
      activeSourcesRef.current.set(source, sourceTokens);
      if (contact) {
        const contactTokens = activeContactsRef.current.get(source) ?? new Set();
        contactTokens.add(token);
        activeContactsRef.current.set(source, contactTokens);
      }
      resetToArtwork();
      return token;
    },
    [discardUnknownContacts, resetToArtwork],
  );

  const beginContact = useCallback(
    (source, token) => {
      if (!activeRef.current || reducedMotionRef.current) return;
      const contactTokens = activeContactsRef.current.get(source) ?? new Set();
      contactTokens.add(token);
      activeContactsRef.current.set(source, contactTokens);
      const current = snapshotRef.current;
      if (current.isStill) publish({ ...current, isStill: false });
      else if (rootRef.current) rootRef.current.dataset.stayContactState = "active";
    },
    [publish],
  );

  const end = useCallback(
    (source, { token = DEFAULT_TOKEN, contact = false } = {}) => {
      const sourceTokens = activeSourcesRef.current.get(source);
      sourceTokens?.delete(token);
      if (sourceTokens && !sourceTokens.size) activeSourcesRef.current.delete(source);
      if (contact) {
        const contactTokens = activeContactsRef.current.get(source);
        contactTokens?.delete(token);
        if (contactTokens && !contactTokens.size) activeContactsRef.current.delete(source);
      }
      evaluateStillness();
    },
    [evaluateStillness],
  );

  const clearSource = useCallback(
    (source) => {
      activeSourcesRef.current.delete(source);
      activeContactsRef.current.delete(source);
      evaluateStillness();
    },
    [evaluateStillness],
  );

  const pulse = useCallback(
    (source = "programmatic") => {
      const token = {};
      begin(source, { token });
      const frame = requestFrame(() => {
        pulseFramesRef.current.delete(frame);
        end(source, { token });
      });
      pulseFramesRef.current.add(frame);
      return () => {
        cancelFrame(frame);
        pulseFramesRef.current.delete(frame);
        end(source, { token });
      };
    },
    [begin, end],
  );

  const revealThrough = useCallback(
    (phase, reason = "focus") => {
      const index = PHASE_INDEX.get(phase);
      if (index === undefined) return;
      const current = snapshotRef.current;
      if (current.completedThrough >= index && current.entering !== index) return;
      const generation = cancelReveal();
      publish({
        ...current,
        key: activeKeyRef.current,
        generation,
        completedThrough: Math.max(current.completedThrough, index),
        entering: null,
        failure: null,
      });
      onPhaseChangeRef.current?.(phase, "resolved", reason);
    },
    [cancelReveal, publish],
  );

  const markArtworkReady = useCallback(
    (state = "ready") => {
      const normalizedState = state === "error" ? "error" : "ready";
      publishArtworkImageState(normalizedState);
    },
    [publishArtworkImageState],
  );

  const retryArtworkImage = useCallback(() => {
    publishArtworkImageState("pending");
  }, [publishArtworkImageState]);

  const getArtworkRef = useCallback((externalRef) => {
    if (!artworkRefCallbacksRef.current.has(externalRef)) {
      artworkRefCallbacksRef.current.set(externalRef, (node) => {
        artworkImageRef.current = node;
        assignRef(externalRef, node);
      });
    }
    return artworkRefCallbacksRef.current.get(externalRef);
  }, []);

  const getPhaseRef = useCallback((phase, externalRef) => {
    const cached = phaseRefCallbacksRef.current.get(phase);
    if (cached && cached.externalRef === externalRef) return cached.callback;
    const callback = (node) => {
      if (node) phaseNodesRef.current.set(phase, node);
      else phaseNodesRef.current.delete(phase);
      assignRef(externalRef, node);
    };
    phaseRefCallbacksRef.current.set(phase, { externalRef, callback });
    return callback;
  }, []);

  const getArtworkImageProps = useCallback(
    (props = {}) => {
      const {
        ref: externalRef,
        onLoad: externalLoad,
        onError: externalError,
        ...rest
      } = props;
      return {
        ...rest,
        ref: getArtworkRef(externalRef),
        onLoad: (event) => {
          if (event.currentTarget !== artworkImageRef.current) return;
          markArtworkReady("ready");
          externalLoad?.(event);
        },
        onError: (event) => {
          if (event.currentTarget !== artworkImageRef.current) return;
          markArtworkReady("error");
          externalError?.(event);
        },
        "data-stay-image-state": renderedArtworkImageSnapshot.state,
      };
    },
    [getArtworkRef, markArtworkReady, renderedArtworkImageSnapshot.state],
  );

  const getTrackedScrollTarget = useCallback(() => {
    if (observeWindowScroll) return rootRef.current?.ownerDocument?.defaultView ?? null;
    return scrollTargetRef?.current ?? rootRef.current;
  }, [observeWindowScroll, scrollTargetRef]);

  const getContactScrollTarget = useCallback((eventTarget) => {
    let onlyScrollTarget = null;
    for (const state of scrollStatesRef.current.values()) {
      if (onlyScrollTarget === null) onlyScrollTarget = state.target;
      else if (onlyScrollTarget !== state.target) onlyScrollTarget = false;
      if (
        state.target === eventTarget
        || containsDomNode(state.target, eventTarget)
        || containsDomNode(eventTarget, state.target)
      ) return state.target;
    }
    return onlyScrollTarget || getTrackedScrollTarget();
  }, [getTrackedScrollTarget]);

  const remapUnknownContactsToScrollTarget = useCallback((target) => {
    const trackedTarget = getTrackedScrollTarget();
    const ownerDocument = rootRef.current?.ownerDocument;
    const ownerWindow = ownerDocument?.defaultView;
    const targetBelongsToTrackedRoot = trackedTarget === target
      || containsDomNode(trackedTarget, target)
      || trackedTarget === ownerWindow && (
        target === ownerDocument
        || target === ownerDocument?.documentElement
        || target === ownerDocument?.scrollingElement
        || target === ownerDocument?.body
      );
    if (!targetBelongsToTrackedRoot) return;
    for (const [token, contactTarget] of unknownContactTargetsRef.current) {
      if (contactTarget === trackedTarget) unknownContactTargetsRef.current.set(token, target);
    }
  }, [getTrackedScrollTarget]);

  const releaseUnknownContactsForTarget = useCallback((target) => {
    for (const [token, contactTarget] of unknownContactTargetsRef.current) {
      if (contactTarget !== target) continue;
      unknownContactTargetsRef.current.delete(token);
      unknownContactsRef.current.delete(token);
    }
  }, []);

  const recoverCanceledPrimaryContact = useCallback((isPrimary) => {
    if (isPrimary === false || !unknownContactsRef.current.size) return;
    if (
      scrollStatesRef.current.size
      || activeSourcesRef.current.get("scroll")?.size
    ) return;
    discardUnknownContacts();
  }, [discardUnknownContacts]);

  const trackScroll = useCallback(
    (target, explicitPosition) => {
      const token = target ?? scrollStatesRef.current;
      const prior = scrollStatesRef.current.get(token);
      if (prior?.frame) cancelFrame(prior.frame);
      remapUnknownContactsToScrollTarget(target);

      const state = {
        target,
        explicitPosition,
        previous: readScrollPosition(target, explicitPosition),
        frame: null,
        stableFrames: 0,
      };
      scrollStatesRef.current.set(token, state);
      if (!prior) begin("scroll", { token });
      else if (
        snapshotRef.current.completedThrough > 0
        || snapshotRef.current.entering !== null
      ) resetToArtwork();

      // Native scrollend owns stillness where it exists. A one-frame position
      // pause can occur between momentum updates and is not a real stop.
      if (supportsNativeScrollEnd(target)) return;

      const verifyStableFrame = () => {
        state.frame = null;
        const current = readScrollPosition(state.target, state.explicitPosition);
        const delta = Math.max(
          Math.abs(current.x - state.previous.x),
          Math.abs(current.y - state.previous.y),
        );
        if (delta > Math.max(0, Number(epsilon) || 0)) {
          state.previous = current;
          state.stableFrames = 0;
          state.frame = requestFrame(verifyStableFrame);
          return;
        }
        state.stableFrames += 1;
        if (state.stableFrames < LEGACY_SCROLL_STABLE_FRAMES) {
          state.frame = requestFrame(verifyStableFrame);
          return;
        }
        scrollStatesRef.current.delete(token);
        releaseUnknownContactsForTarget(state.target);
        end("scroll", { token });
      };

      state.frame = requestFrame(verifyStableFrame);
    },
    [begin, end, epsilon, releaseUnknownContactsForTarget, remapUnknownContactsToScrollTarget, resetToArtwork],
  );

  const handleNativeScrollEnd = useCallback((event) => {
    const trackedTarget = getTrackedScrollTarget();
    if (!trackedTarget) return;
    const ownerDocument = rootRef.current?.ownerDocument;
    const ownerWindow = ownerDocument?.defaultView;
    const isTrackedWindowEvent = trackedTarget === ownerWindow
      ? event.target?.window === event.target
        || event.target === ownerWindow
        || event.target === ownerDocument
        || event.target === ownerDocument?.documentElement
        || event.target === ownerDocument?.scrollingElement
        || event.target === ownerDocument?.body
      : false;

    const scrollTokens = activeSourcesRef.current.get("scroll");
    const endedTargets = new Set();
    for (const [token, state] of scrollStatesRef.current) {
      const matchesEventTarget = state.target === event.target;
      const matchesTrackedWindow = isTrackedWindowEvent
        && (state.target === trackedTarget || token === trackedTarget);
      if (!matchesEventTarget && !matchesTrackedWindow) continue;
      cancelFrame(state.frame);
      scrollStatesRef.current.delete(token);
      scrollTokens?.delete(token);
      endedTargets.add(state.target);
    }
    const directlyBelongsToTarget = event.target === trackedTarget || isTrackedWindowEvent;
    if (!endedTargets.size && !directlyBelongsToTarget) return;
    if (scrollTokens && !scrollTokens.size) activeSourcesRef.current.delete("scroll");

    if (!endedTargets.size) endedTargets.add(trackedTarget);
    for (const target of endedTargets) releaseUnknownContactsForTarget(target);
    evaluateStillness();
  }, [evaluateStillness, getTrackedScrollTarget, releaseUnknownContactsForTarget]);

  const handlePointerDown = useCallback(
    (event) => {
      clearKeyboardFocusNavigation();
      const resetsArtwork = shouldResetForInteractionTarget(event.target, rootRef.current);
      if (event.pointerType === "touch") {
        recoverCanceledPrimaryContact(event.isPrimary);
        const token = `pointer-touch-${event.pointerId}`;
        if (resetsArtwork) begin("pointer-touch", { token, contact: true });
        else beginContact("pointer-touch", token);
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (resetsArtwork) {
        begin("pointer", { token: event.pointerId, contact: true });
      } else {
        beginContact("pointer", event.pointerId);
      }
    },
    [begin, beginContact, clearKeyboardFocusNavigation, recoverCanceledPrimaryContact],
  );

  const handlePointerEnd = useCallback(
    (event) => {
      if (event.pointerType === "touch") {
        const token = `pointer-touch-${event.pointerId}`;
        if (
          !activeSourcesRef.current.get("pointer-touch")?.has(token)
          && !activeContactsRef.current.get("pointer-touch")?.has(token)
          && !unknownContactsRef.current.has(token)
        ) return;
        unknownContactsRef.current.delete(token);
        unknownContactTargetsRef.current.delete(token);
        end("pointer-touch", { token, contact: true });
        return;
      }
      end("pointer", { token: event.pointerId, contact: true });
    },
    [end],
  );

  const handlePointerCancel = useCallback(
    (event) => {
      if (event.pointerType !== "touch") {
        handlePointerEnd(event);
        return;
      }
      const token = `pointer-touch-${event.pointerId}`;
      const sourceTokens = activeSourcesRef.current.get("pointer-touch");
      const contactTokens = activeContactsRef.current.get("pointer-touch");
      if (!sourceTokens?.has(token) && !contactTokens?.has(token) && !unknownContactsRef.current.has(token)) {
        return;
      }
      sourceTokens?.delete(token);
      if (sourceTokens && !sourceTokens.size) activeSourcesRef.current.delete("pointer-touch");
      contactTokens?.delete(token);
      if (contactTokens && !contactTokens.size) activeContactsRef.current.delete("pointer-touch");
      unknownContactsRef.current.add(token);
      unknownContactTargetsRef.current.set(token, getContactScrollTarget(event.target));
      resetToArtwork();
    },
    [getContactScrollTarget, handlePointerEnd, resetToArtwork],
  );

  const handleLostPointerCapture = useCallback(
    (event) => {
      if (event.pointerType !== "touch") {
        handlePointerEnd(event);
        return;
      }
      const token = `pointer-touch-${event.pointerId}`;
      if (unknownContactsRef.current.has(token)) return;
      if (
        activeSourcesRef.current.get("pointer-touch")?.has(token)
        || activeContactsRef.current.get("pointer-touch")?.has(token)
      ) handlePointerCancel(event);
    },
    [handlePointerCancel, handlePointerEnd],
  );

  const handleTouchStart = useCallback(
    (event) => {
      clearKeyboardFocusNavigation();
      if (activeSourcesRef.current.get("pointer-touch")?.size) return;
      recoverCanceledPrimaryContact(!event.touches || event.touches.length === 1);
      const resetsArtwork = shouldResetForInteractionTarget(event.target, rootRef.current);
      for (const touch of event.changedTouches ?? []) {
        const token = `touch-${touch.identifier}`;
        if (resetsArtwork) {
          begin("touch", { token, contact: true });
        } else {
          beginContact("touch", token);
        }
      }
    },
    [begin, beginContact, clearKeyboardFocusNavigation, recoverCanceledPrimaryContact],
  );

  const handleTouchEnd = useCallback(
    (event) => {
      for (const touch of event.changedTouches ?? []) {
        const token = `touch-${touch.identifier}`;
        if (
          !activeSourcesRef.current.get("touch")?.has(token)
          && !activeContactsRef.current.get("touch")?.has(token)
          && !unknownContactsRef.current.has(token)
        ) continue;
        unknownContactsRef.current.delete(token);
        unknownContactTargetsRef.current.delete(token);
        end("touch", { token, contact: true });
      }
    },
    [end],
  );

  const handleTouchCancel = useCallback(
    (event) => {
      for (const touch of event.changedTouches ?? []) {
        const token = `touch-${touch.identifier}`;
        const sourceTokens = activeSourcesRef.current.get("touch");
        const contactTokens = activeContactsRef.current.get("touch");
        if (!sourceTokens?.has(token) && !contactTokens?.has(token) && !unknownContactsRef.current.has(token)) {
          continue;
        }
        sourceTokens?.delete(token);
        if (sourceTokens && !sourceTokens.size) activeSourcesRef.current.delete("touch");
        contactTokens?.delete(token);
        if (contactTokens && !contactTokens.size) activeContactsRef.current.delete("touch");
        unknownContactsRef.current.add(token);
        unknownContactTargetsRef.current.set(token, getContactScrollTarget(event.target));
      }
      resetToArtwork();
    },
    [getContactScrollTarget, resetToArtwork],
  );

  const markActiveTouchesUnknown = useCallback(() => {
    let changed = false;
    for (const source of ["touch", "pointer-touch"]) {
      const tokens = activeContactsRef.current.get(source);
      for (const token of tokens ?? []) {
        changed = true;
        unknownContactsRef.current.add(token);
        unknownContactTargetsRef.current.set(token, getContactScrollTarget());
      }
      activeContactsRef.current.delete(source);
      activeSourcesRef.current.delete(source);
    }
    if (changed) resetToArtwork();
  }, [getContactScrollTarget, resetToArtwork]);

  const handleFocus = useCallback(
    (event) => {
      if (!activeRef.current && !reducedMotionRef.current) return;
      const revealOnFocus = event.target?.closest?.("[data-stay-reveal-on-focus]");
      if (revealOnFocus) {
        revealAll("focus");
        return;
      }
      const phaseElement = event.target?.closest?.("[data-stay-phase]");
      const phase = phaseElement?.getAttribute("data-stay-phase");
      if (!phase) return;
      if (phase === "artwork") revealAll("focus");
      else revealThrough(phase, "focus");
    },
    [revealAll, revealThrough],
  );

  const handleKeyDown = useCallback((event) => {
    clearKeyboardFocusNavigation();
    if (event.key !== "Tab") return;
    keyboardFocusNavigationRef.current = true;
    keyboardFocusNavigationTimerRef.current = globalThis.setTimeout(() => {
      keyboardFocusNavigationRef.current = false;
      keyboardFocusNavigationTimerRef.current = null;
    }, 750);
  }, [clearKeyboardFocusNavigation]);

  const handleWheel = clearKeyboardFocusNavigation;

  const trackBrowsingScroll = useCallback((target) => {
    if (keyboardFocusNavigationRef.current) return;
    trackScroll(target);
  }, [trackScroll]);

  const handleScroll = useCallback(
    (event) => trackBrowsingScroll(event.target ?? event.currentTarget),
    [trackBrowsingScroll],
  );

  const getPhaseState = useCallback(
    (phase) => {
      const index = PHASE_INDEX.get(phase);
      if (index === undefined) throw new Error(`Unknown Stay phase: ${phase}`);
      if (!presence[index]) return "skipped";
      if (mustResolve || renderedSnapshot.completedThrough >= index) return "resolved";
      if (renderedSnapshot.entering === index) return "entering";
      return "pending";
    },
    [currentPresenceMask, mustResolve, renderedSnapshot.completedThrough, renderedSnapshot.entering],
  );

  const getPhaseProps = useCallback(
    (phase, props = {}) => {
      const { ref: externalRef, inert: _externalInert, ...rest } = props;
      const state = getPhaseState(phase);
      const isPending = state !== "resolved" && state !== "entering";
      return {
        ...rest,
        ref: getPhaseRef(phase, externalRef),
        "data-stay-phase": phase,
        "data-stay-state": state,
        "data-stay-visible": state === "resolved" || state === "entering" ? "true" : "false",
        inert: Boolean(isEnhanced && !isReducedMotion && !forceResolved && isPending),
      };
    },
    [forceResolved, getPhaseRef, getPhaseState, isEnhanced, isReducedMotion],
  );

  const getMotionSurfaceProps = useCallback(
    (props = {}) => ({ ...props, "data-stay-motion-surface": "" }),
    [],
  );

  const cancelAnimationOnCommit = snapshot.key !== activeKey
    || previousActiveRef.current !== active
    || previousReducedMotionRef.current !== isReducedMotion;
  cancelAnimationOnCommitRef.current = cancelAnimationOnCommit;

  const getRootRef = useCallback((externalRef) => {
    if (!rootRefCallbacksRef.current.has(externalRef)) {
      rootRefCallbacksRef.current.set(externalRef, (node) => {
        rootRef.current = node;
        if (node && cancelAnimationOnCommitRef.current) cancelReveal();
        assignRef(externalRef, node);
      });
    }
    return rootRefCallbacksRef.current.get(externalRef);
  }, [cancelReveal]);

  const rootHandlers = useMemo(
    () => ({
      onPointerDownCapture: handlePointerDown,
      onPointerUpCapture: handlePointerEnd,
      onPointerCancelCapture: handlePointerCancel,
      onLostPointerCapture: handleLostPointerCapture,
      onFocusCapture: handleFocus,
      onKeyDownCapture: handleKeyDown,
      onScrollCapture: handleScroll,
      onWheelCapture: handleWheel,
    }),
    [
      handleFocus,
      handleKeyDown,
      handlePointerDown,
      handlePointerEnd,
      handlePointerCancel,
      handleLostPointerCapture,
      handleScroll,
      handleWheel,
    ],
  );

  const getRootProps = useCallback(
    (props = {}) => {
      const { ref: externalRef, ...rest } = props;
      const currentPhase = STAY_PHASES[renderedSnapshot.entering ?? renderedSnapshot.completedThrough];
      const nextProps = {
        ...rest,
        ref: getRootRef(externalRef),
        "data-stay-root": "",
        "data-stay-active": active ? "true" : "false",
        "data-stay-armed": armedRef.current ? "true" : "false",
        "data-stay-contact-state": unknownContactsRef.current.size
          ? "unknown"
          : activeContactsRef.current.size
            ? "active"
            : "idle",
        "data-stay-current-phase": currentPhase,
        "data-stay-still": renderedSnapshot.isStill ? "true" : "false",
        "data-stay-reduced-motion": isReducedMotion ? "true" : "false",
        "data-stay-image-state": renderedArtworkImageSnapshot.state,
        "data-stay-fully-revealed": firstPendingPhase(
          renderedSnapshot.completedThrough,
          presence,
        ) === null && renderedSnapshot.entering === null
          ? "true"
          : "false",
      };
      for (const [name, internalHandler] of Object.entries(rootHandlers)) {
        nextProps[name] = composeHandlers(internalHandler, rest[name]);
      }
      return nextProps;
    },
    [
      active,
      currentPresenceMask,
      getRootRef,
      isReducedMotion,
      renderedArtworkImageSnapshot.state,
      renderedSnapshot,
      rootHandlers,
    ],
  );

  useEffect(() => {
    mountedRef.current = true;
    setSnapshot(snapshotRef.current);
    setArtworkImageSnapshot(artworkImageStateRef.current);
    const canQueryMotionPreference = typeof globalThis.matchMedia === "function";
    const mediaMatches = canQueryMotionPreference && readSharedReducedMotion();
    const enhancementClassPresent = Boolean(
      globalThis.document?.documentElement?.classList?.contains("stay-enhanced"),
    );
    const enhanced = enhancementClassPresent
      && canQueryMotionPreference
      && !mediaMatches
      && !forceResolvedRef.current
      && reducedMotion !== true;
    enhancedRef.current = enhanced;
    setIsEnhanced(enhanced);
    if (enhanced) evaluateStillness();
    else if (forceResolvedRef.current) revealAll("force-resolved");
    else revealAll(mediaMatches || reducedMotion === true ? "reduced-motion" : "fallback");
    return () => {
      mountedRef.current = false;
      cancelReveal();
      clearKeyboardFocusNavigation();
      for (const state of scrollStatesRef.current.values()) cancelFrame(state.frame);
      scrollStatesRef.current.clear();
      for (const frame of pulseFramesRef.current) cancelFrame(frame);
      pulseFramesRef.current.clear();
    };
    // The mount lifecycle intentionally runs once. Runtime values live in refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reducedMotion !== undefined || typeof globalThis.matchMedia !== "function") return undefined;
    const update = () => setDetectedReducedMotion(readSharedReducedMotion());
    update();
    return subscribeSharedReducedMotion(update);
  }, [reducedMotion]);

  useEffect(() => {
    if (previousReducedMotionRef.current === isReducedMotion) return;
    previousReducedMotionRef.current = isReducedMotion;
    if (isReducedMotion) revealAll("reduced-motion");
    else {
      armedRef.current = false;
      resetToArtwork();
      evaluateStillness();
    }
  }, [evaluateStillness, isReducedMotion, resetToArtwork, revealAll]);

  useEffect(() => {
    if (previousForceResolvedRef.current === forceResolved) return;
    previousForceResolvedRef.current = forceResolved;
    if (forceResolved) {
      enhancedRef.current = false;
      setIsEnhanced(false);
      revealAll("force-resolved");
      return;
    }

    const canQueryMotionPreference = typeof globalThis.matchMedia === "function";
    const mediaMatches = canQueryMotionPreference && readSharedReducedMotion();
    const enhancementClassPresent = Boolean(
      globalThis.document?.documentElement?.classList?.contains("stay-enhanced"),
    );
    const enhanced = enhancementClassPresent
      && canQueryMotionPreference
      && !mediaMatches
      && reducedMotion !== true;
    enhancedRef.current = enhanced;
    setIsEnhanced(enhanced);
    if (enhanced) {
      armedRef.current = Boolean(settleOnMount && activeRef.current);
      resetToArtwork();
      evaluateStillness();
    } else {
      revealAll(mediaMatches || reducedMotion === true ? "reduced-motion" : "fallback");
    }
  }, [
    evaluateStillness,
    forceResolved,
    reducedMotion,
    resetToArtwork,
    revealAll,
    settleOnMount,
  ]);

  useEffect(() => {
    if (previousActiveRef.current === active) return undefined;
    previousActiveRef.current = active;
    armedRef.current = false;
    if (!active) {
      for (const state of scrollStatesRef.current.values()) cancelFrame(state.frame);
      scrollStatesRef.current.clear();
      activeSourcesRef.current.clear();
      activeContactsRef.current.clear();
      discardUnknownContacts();
      resetToArtwork();
      return undefined;
    }
    resetToArtwork();
    return pulse("selection");
  }, [active, discardUnknownContacts, pulse, resetToArtwork]);

  useEffect(() => {
    if (previousKeyRef.current === activeKey) return undefined;
    previousKeyRef.current = activeKey;
    armedRef.current = false;
    resetToArtwork();
    if (!activeRef.current && !reducedMotionRef.current) return undefined;
    return pulse("selection");
  }, [activeKey, pulse, resetToArtwork]);

  useEffect(() => {
    const nextState = waitForArtwork ? "pending" : "ready";
    publishArtworkImageState(nextState);
    if (!waitForArtwork) return;
    const image = artworkImageRef.current;
    if (image?.complete) markArtworkReady(image.naturalWidth > 0 ? "ready" : "error");
  }, [activeKey, markArtworkReady, publishArtworkImageState, waitForArtwork]);

  useEffect(() => {
    if (!active || isReducedMotion) return undefined;
    const target = getTrackedScrollTarget();
    if (!target?.addEventListener) return undefined;
    const onScroll = () => trackBrowsingScroll(target);
    if (observeWindowScroll || scrollTargetRef?.current) {
      target.addEventListener("scroll", onScroll, { passive: true });
    }
    target.addEventListener("scrollend", handleNativeScrollEnd, true);
    return () => {
      if (observeWindowScroll || scrollTargetRef?.current) target.removeEventListener("scroll", onScroll);
      target.removeEventListener("scrollend", handleNativeScrollEnd, true);
    };
  }, [active, getTrackedScrollTarget, handleNativeScrollEnd, isReducedMotion, observeWindowScroll, scrollTargetRef, trackBrowsingScroll]);

  useEffect(() => {
    if (!active || isReducedMotion) return undefined;
    const ownerDocument = rootRef.current?.ownerDocument;
    if (!ownerDocument?.addEventListener) return undefined;
    const finishPointer = (event) => {
      if (rootRef.current?.contains?.(event.target)) return;
      handlePointerEnd(event);
    };
    const cancelPointer = (event) => {
      if (rootRef.current?.contains?.(event.target)) return;
      handlePointerCancel(event);
    };
    const startTouch = (event) => {
      if (!rootRef.current?.contains?.(event.target)) return;
      handleTouchStart(event);
    };
    const finishTouch = (event) => handleTouchEnd(event);
    const cancelTouch = (event) => handleTouchCancel(event);
    const releaseTransientInput = () => {
      clearSource("pointer");
      markActiveTouchesUnknown();
    };
    ownerDocument.addEventListener("pointerup", finishPointer, true);
    ownerDocument.addEventListener("pointercancel", cancelPointer, true);
    ownerDocument.addEventListener("touchstart", startTouch, { capture: true, passive: true });
    ownerDocument.addEventListener("touchend", finishTouch, { capture: true, passive: true });
    ownerDocument.addEventListener("touchcancel", cancelTouch, { capture: true, passive: true });
    ownerDocument.defaultView?.addEventListener("blur", releaseTransientInput);
    return () => {
      ownerDocument.removeEventListener("pointerup", finishPointer, true);
      ownerDocument.removeEventListener("pointercancel", cancelPointer, true);
      ownerDocument.removeEventListener("touchstart", startTouch, true);
      ownerDocument.removeEventListener("touchend", finishTouch, true);
      ownerDocument.removeEventListener("touchcancel", cancelTouch, true);
      ownerDocument.defaultView?.removeEventListener("blur", releaseTransientInput);
    };
  }, [
    clearSource,
    active,
    handlePointerEnd,
    handlePointerCancel,
    handleTouchCancel,
    handleTouchEnd,
    handleTouchStart,
    markActiveTouchesUnknown,
    isReducedMotion,
  ]);

  useEffect(() => {
    if (
      isReducedMotion
      || !waitForArtwork
      || !renderedSnapshot.isStill
      || renderedArtworkImageSnapshot.state !== "pending"
    ) return undefined;

    const imageKey = renderedArtworkImageSnapshot.key;
    const watchdogId = globalThis.setTimeout(() => {
      if (
        artworkImageStateRef.current.key !== imageKey
        || artworkImageStateRef.current.state !== "pending"
        || !snapshotRef.current.isStill
      ) return;
      // A slow response is not an image failure. Release the narrative so the
      // interface cannot stay blocked, but keep the image pending until its
      // native load/error event provides the real outcome.
      revealAll("watchdog");
    }, effectiveWatchdogMs);

    return () => {
      globalThis.clearTimeout(watchdogId);
    };
  }, [
    effectiveWatchdogMs,
    isReducedMotion,
    renderedArtworkImageSnapshot.key,
    renderedArtworkImageSnapshot.state,
    renderedSnapshot.isStill,
    revealAll,
    waitForArtwork,
  ]);

  useEffect(() => {
    if (isReducedMotion || !renderedSnapshot.isStill) return;
    if (renderedSnapshot.entering === null) {
      const next = firstPendingPhase(renderedSnapshot.completedThrough, presenceRef.current);
      if (next === null) return;
      if (
        next > 0
        && waitForArtwork
        && renderedArtworkImageSnapshot.state === "pending"
      ) return;
      const nextSnapshot = { ...snapshotRef.current, entering: next };
      publish(nextSnapshot);
      onPhaseChangeRef.current?.(STAY_PHASES[next], "entering", "stillness");
      return;
    }

    const phaseIndex = renderedSnapshot.entering;
    const phase = STAY_PHASES[phaseIndex];
    const runId = runIdRef.current;
    const awaitKey = `${String(renderedSnapshot.key)}:${runId}:${phase}`;
    if (awaitingRef.current === awaitKey) return;
    awaitingRef.current = awaitKey;

    let animations;
    try {
      const node = phaseNodesRef.current.get(phase);
      if (animatePhaseRef.current) {
        animations = normalizeAnimationResult(
          animatePhaseRef.current(node, {
            phase,
            activeKey: renderedSnapshot.key,
            root: rootRef.current,
          }),
        );
      } else {
        animations = normalizeAnimationResult(
          node?.getAnimations?.({ subtree: false })?.filter(isFiniteAnimation),
        );
      }
    } catch (error) {
      if (isAbortError(error)) resetToArtwork();
      else revealAll("animation");
      return;
    }

    const completePhase = () => {
      if (runIdRef.current !== runId || snapshotRef.current.entering !== phaseIndex) return;
      awaitingRef.current = null;
      const next = {
        ...snapshotRef.current,
        completedThrough: phaseIndex,
        entering: null,
      };
      publish(next);
      onPhaseChangeRef.current?.(phase, "resolved", "animation");
    };

    if (!animations.length) {
      completePhase();
      return;
    }

    for (const animation of animations) activeAnimationsRef.current.add(animation);
    let watchdogId = null;
    const cleanupAnimations = () => {
      if (watchdogId !== null) {
        globalThis.clearTimeout(watchdogId);
        animationWatchdogsRef.current.delete(watchdogId);
      }
      for (const animation of animations) activeAnimationsRef.current.delete(animation);
    };
    const completion = Promise.all(animations.map((animation) => animation.finished));
    const guardedCompletion = Promise.race([
      completion.then(() => "complete"),
      new Promise((resolve) => {
        watchdogId = globalThis.setTimeout(() => resolve("watchdog"), effectiveWatchdogMs);
        animationWatchdogsRef.current.add(watchdogId);
      }),
    ]);

    guardedCompletion
      .then((result) => {
        cleanupAnimations();
        if (runIdRef.current !== runId) return;
        if (result === "watchdog") revealAll("watchdog");
        else completePhase();
      })
      .catch((error) => {
        cleanupAnimations();
        if (runIdRef.current !== runId) return;
        if (isAbortError(error)) resetToArtwork();
        else revealAll("animation");
      });
  }, [
    currentPresenceMask,
    effectiveWatchdogMs,
    isReducedMotion,
    publish,
    renderedSnapshot.completedThrough,
    renderedSnapshot.entering,
    renderedSnapshot.generation,
    renderedSnapshot.isStill,
    renderedSnapshot.key,
    renderedArtworkImageSnapshot.state,
    resetToArtwork,
    revealAll,
    waitForArtwork,
  ]);

  const currentPhaseIndex = renderedSnapshot.entering ?? renderedSnapshot.completedThrough;
  const fullyRevealed = firstPendingPhase(renderedSnapshot.completedThrough, presence) === null
    && renderedSnapshot.entering === null;
  const forceSettle = useCallback(() => {
    armedRef.current = true;
    for (const state of scrollStatesRef.current.values()) cancelFrame(state.frame);
    scrollStatesRef.current.clear();
    activeSourcesRef.current.delete("scroll");
    discardUnknownContacts();
    return evaluateStillness();
  }, [discardUnknownContacts, evaluateStillness]);

  return useMemo(
    () => ({
      rootRef,
      getRootProps,
      getPhaseProps,
      getPhaseState,
      getArtworkImageProps,
      getMotionSurfaceProps,
      currentPhase: STAY_PHASES[currentPhaseIndex],
      isStill: renderedSnapshot.isStill,
      isAnimating: renderedSnapshot.entering !== null,
      isFullyRevealed: fullyRevealed,
      failure: renderedSnapshot.failure,
      reducedMotion: isReducedMotion,
      isEnhanced,
      artworkImageState: renderedArtworkImageSnapshot.state,
      motion: {
        begin,
        end,
        settle: end,
        pulse,
        clearSource,
        trackScroll,
      },
      revealThrough,
      revealAll,
      markArtworkReady,
      retryArtworkImage,
      settle: forceSettle,
    }),
    [
      begin,
      clearSource,
      currentPhaseIndex,
      end,
      evaluateStillness,
      forceSettle,
      fullyRevealed,
      getPhaseProps,
      getPhaseState,
      getArtworkImageProps,
      getMotionSurfaceProps,
      getRootProps,
      isEnhanced,
      isReducedMotion,
      markArtworkReady,
      pulse,
      retryArtworkImage,
      renderedSnapshot.entering,
      renderedSnapshot.failure,
      renderedSnapshot.isStill,
      renderedArtworkImageSnapshot.state,
      revealAll,
      revealThrough,
      trackScroll,
    ],
  );
}
