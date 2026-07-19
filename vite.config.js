import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sitePages } from "./site-pages.js";
import { isUkrainianPath, localePathname } from "./src/domain/content.js";

const root = process.cwd();

function devDocumentAliases() {
  const aliases = new Map([
    ["/favicon.svg", "/docs/favicon.svg"],
    ["/site.webmanifest", "/docs/site.webmanifest"],
  ]);
  return {
    name: "branchstone-dev-document-aliases",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const [pathname = "", query = ""] = request.url?.split("?", 2) ?? [];
        if (aliases.has(pathname)) request.url = aliases.get(pathname);
        else if (isUkrainianPath(pathname)) {
          const unprefixed = localePathname(pathname, "en");
          request.url = `${unprefixed}${query ? `?${query}` : ""}`;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), devDocumentAliases()],
  publicDir: false,
  base: "/",
  server: {
    fs: { allow: [root] },
  },
  build: isSsrBuild
    ? {
        outDir: ".stage-ssr",
        emptyOutDir: true,
      }
    : {
        outDir: ".stage",
        emptyOutDir: true,
        rollupOptions: {
          input: Object.fromEntries(sitePages.map(({ id, filename }) => [id, resolve(root, filename)])),
        },
      },
}));
