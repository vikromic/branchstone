import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { htmlFiles } from "../site-pages.js";

const execFileAsync = promisify(execFile);
const publisher = resolve(process.cwd(), "scripts/publish.mjs");
let fixture;

afterEach(async () => {
  if (fixture) await rm(fixture, { recursive: true, force: true });
  fixture = undefined;
});

describe("publisher route migration", () => {
  it("publishes a newly added HTML route without requiring a previous copy", async () => {
    fixture = await mkdtemp(join(tmpdir(), "branchstone-publish-route-"));
    const stage = join(fixture, ".stage");
    const docs = join(fixture, "docs");
    await Promise.all([
      mkdir(join(stage, "assets"), { recursive: true }),
      mkdir(join(stage, "uk"), { recursive: true }),
      mkdir(docs, { recursive: true }),
    ]);

    for (const filename of htmlFiles) {
      await writeFile(join(stage, filename), `new:${filename}`);
      if (filename !== "exhibitions.html") {
        await writeFile(join(docs, filename), `old:${filename}`);
      }
    }

    await execFileAsync(process.execPath, [publisher], { cwd: fixture });

    for (const filename of htmlFiles) {
      expect(await readFile(join(docs, filename), "utf8")).toBe(`new:${filename}`);
    }
  });
});
