import { describe, expect, it } from "vitest";
import { clampView, zoomAbout, zoomGeometry } from "../../src/features/artwork/useArtworkZoom.js";

describe("artwork zoom", () => {
  it.each([
    ["a 3200 × 4000 master in a phone stage", { width: 350, height: 574 }, { width: 3200, height: 4000 }, true, 9.142857],
    ["a 360 × 450 master already shown near its own pixels", { width: 350, height: 574 }, { width: 360, height: 450 }, false, 1.028571],
    ["a small master that the stage already enlarges", { width: 900, height: 820 }, { width: 360, height: 450 }, false, 0.548780],
    ["an image that has not loaded yet", { width: 900, height: 820 }, { width: 0, height: 0 }, false, 1],
  ])("stops at the master's own pixels for %s", (_label, box, natural, zoomable, maxScale) => {
    const geometry = zoomGeometry(box, natural);

    expect(geometry.zoomable).toBe(zoomable);
    expect(geometry.maxScale).toBeCloseTo(maxScale, 5);
  });

  it("never zooms past full resolution and keeps the image covering the stage", () => {
    const box = { width: 350, height: 574 };
    const geometry = zoomGeometry(box, { width: 3200, height: 4000 });

    const view = zoomAbout({ scale: 1, x: 0, y: 0 }, 50, { x: 170, y: 280 }, box, geometry);
    expect(view.scale).toBeCloseTo(geometry.maxScale, 5);
    expect(Math.abs(view.x)).toBeLessThanOrEqual((geometry.fit.width * view.scale - box.width) / 2);
    expect(Math.abs(view.y)).toBeLessThanOrEqual((geometry.fit.height * view.scale - box.height) / 2);

    expect(clampView({ scale: 0.2, x: 400, y: -400 }, box, geometry)).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it("keeps the point under the finger in place while zooming", () => {
    const box = { width: 800, height: 800 };
    const geometry = zoomGeometry(box, { width: 4000, height: 4000 });
    const point = { x: 120, y: -80 };

    const view = zoomAbout({ scale: 1, x: 0, y: 0 }, 2, point, box, geometry);
    // The image point that was under `point` at scale 1 is still under it.
    expect((point.x - view.x) / view.scale).toBeCloseTo(point.x, 5);
    expect((point.y - view.y) / view.scale).toBeCloseTo(point.y, 5);
  });
});
