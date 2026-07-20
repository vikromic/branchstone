export const assetGenerationManifest = ".branchstone-generations.json";

export function validateAssetNames(names, label) {
  if (!Array.isArray(names) || names.some((entry) => (
    typeof entry !== "string"
    || entry.length === 0
    || entry === assetGenerationManifest
    || entry.includes("/")
    || entry.includes("\\")
    || entry === "."
    || entry === ".."
  ))) {
    throw new Error(`Invalid ${label} asset generation manifest`);
  }
  return [...new Set(names)].sort();
}

export function parseAssetGenerationManifest(source) {
  const manifest = JSON.parse(source);
  if (manifest.version !== 1) throw new Error("Unsupported asset generation manifest version");
  return {
    version: 1,
    current: validateAssetNames(manifest.current, "current"),
    previous: validateAssetNames(manifest.previous, "previous"),
  };
}

export function selectPreviousAssetGeneration(stagedAssets, publishedGeneration) {
  const staged = validateAssetNames(stagedAssets, "staged");
  const current = validateAssetNames(publishedGeneration.current, "current");
  const previous = validateAssetNames(publishedGeneration.previous, "previous");
  return staged.join("\n") === current.join("\n") ? previous : current;
}
