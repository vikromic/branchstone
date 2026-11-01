import { useCallback, useEffect, useRef, useState } from "react";

// Zoom stops at the master's own pixels (one image pixel per CSS pixel):
// the viewer reveals detail that exists, it never enlarges cosmetically.
const MIN_HEADROOM = 1.25;
const TAP_SLOP = 10;
const TAP_MS = 300;
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_DISTANCE = 32;
const KEY_PAN = 64;
const KEY_ZOOM = 1.5;

const fitted = Object.freeze({ scale: 1, x: 0, y: 0 });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Geometry of an object-fit: contain image inside its box, at scale 1.
export function zoomGeometry(box, natural) {
  if (!box.width || !box.height || !natural.width || !natural.height) {
    return { zoomable: false, maxScale: 1, fit: { width: 0, height: 0 } };
  }
  const ratio = Math.min(box.width / natural.width, box.height / natural.height);
  const maxScale = 1 / ratio;
  return {
    zoomable: maxScale >= MIN_HEADROOM,
    maxScale,
    fit: { width: natural.width * ratio, height: natural.height * ratio },
  };
}

// Keeps the scale in range and the zoomed image covering the box edges.
export function clampView(view, box, geometry) {
  const scale = clamp(view.scale, 1, geometry.maxScale);
  const limitX = Math.max(0, (geometry.fit.width * scale - box.width) / 2);
  const limitY = Math.max(0, (geometry.fit.height * scale - box.height) / 2);
  return { scale, x: clamp(view.x, -limitX, limitX) || 0, y: clamp(view.y, -limitY, limitY) || 0 };
}

// Scales around a point given relative to the box centre, so it stays put.
export function zoomAbout(view, nextScale, point, box, geometry) {
  const scale = clamp(nextScale, 1, geometry.maxScale);
  const factor = scale / view.scale;
  return clampView({
    scale,
    x: point.x - (point.x - view.x) * factor,
    y: point.y - (point.y - view.y) * factor,
  }, box, geometry);
}

