import { createRoot, hydrateRoot } from "react-dom/client";
import { SiteProvider } from "./SiteContext.jsx";
import { isUkrainianPath } from "../domain/content.js";
import "../styles/index.css";

export function startPage(Page) {
  const root = document.getElementById("root");
  const urlLocale = new URL(window.location.href).searchParams.get("lang");
  const pathIsUkrainian = isUkrainianPath(window.location.pathname);
  const initialLocale = pathIsUkrainian || urlLocale === "uk" || (urlLocale !== "en" && root.dataset.initialLocale === "uk") ? "uk" : "en";
  const page = <SiteProvider initialLocale={initialLocale}><Page /></SiteProvider>;
  if (root.hasChildNodes()) hydrateRoot(root, page);
  else createRoot(root).render(page);
}
