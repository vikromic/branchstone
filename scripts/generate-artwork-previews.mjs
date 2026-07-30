import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { streamPrimaryMedia } from "../src/domain/artwork-media.js";

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(root, "src/assets/artwork-index");

await mkdir(destination, { recursive: true });

for (const [id, media] of Object.entries(streamPrimaryMedia)) {
  const width = Math.min(720, media.width);
  const source = resolve(root, "docs", media.path);
  const output = resolve(destination, `${id}.webp`);
  await run("cwebp", [
    "-quiet",
    "-mt",
    "-m",
    "6",
    "-q",
    "82",
    "-metadata",
    "none",
    "-resize",
    String(width),
    "0",
    source,
    "-o",
    output,
  ]);
}

console.log(`Generated ${Object.keys(streamPrimaryMedia).length} full-composition artwork previews at up to 720 px.`);
