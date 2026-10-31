export function assetUrl(path) {
  const clean = String(path).replace(/^\/+/, "");
  return import.meta.env.DEV ? `/docs/${clean}` : `/${clean}`;
}
