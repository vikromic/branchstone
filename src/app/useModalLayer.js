import { useEffect, useRef } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableElements(container) {
  const view = container.ownerDocument.defaultView;
  return [...container.querySelectorAll(focusableSelector)].filter(
    (element) => {
      if (element.closest("[inert]")) return false;

      let current = element;
      while (current) {
        if (current.hidden || current.getAttribute("aria-hidden") === "true") return false;
        const style = view?.getComputedStyle(current);
        if (style?.display === "none" || style?.visibility === "hidden" || style?.visibility === "collapse") {
          return false;
        }
        if (current === container) break;
        current = current.parentElement;
      }
      return true;
    },
  );
}

function backgroundElements(container) {
  const elements = new Set();
  let branch = container;
  while (branch?.parentElement && branch.parentElement !== document.body) {
    for (const sibling of branch.parentElement.children) {
      if (sibling !== branch) elements.add(sibling);
    }
    branch = branch.parentElement;
  }
  return [...elements];
}

export function useModalLayer({ active = true, containerRef, initialFocusRef, onClose, lockClass = "is-locked", restoreFocus = true }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;
    const background = backgroundElements(container);
    const previousBackgroundState = background.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    for (const element of background) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }
    if (lockClass) document.body.classList.add(lockClass);

    const focusInitial = () => {
      const controls = focusableElements(container);
      const requestedInitialFocus = initialFocusRef?.current;
      const target = requestedInitialFocus && controls.includes(requestedInitialFocus)
        ? requestedInitialFocus
        : controls[0] ?? container;
      target?.focus?.({ preventScroll: true });
    };
    focusInitial();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const controls = focusableElements(container);
      event.preventDefault();
      if (!controls.length) {
        container.focus();
        return;
      }
      const activeIndex = controls.indexOf(document.activeElement);
      const nextIndex = activeIndex < 0
        ? event.shiftKey ? controls.length - 1 : 0
        : (activeIndex + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
      controls[nextIndex].focus();
    };

    const keepFocusInside = (event) => {
      if (!container.contains(event.target)) focusInitial();
    };
    let focusRecoveryTimer = null;
    const recoverFocus = () => {
      focusRecoveryTimer = null;
      const activeElement = document.activeElement;
      const activeIsValid = activeElement === container
        || focusableElements(container).includes(activeElement);
      if (!activeIsValid) focusInitial();
    };
    const scheduleFocusRecovery = () => {
      if (focusRecoveryTimer !== null) return;
      focusRecoveryTimer = container.ownerDocument.defaultView?.setTimeout(recoverFocus, 0)
        ?? globalThis.setTimeout(recoverFocus, 0);
    };
    const retainFocusAfterChange = new MutationObserver(scheduleFocusRecovery);

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", keepFocusInside);
    document.addEventListener("focusout", scheduleFocusRecovery, true);
    retainFocusAfterChange.observe(container, {
      attributes: true,
      attributeFilter: ["aria-hidden", "class", "data-stay-state", "data-stay-visible", "hidden", "inert", "style"],
      childList: true,
      subtree: true,
    });
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", keepFocusInside);
      document.removeEventListener("focusout", scheduleFocusRecovery, true);
      retainFocusAfterChange.disconnect();
      if (focusRecoveryTimer !== null) {
        container.ownerDocument.defaultView?.clearTimeout(focusRecoveryTimer);
        globalThis.clearTimeout(focusRecoveryTimer);
      }
      if (lockClass) document.body.classList.remove(lockClass);
      for (const { element, inert, ariaHidden } of previousBackgroundState) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      if (restoreFocus && previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef, initialFocusRef, lockClass, restoreFocus]);
}
