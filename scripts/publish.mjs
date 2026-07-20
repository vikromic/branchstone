import { cp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  assetGenerationManifest,
  parseAssetGenerationManifest,
  selectPreviousAssetGeneration,
  validateAssetNames,
} from "./asset-generations.mjs";
import { htmlFiles } from "../site-pages.js";

const root = process.cwd();
const stage = resolve(root, ".stage");
const docs = resolve(root, "docs");
const generatedAssets = resolve(docs, "assets");
const nextAssets = resolve(docs, ".branchstone-assets-next");
const previousAssets = resolve(docs, ".branchstone-assets-previous");
const generatedUk = resolve(docs, "uk");
const nextUk = resolve(docs, ".branchstone-uk-next");
const previousUk = resolve(docs, ".branchstone-uk-previous");
const nextHtml = resolve(docs, ".branchstone-html-next");
const previousHtml = resolve(docs, ".branchstone-html-previous");
const temporaryPaths = [nextAssets, previousAssets, nextUk, previousUk, nextHtml, previousHtml];

async function currentPublishedGeneration() {
  try {
    return parseAssetGenerationManifest(
      await readFile(resolve(generatedAssets, assetGenerationManifest), "utf8"),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    try {
      return {
        version: 1,
        current: validateAssetNames(
          (await readdir(generatedAssets)).filter((entry) => entry !== assetGenerationManifest),
          "bootstrap",
        ),
        previous: [],
      };
    } catch (directoryError) {
      if (directoryError.code === "ENOENT") return { version: 1, current: [], previous: [] };
      throw directoryError;
    }
  }
}

for (const temporary of temporaryPaths) {
  await rm(temporary, { recursive: true, force: true });
}
try {
  await mkdir(nextHtml, { recursive: true });
  await mkdir(previousHtml, { recursive: true });
  await cp(resolve(stage, "assets"), nextAssets, { recursive: true });
  const currentAssets = validateAssetNames(await readdir(resolve(stage, "assets")), "staged");
  const publishedGeneration = await currentPublishedGeneration();
  const previousAssetsToRetain = selectPreviousAssetGeneration(currentAssets, publishedGeneration);
  const currentAssetSet = new Set(currentAssets);
  for (const entry of previousAssetsToRetain) {
    if (!currentAssetSet.has(entry)) {
      await cp(resolve(generatedAssets, entry), resolve(nextAssets, entry), { recursive: true });
    }
  }
  await writeFile(resolve(nextAssets, assetGenerationManifest), `${JSON.stringify({
    version: 1,
    current: currentAssets,
    previous: previousAssetsToRetain,
  }, null, 2)}\n`);
  await cp(resolve(stage, "uk"), nextUk, { recursive: true });

  for (const filename of htmlFiles) {
    await cp(resolve(stage, filename), resolve(nextHtml, filename));
    await cp(resolve(docs, filename), resolve(previousHtml, filename));
  }
} catch (error) {
  for (const temporary of temporaryPaths) {
    await rm(temporary, { recursive: true, force: true });
  }
  throw error;
}

let movedPreviousAssets = false;
let movedPreviousUk = false;
let installedAssets = false;
let installedUk = false;
try {
  try {
    await rename(generatedAssets, previousAssets);
    movedPreviousAssets = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await rename(generatedUk, previousUk);
    movedPreviousUk = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  await rename(nextAssets, generatedAssets);
  installedAssets = true;
  await rename(nextUk, generatedUk);
  installedUk = true;
  for (const filename of htmlFiles) {
    await rename(resolve(nextHtml, filename), resolve(docs, filename));
  }
} catch (error) {
  for (const filename of htmlFiles) {
    const restorePath = resolve(docs, `.${filename}.restore`);
    await cp(resolve(previousHtml, filename), restorePath);
    await rename(restorePath, resolve(docs, filename));
  }
  if (installedAssets) await rm(generatedAssets, { recursive: true, force: true });
  if (movedPreviousAssets) await rename(previousAssets, generatedAssets);
  if (installedUk) await rm(generatedUk, { recursive: true, force: true });
  if (movedPreviousUk) await rename(previousUk, generatedUk);
  await rm(previousAssets, { recursive: true, force: true });
  await rm(previousUk, { recursive: true, force: true });
  throw error;
}

// The published assets, localized pages, and HTML files are committed now.
// Cleanup must stay outside the rollback path: a cleanup failure must never
// remove the successfully installed publication or restore a partial backup.
for (const temporary of temporaryPaths) {
  await rm(temporary, { recursive: true, force: true });
}

console.log(`Published ${htmlFiles.length * 2} localized HTML entries with one bounded previous asset generation; media, JSON, CNAME, and hand-maintained docs were preserved.`);
