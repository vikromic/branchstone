import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { branchstonePrehydratePlugin } from "./scripts/prehydrate.mjs";
import { sitePages } from "./site-pages.js";
import { isUkrainianPath, localePathname } from "./src/domain/content.js";
import { getPageMetadata } from "./src/domain/metadata.js";

const root = process.cwd();
const documentPaths = new Set(sitePages.flatMap(({ filename }) => (
  filename === "index.html" ? ["/", "/index.html"] : [`/${filename}`]
)));

function isDocumentRequest(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  return request.headers.accept?.includes("text/html")
    || request.headers["sec-fetch-dest"] === "document";
}

function isViteResourcePath(pathname) {
  const extension = extname(pathname);
  return pathname.startsWith("/@")
    || pathname.startsWith("/__vite")
    || pathname.startsWith("/src/")
    || pathname.startsWith("/docs/")
    || pathname.startsWith("/node_modules/")
    || (extension !== "" && extension !== ".html");
}

function localizeNotFoundHead(html, locale) {
  if (locale !== "uk") return html;
  const { title, description } = getPageMetadata("notFound", "uk");
  return html
    .replace('<html lang="en"', '<html lang="uk"')
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content=${JSON.stringify(description)} />`,
    );
}

function devDocumentAliases() {
  const aliases = new Map([
    ["/favicon.svg", "/docs/favicon.svg"],
    ["/site.webmanifest", "/docs/site.webmanifest"],
  ]);
  return {
    name: "branchstone-dev-document-aliases",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? "/", "http://branchstone.local");
        const pathname = url.pathname;

        if (aliases.has(pathname)) {
          request.url = `${aliases.get(pathname)}${url.search}`;
          next();
          return;
        }

        if (isViteResourcePath(pathname)) {
          next();
          return;
        }

        const locale = isUkrainianPath(pathname) ? "uk" : "en";
        const unprefixed = localePathname(pathname, "en");
        if (documentPaths.has(unprefixed)) {
          if (locale === "uk") request.url = `${unprefixed}${url.search}`;
          next();
          return;
        }

        if (!isDocumentRequest(request)) {
          next();
          return;
        }

        try {
          const source = await readFile(resolve(root, "404.html"), "utf8");
          const localizedSource = localizeNotFoundHead(source, locale);
          const html = await server.transformIndexHtml(pathname, localizedSource, request.originalUrl);
          response.statusCode = 404;
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.setHeader("Cache-Control", "no-cache");
          response.end(request.method === "HEAD" ? undefined : html);
        } catch (error) {
          server.ssrFixStacktrace(error);
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [branchstonePrehydratePlugin(), react(), devDocumentAliases()],
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
