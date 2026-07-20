import {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
} from "react";
import { useStayReveal } from "./useStayReveal.js";
import "./stay-reveal.css";

const StayRevealContext = createContext(null);

export function useStayRevealContext() {
  const context = useContext(StayRevealContext);
  if (!context) throw new Error("StayPhase must be rendered inside StayReveal.");
  return context;
}

export const StayReveal = forwardRef(function StayReveal(
  {
    as: Element = "div",
    activeKey,
    active,
    phasePresence,
    reducedMotion,
    settleOnMount,
    waitForArtwork,
    epsilon,
    watchdogMs,
    animatePhase,
    onPhaseChange,
    scrollTargetRef,
    observeWindowScroll,
    controllerRef,
    children,
    ...elementProps
  },
  forwardedRef,
) {
  const controller = useStayReveal({
    activeKey,
    active,
    phasePresence,
    reducedMotion,
    settleOnMount,
    waitForArtwork,
    epsilon,
    watchdogMs,
    animatePhase,
    onPhaseChange,
    scrollTargetRef,
    observeWindowScroll,
  });
  useImperativeHandle(controllerRef, () => controller, [controller]);

  return (
    <StayRevealContext.Provider value={controller}>
      <Element {...controller.getRootProps({ ...elementProps, ref: forwardedRef })}>
        {children}
      </Element>
    </StayRevealContext.Provider>
  );
});

export const StayPhase = forwardRef(function StayPhase(
  { as: Element = "div", phase, children, ...elementProps },
  forwardedRef,
) {
  const controller = useStayRevealContext();
  return (
    <Element {...controller.getPhaseProps(phase, { ...elementProps, ref: forwardedRef })}>
      {children}
    </Element>
  );
});

export const StayArtworkImage = forwardRef(function StayArtworkImage(
  { alt = "", ...imageProps },
  forwardedRef,
) {
  const controller = useStayRevealContext();
  return <img {...controller.getArtworkImageProps({ ...imageProps, alt, ref: forwardedRef })} />;
});

export const StayRevealControl = forwardRef(function StayRevealControl(
  { onClick, children, type = "button", ...buttonProps },
  forwardedRef,
) {
  const controller = useStayRevealContext();
  const handleClick = (event) => {
    onClick?.(event);
    controller.settle();
  };
  return (
    <button
      {...buttonProps}
      ref={forwardedRef}
      type={type}
      data-stay-reveal-control=""
      onClick={handleClick}
    >
      {children}
    </button>
  );
});
