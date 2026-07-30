import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const materialDirectory = resolve(root, "src/assets/material-stage");
const materials = [
  {
    sourceName: "home-top-composite-alpha.webp",
    outputName: "gallery-seam-mobile.webp",
    width: "645",
    quality: "76",
    alphaQuality: "84",
  },
  {
    sourceName: "home-top-vault-desktop-short-alpha.webp",
    outputName: "gallery-seam-desktop.webp",
    width: "1817",
    quality: "76",
    alphaQuality: "84",
  },
  {
    sourceName: "memory-seam-alpha.webp",
    outputName: "memory-seam-mobile.webp",
    width: "1290",
    quality: "82",
    alphaQuality: "90",
  },
  {
    sourceName: "bottom-strata-alpha.webp",
    outputName: "bottom-strata-mobile.webp",
    width: "1290",
    quality: "82",
    alphaQuality: "90",
  },
];

for (const {
  sourceName,
  outputName,
  width,
  quality,
  alphaQuality,
} of materials) {
  await run("cwebp", [
    "-quiet",
    "-mt",
    "-m",
    "6",
    "-q",
    quality,
    "-alpha_q",
    alphaQuality,
    "-metadata",
    "none",
    "-resize",
    width,
    "0",
    resolve(materialDirectory, sourceName),
    "-o",
    resolve(materialDirectory, outputName),
  ]);
}

console.log(`Generated ${materials.length} bounded material surfaces.`);
