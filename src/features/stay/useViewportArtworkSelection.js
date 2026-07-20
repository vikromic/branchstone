import { useCallback, useEffect, useRef, useState } from "react";

const LEGACY_SCROLL_STABLE_FRAMES = 5;

export function useViewportArtworkSelection(artworks) {
  const nodesRef = useRef(new Map());
  const observerRef = useRef(null);
  const candidateIdRef = useRef(artworks[0]?.id ?? null);
  const selectionSettledRef = useRef(true);
  const windowScrollActiveRef = useRef(false);
  const activeContactsRef = useRef(new Set());
  const [activeId, setActiveId] = useState(() => artworks[0]?.id ?? null);

  const refreshCenterCandidate = useCallback(() => {
    const ownerDocument = globalThis.document;
    const ownerWindow = ownerDocument?.defaultView;
    const viewportHeight = ownerWindow?.innerHeight
      || ownerDocument?.documentElement?.clientHeight
      || 0;
    const anchor = viewportHeight * 0.5;
    let closest = null;
    for (const [id, node] of nodesRef.current) {
      if (!node?.isConnected) continue;
      const rect = node.getBoundingClientRect();
      const top = Number(rect.top);
      const bottom = Number.isFinite(Number(rect.bottom))
        ? Number(rect.bottom)
        : top + Number(rect.height ?? 0);
      if (!Number.isFinite(top) || !Number.isFinite(bottom)) continue;
      const record = {
        id,
        intersectsViewport: bottom > 0 && top < viewportHeight,
        distance: Math.abs((top + bottom) * 0.5 - anchor),
      };
      if (
        !closest
        || (record.intersectsViewport && !closest.intersectsViewport)
        || record.intersectsViewport === closest.intersectsViewport
          && record.distance < closest.distance
      ) closest = record;
    }
    if (closest) candidateIdRef.current = closest.id;
    return closest?.id ?? null;
  }, []);

  const commitCandidate = useCallback(() => {
    if (!selectionSettledRef.current || activeContactsRef.current.size) return;
    const nextId = candidateIdRef.current;
    const nextNode = nextId ? nodesRef.current.get(nextId) : null;
    if (nextNode?.isConnected) {
      setActiveId((current) => current === nextId ? current : nextId);
    }
  }, []);

  const activateArtwork = useCallback((id) => {
    candidateIdRef.current = id;
    setActiveId(id);
  }, []);

  const registerArtwork = useCallback((id, node) => {
    const previous = nodesRef.current.get(id);
    if (previous && previous !== node) observerRef.current?.unobserve(previous);
    if (!node) {
      nodesRef.current.delete(id);
      return;
    }
    nodesRef.current.set(id, node);
    observerRef.current?.observe(node);
  }, []);

  useEffect(() => {
    const visibleIds = new Set(artworks.map(({ id }) => id));
    const firstVisibleId = artworks[0]?.id ?? null;
    if (!visibleIds.has(candidateIdRef.current)) candidateIdRef.current = firstVisibleId;
    setActiveId((current) => {
      if (visibleIds.has(current)) return current;
      if (activeContactsRef.current.size || !selectionSettledRef.current) return current;
      return firstVisibleId;
    });
  }, [artworks]);

  useEffect(() => {
    const ownerDocument = globalThis.document;
    const ownerWindow = ownerDocument?.defaultView;
    if (!ownerDocument || !ownerWindow) return undefined;

    let settleFrame = null;
    let stableFrames = 0;
    let previousPosition = { x: ownerWindow.scrollX ?? 0, y: ownerWindow.scrollY ?? 0 };
    const nativeScrollEnd = ownerWindow.onscrollend !== undefined
      || ownerDocument.onscrollend !== undefined;
    const cancelSettleFrame = () => {
      if (settleFrame === null) return;
      if (typeof ownerWindow.cancelAnimationFrame === "function") {
        ownerWindow.cancelAnimationFrame(settleFrame);
      } else {
        ownerWindow.clearTimeout(settleFrame);
      }
      settleFrame = null;
    };
    const requestSettleFrame = (callback) => {
      settleFrame = typeof ownerWindow.requestAnimationFrame === "function"
        ? ownerWindow.requestAnimationFrame(callback)
        : ownerWindow.setTimeout(callback, 16);
    };
    const releaseTerminalCanceledTouchContacts = () => {
      let removed = false;
      for (const token of activeContactsRef.current) {
        if (!token.startsWith("terminal-canceled-touch-")) continue;
        activeContactsRef.current.delete(token);
        removed = true;
      }
      return removed;
    };
    const verifyLegacyStillness = () => {
      const nextPosition = { x: ownerWindow.scrollX ?? 0, y: ownerWindow.scrollY ?? 0 };
      const isStable = Math.abs(nextPosition.x - previousPosition.x) <= 0.5
        && Math.abs(nextPosition.y - previousPosition.y) <= 0.5;
      previousPosition = nextPosition;
      stableFrames = isStable ? stableFrames + 1 : 0;
      if (stableFrames < LEGACY_SCROLL_STABLE_FRAMES) {
        requestSettleFrame(verifyLegacyStillness);
        return;
      }
      settleFrame = null;
      windowScrollActiveRef.current = false;
      selectionSettledRef.current = true;
      releaseTerminalCanceledTouchContacts();
      refreshCenterCandidate();
      commitCandidate();
    };

    const beginContact = (token) => activeContactsRef.current.add(token);
    const endContact = (token) => {
      activeContactsRef.current.delete(token);
      commitCandidate();
    };
    const clearContacts = () => {
      if (!activeContactsRef.current.size) return;
      activeContactsRef.current.clear();
      commitCandidate();
    };
    const clearCanceledTouchContacts = () => {
      let removed = false;
      for (const token of activeContactsRef.current) {
        if (
          !token.startsWith("canceled-pointer-touch-")
          && !token.startsWith("canceled-touch-")
          && !token.startsWith("terminal-canceled-touch-")
        ) continue;
        activeContactsRef.current.delete(token);
        removed = true;
      }
      return removed;
    };
    const markCanceledTouchesTerminal = () => {
      const canceledTokens = [...activeContactsRef.current].filter(
        (token) => token.startsWith("canceled-pointer-touch-")
          || token.startsWith("canceled-touch-"),
      );
      for (const token of canceledTokens) {
        activeContactsRef.current.delete(token);
        activeContactsRef.current.add(`terminal-canceled-touch-${token}`);
      }
      return canceledTokens.length > 0;
    };
    const onPointerDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      beginContact(`pointer-${event.pointerId}`);
    };
    const onPointerEnd = (event) => endContact(`pointer-${event.pointerId}`);
    const onPointerCancel = (event) => {
      activeContactsRef.current.delete(`pointer-${event.pointerId}`);
      if (event.pointerType === "touch") {
        beginContact(`canceled-pointer-touch-${event.pointerId}`);
      }
      commitCandidate();
    };
    const onTouchStart = (event) => {
      for (const touch of event.changedTouches ?? []) beginContact(`touch-${touch.identifier}`);
    };
    const onTouchEnd = (event) => {
      for (const touch of event.changedTouches ?? []) endContact(`touch-${touch.identifier}`);
      if ((event.touches?.length ?? 0) === 0 && clearCanceledTouchContacts()) commitCandidate();
    };
    const onTouchCancel = (event) => {
      for (const touch of event.changedTouches ?? []) {
        activeContactsRef.current.delete(`touch-${touch.identifier}`);
        beginContact(`terminal-canceled-touch-${touch.identifier}`);
      }
      if (selectionSettledRef.current && !windowScrollActiveRef.current) {
        releaseTerminalCanceledTouchContacts();
      }
      commitCandidate();
    };
    const onPhysicalTouchEnd = (event) => {
      if ((event.touches?.length ?? 0) > 0) return;
      if (clearCanceledTouchContacts()) commitCandidate();
    };
    const onPhysicalTouchCancel = (event) => {
      if ((event.touches?.length ?? 0) > 0) return;
      if (!markCanceledTouchesTerminal()) return;
      if (selectionSettledRef.current && !windowScrollActiveRef.current) {
        releaseTerminalCanceledTouchContacts();
        commitCandidate();
      }
    };
    const onVisibilityChange = () => {
      if (ownerDocument.visibilityState === "hidden") clearContacts();
    };
    const isViewportScrollTarget = (target) => target?.window === target
      || target === ownerWindow
      || target === ownerDocument
      || target === ownerDocument.documentElement
      || target === ownerDocument.scrollingElement
      || target === ownerDocument.body;
    const onScroll = (event) => {
      if (!isViewportScrollTarget(event.target)) return;
      windowScrollActiveRef.current = true;
      selectionSettledRef.current = false;
      stableFrames = 0;
      previousPosition = { x: ownerWindow.scrollX ?? 0, y: ownerWindow.scrollY ?? 0 };
      cancelSettleFrame();
      if (!nativeScrollEnd) requestSettleFrame(verifyLegacyStillness);
    };
    const onScrollEnd = (event) => {
      if (!windowScrollActiveRef.current) return;
      if (!isViewportScrollTarget(event.target)) return;
      cancelSettleFrame();
      windowScrollActiveRef.current = false;
      selectionSettledRef.current = true;
      releaseTerminalCanceledTouchContacts();
      refreshCenterCandidate();
      commitCandidate();
    };
    const hasPointerEvents = typeof ownerWindow.PointerEvent === "function";

    ownerWindow.addEventListener("scroll", onScroll, { capture: true, passive: true });
    ownerWindow.addEventListener("scrollend", onScrollEnd, true);
    ownerWindow.addEventListener("blur", clearContacts);
    ownerDocument.addEventListener("visibilitychange", onVisibilityChange);
    if (hasPointerEvents) {
      ownerDocument.addEventListener("pointerdown", onPointerDown, true);
      ownerDocument.addEventListener("pointerup", onPointerEnd, true);
      ownerDocument.addEventListener("pointercancel", onPointerCancel, true);
      ownerDocument.addEventListener("touchend", onPhysicalTouchEnd, { capture: true, passive: true });
      ownerDocument.addEventListener("touchcancel", onPhysicalTouchCancel, { capture: true, passive: true });
    } else {
      ownerDocument.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
      ownerDocument.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
      ownerDocument.addEventListener("touchcancel", onTouchCancel, { capture: true, passive: true });
    }
    return () => {
      cancelSettleFrame();
      ownerWindow.removeEventListener("scroll", onScroll, true);
      ownerWindow.removeEventListener("scrollend", onScrollEnd, true);
      ownerWindow.removeEventListener("blur", clearContacts);
      ownerDocument.removeEventListener("visibilitychange", onVisibilityChange);
      if (hasPointerEvents) {
        ownerDocument.removeEventListener("pointerdown", onPointerDown, true);
        ownerDocument.removeEventListener("pointerup", onPointerEnd, true);
        ownerDocument.removeEventListener("pointercancel", onPointerCancel, true);
        ownerDocument.removeEventListener("touchend", onPhysicalTouchEnd, true);
        ownerDocument.removeEventListener("touchcancel", onPhysicalTouchCancel, true);
      } else {
        ownerDocument.removeEventListener("touchstart", onTouchStart, true);
        ownerDocument.removeEventListener("touchend", onTouchEnd, true);
        ownerDocument.removeEventListener("touchcancel", onTouchCancel, true);
      }
      activeContactsRef.current.clear();
    };
  }, [commitCandidate, refreshCenterCandidate]);

  useEffect(() => {
    if (typeof IntersectionObserver !== "function") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const hasCurrentEntry = entries.some((entry) => {
          const id = entry.target?.dataset?.artworkId;
          return entry.target?.isConnected && nodesRef.current.get(id) === entry.target;
        });
        if (!hasCurrentEntry) return;
        refreshCenterCandidate();
        commitCandidate();
      },
      { root: null, threshold: 0 },
    );
    observerRef.current = observer;
    for (const node of nodesRef.current.values()) observer.observe(node);
    return () => {
      observerRef.current = null;
      observer.disconnect();
    };
  }, [commitCandidate, refreshCenterCandidate]);

  return { activeId, activateArtwork, registerArtwork };
}
