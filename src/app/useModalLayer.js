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
  return [...container.querySelectorAll(focusableSelector)].filter(
    (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true",
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
      const target = initialFocusRef?.current ?? focusableElements(container)[0] ?? container;
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
      if (!controls.length) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = controls[0];
      const last = controls.at(-1);
      if (!container.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const keepFocusInside = (event) => {
      if (!container.contains(event.target)) focusInitial();
    };
    const retainFocusAfterRemoval = new MutationObserver(() => {
      if (!container.contains(document.activeElement)) focusInitial();
    });

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", keepFocusInside);
    retainFocusAfterRemoval.observe(container, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", keepFocusInside);
      retainFocusAfterRemoval.disconnect();
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
