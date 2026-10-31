import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const materialDirectory = resolve(process.cwd(), "src/assets/material-stage");
const KiB = 1024;

// Outputs of scripts/generate-mobile-materials.mjs. The Commission hero's mobile
// derivative is not produced by that script and is deliberately outside this budget.
const generatedMobileMaterials = [
  "gallery-seam-mobile.webp",
  "memory-seam-mobile.webp",
  "bottom-strata-mobile.webp",
];

describe("bounded material delivery assets", () => {
  it.each(generatedMobileMaterials)("keeps %s within the 180 KiB mobile budget", async (name) => {
    const { size } = await stat(resolve(materialDirectory, name));
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThanOrEqual(180 * KiB);
  });

  it("keeps the Gallery-only desktop seam within its 100 KiB budget", async () => {
    const { size } = await stat(resolve(materialDirectory, "gallery-seam-desktop.webp"));
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThanOrEqual(100 * KiB);
  });
});
