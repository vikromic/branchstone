import { createServer as createHttpServer } from "node:http";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer as createViteServer } from "vite";

const root = process.cwd();
let httpServer;
let origin;
let vite;

beforeAll(async () => {
  vite = await createViteServer({
    configFile: resolve(root, "vite.config.js"),
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false },
  });
  httpServer = createHttpServer(vite.middlewares);
  await new Promise((resolveListen, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, "127.0.0.1", resolveListen);
  });
  const address = httpServer.address();
  origin = `http://127.0.0.1:${address.port}`;
}, 20_000);

afterAll(async () => {
  await new Promise((resolveClose, reject) => {
    httpServer.close((error) => error ? reject(error) : resolveClose());
    httpServer.closeAllConnections?.();
  });
  await vite.close();
});

async function documentRequest(path, options = {}) {
  return fetch(`${origin}${path}`, {
    ...options,
    headers: { Accept: "text/html", ...options.headers },
  });
}

describe("Vite document routing", () => {
  it.each([
    ["English", "/a-layer-that-does-not-exist", "en", "Layer weathered away — Branchstone"],
    ["Ukrainian", "/uk/a-layer-that-does-not-exist", "uk", "Шар вивітрився — Branchstone"],
  ])("serves the custom %s 404 document with an HTTP 404", async (_label, path, lang, title) => {
    const response = await documentRequest(path);
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain(`lang="${lang}"`);
    expect(html).toContain(`<title>${title}</title>`);
    expect(html).toContain('data-page="notFound"');
    expect(html).toContain("/src/entries/not-found.jsx");
    expect(html).not.toContain('data-page="home"');
  });

  it.each([
    ["/", "home"],
    ["/gallery.html", "gallery"],
    ["/uk/gallery.html?collection=following-her-steps", "gallery"],
    ["/404.html", "notFound"],
  ])("keeps known document %s on its own entrypoint", async (path, page) => {
    const response = await documentRequest(path);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(`data-page="${page}"`);
  });

  it.each([
    ["/@vite/client", "text/javascript"],
    ["/src/styles/index.css", "text/javascript"],
    ["/favicon.svg", "image/svg+xml"],
  ])("does not capture the known Vite or asset path %s", async (path, contentType) => {
    const response = await fetch(`${origin}${path}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(contentType);
  });

  it("returns an empty custom 404 body for HEAD without changing its status", async () => {
    const response = await documentRequest("/uk/missing-head", { method: "HEAD" });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });
});
