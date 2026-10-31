import { createRoot, hydrateRoot } from "react-dom/client";
import { SiteProvider } from "./SiteContext.jsx";
import { resolveLocale } from "../domain/locale.js";
import "../styles/index.css";

export function startPage(Page) {
  const root = document.getElementById("root");
  // Hydration must match the prerendered markup, so only URL and the prerendered
  // document locale decide; stored and browser preferences apply after mount.
  const initialLocale = resolveLocale({
    pathname: window.location.pathname,
    search: window.location.search,
    prerendered: root.dataset.initialLocale,
  });
  const page = <SiteProvider initialLocale={initialLocale}><Page /></SiteProvider>;
  if (root.hasChildNodes()) hydrateRoot(root, page);
  else createRoot(root).render(page);
}