function relativePoint(event, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2,
  };
}

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Pan and zoom for the artwork stage. `targetRef` is the transparent gesture
// layer that covers the image; `natural` is the current image's pixel size.
// Pointer handlers return true when they consumed the event, so the caller's
// carousel swipe stays in charge of everything else.
export function useArtworkZoom({ targetRef, natural, resetKey }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [view, setView] = useState(fitted);
  const [motion, setMotion] = useState("smooth");
  const [fullResolution, setFullResolution] = useState(false);
  const viewRef = useRef(fitted);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const lastTapRef = useRef(null);
  const geometry = zoomGeometry(box, natural);
  const geometryRef = useRef(geometry);
  geometryRef.current = geometry;
  const boxRef = useRef(box);
  boxRef.current = box;
  const zoomed = view.scale > 1.001;

  const apply = useCallback((next, nextMotion) => {
    viewRef.current = next;
    setMotion(nextMotion);
    setView(next);
    if (next.scale > 1.001) setFullResolution(true);
  }, []);

  const reset = useCallback((nextMotion = "smooth") => {
    gestureRef.current = null;
    apply(fitted, nextMotion);
  }, [apply]);

  useEffect(() => {
    const element = targetRef.current;
    if (!element || typeof ResizeObserver !== "function") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((current) => (
        current.width === width && current.height === height ? current : { width, height }
      ));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [targetRef]);

  // A new image or a new stage size starts from the fitted view.
  useEffect(() => {
    pointersRef.current.clear();
    lastTapRef.current = null;
    setFullResolution(false);
    reset("direct");
  }, [box.width, box.height, resetKey, reset]);

  const zoomTo = useCallback((scale, point, nextMotion) => {
    apply(zoomAbout(viewRef.current, scale, point, boxRef.current, geometryRef.current), nextMotion);
  }, [apply]);

  const toggle = useCallback((point = { x: 0, y: 0 }) => {
    if (!geometryRef.current.zoomable) return;
    if (viewRef.current.scale > 1.001) reset();
    else zoomTo(geometryRef.current.maxScale, point, "smooth");
  }, [reset, zoomTo]);

  const capture = (event) => {
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // A pointer that already ended cannot be captured; the gesture still works.
    }
  };

  const onPointerDown = (event) => {
    if (!geometryRef.current.zoomable) return false;
    if (event.pointerType === "mouse" && event.button !== 0) return false;
    const point = relativePoint(event, event.currentTarget);
    pointersRef.current.set(event.pointerId, {
      point,
      start: point,
      time: event.timeStamp,
    });
    const pointers = [...pointersRef.current.values()];
    if (pointers.length === 2) {
      capture(event);
      const [a, b] = pointers;
      gestureRef.current = {
        type: "pinch",
        startDistance: Math.max(distance(a.point, b.point), 1),
        startMidpoint: midpoint(a.point, b.point),
        startView: viewRef.current,
      };
      return true;
    }
    if (pointers.length === 1 && viewRef.current.scale > 1.001) {
      capture(event);
      gestureRef.current = { type: "pan", last: point };
      return true;
    }
    return false;
  };

  const onPointerMove = (event) => {
    const tracked = pointersRef.current.get(event.pointerId);
    if (!tracked) return false;
    const point = relativePoint(event, event.currentTarget);
    tracked.point = point;
    const gesture = gestureRef.current;
    if (gesture?.type === "pinch" && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      const scale = gesture.startView.scale * (distance(a.point, b.point) / gesture.startDistance);
      const zoomedView = zoomAbout(gesture.startView, scale, gesture.startMidpoint, boxRef.current, geometryRef.current);
      const centre = midpoint(a.point, b.point);
      apply(clampView({
        ...zoomedView,
        x: zoomedView.x + centre.x - gesture.startMidpoint.x,
        y: zoomedView.y + centre.y - gesture.startMidpoint.y,
      }, boxRef.current, geometryRef.current), "direct");
      return true;
    }
    if (gesture?.type === "pan") {
      const current = viewRef.current;
      apply(clampView({
        ...current,
        x: current.x + point.x - gesture.last.x,
        y: current.y + point.y - gesture.last.y,
      }, boxRef.current, geometryRef.current), "direct");
      gesture.last = point;
      return true;
    }
    return false;
  };

  const endPointer = (event) => {
    const tracked = pointersRef.current.get(event.pointerId);
    pointersRef.current.delete(event.pointerId);
    const gesture = gestureRef.current;
    const remaining = [...pointersRef.current.values()];
    if (gesture?.type === "pinch") {
      // Lifting one finger of a pinch continues as a pan with the other.
      gestureRef.current = remaining.length === 1 && viewRef.current.scale > 1.001
        ? { type: "pan", last: remaining[0].point }
        : null;
      if (viewRef.current.scale <= 1.001) apply(fitted, "smooth");
      return { tracked, consumed: true };
    }
    if (gesture?.type === "pan" && remaining.length === 0) gestureRef.current = null;
    return { tracked, consumed: gesture?.type === "pan" };
  };

  const onPointerUp = (event) => {
    const { tracked, consumed } = endPointer(event);
    if (!tracked || !geometryRef.current.zoomable) return consumed;
    const point = relativePoint(event, event.currentTarget);
    const isTap = distance(point, tracked.start) <= TAP_SLOP && event.timeStamp - tracked.time <= TAP_MS;
    if (!isTap) {
      lastTapRef.current = null;
      return consumed;
    }
    const previous = lastTapRef.current;
    if (
      previous
      && event.timeStamp - previous.time <= DOUBLE_TAP_MS
      && distance(point, previous.point) <= DOUBLE_TAP_DISTANCE
    ) {
      lastTapRef.current = null;
      toggle(point);
      return true;
    }
    lastTapRef.current = { point, time: event.timeStamp };
    return consumed;
  };

  // Lost capture without a pointerup (the browser took the gesture over).
  const onPointerCancel = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return false;
    endPointer(event);
    if (pointersRef.current.size === 0) gestureRef.current = null;
    return true;
  };

  // Trackpad pinch (ctrl + wheel) zooms; a plain wheel pans while zoomed.
  useEffect(() => {
    const element = targetRef.current;
    if (!element) return undefined;
    const onWheel = (event) => {
      if (!geometryRef.current.zoomable) return;
      const point = relativePoint(event, element);
      if (event.ctrlKey) {
        event.preventDefault();
        zoomTo(viewRef.current.scale * Math.exp(-event.deltaY * 0.01), point, "direct");
        return;
      }
      if (viewRef.current.scale <= 1.001) return;
      event.preventDefault();
      const current = viewRef.current;
      apply(clampView({ ...current, x: current.x - event.deltaX, y: current.y - event.deltaY }, boxRef.current, geometryRef.current), "direct");
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [apply, targetRef, zoomTo]);

  // Keyboard: + and - zoom; while zoomed, arrows pan and Escape or 0 fits.
  const onKeyDown = (event) => {
    if (!geometryRef.current.zoomable || event.altKey || event.ctrlKey || event.metaKey) return false;
    if (event.target.closest?.("input, textarea, select")) return false;
    const current = viewRef.current;
    if (event.key === "+" || event.key === "=") {
      zoomTo(current.scale * KEY_ZOOM, { x: 0, y: 0 }, "smooth");
      return true;
    }
    if (current.scale <= 1.001) return false;
    if (event.key === "-" || event.key === "_") {
      zoomTo(current.scale / KEY_ZOOM, { x: 0, y: 0 }, "smooth");
      return true;
    }
    if (event.key === "Escape" || event.key === "0") {
      reset();
      return true;
    }
    const pan = { ArrowLeft: [KEY_PAN, 0], ArrowRight: [-KEY_PAN, 0], ArrowUp: [0, KEY_PAN], ArrowDown: [0, -KEY_PAN] }[event.key];
    if (!pan) return false;
    apply(clampView({ ...current, x: current.x + pan[0], y: current.y + pan[1] }, boxRef.current, geometryRef.current), "smooth");
    return true;
  };

  return {
    zoomable: geometry.zoomable,
    zoomed,
    fullResolution,
    percent: Math.round((view.scale / geometry.maxScale) * 100),
    motion,
    imageStyle: zoomed ? { transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` } : undefined,
    toggle,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onKeyDown,
  };
}
