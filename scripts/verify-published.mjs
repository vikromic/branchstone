import { access, readFile, readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { htmlFiles as rootHtmlFiles } from "../site-pages.js";

const root = process.cwd();
const stage = resolve(root, ".stage");
const docs = resolve(root, "docs");
const htmlFiles = [...rootHtmlFiles, ...rootHtmlFiles.map((filename) => `uk/${filename}`)];
const localReference = /(?:src|href)=["']([^"']+)["']/g;
const cssReference = /url\(\s*["']?([^"')]+)["']?\s*\)/g;
const scriptReference = /["'`]((?:\/|\.\/|\.\.\/)[^"'`\s]+\.(?:css|html|jpe?g|js|json|png|svg|webp|woff2?)(?:\?[^"'`\s]*)?)["'`]/gi;

function deploymentPath(reference, owner = "") {
  if (!reference || /^(?:[a-z]+:|#|\/\/)/i.test(reference)) return null;
  const clean = reference.split(/[?#]/, 1)[0];
  if (!clean) return null;
  if (clean === "/") return "index.html";
  if (clean.startsWith("/")) return clean.endsWith("/") ? `${clean.slice(1)}index.html` : clean.slice(1);
  const ownerDirectory = owner.includes("/") ? owner.slice(0, owner.lastIndexOf("/") + 1) : "";
  return resolve("/", ownerDirectory, clean).slice(1);
}

async function requireDeploymentFile(reference, owner) {
  const path = deploymentPath(reference, owner);
  if (!path) return null;
  try {
    await access(resolve(docs, path));
  } catch {
    throw new Error(`${owner}: missing deployed reference ${reference} (${path})`);
  }
  return path;
}

const discovered = new Set();
for (const filename of htmlFiles) {
  const [expected, published] = await Promise.all([
    readFile(resolve(stage, filename), "utf8"),
    readFile(resolve(docs, filename), "utf8"),
  ]);
  if (published !== expected) throw new Error(`${filename}: published HTML differs from the verified stage`);
  for (const [, reference] of published.matchAll(localReference)) {
    const path = await requireDeploymentFile(reference, filename);
    if (path) discovered.add(path);
  }
}

const inspected = new Set();
const queue = [...discovered];
while (queue.length) {
  const path = queue.shift();
  if (inspected.has(path)) continue;
  inspected.add(path);
  const extension = extname(path).toLowerCase();
  if (extension !== ".css" && extension !== ".js") continue;
  const source = await readFile(resolve(docs, path), "utf8");
  const pattern = extension === ".css" ? cssReference : scriptReference;
  for (const match of source.matchAll(pattern)) {
    const next = await requireDeploymentFile(match[1], path);
    if (next && !inspected.has(next)) queue.push(next);
  }
}

const leftovers = (await readdir(docs)).filter((entry) => entry.startsWith(".branchstone-"));
if (leftovers.length) throw new Error(`Publish temporary paths remain: ${leftovers.join(", ")}`);
for (const obsolete of ["js", "css"]) {
  try {
    await access(resolve(docs, obsolete));
    throw new Error(`Obsolete legacy directory remains: docs/${obsolete}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

console.log(`Published artifact verified: ${htmlFiles.length} localized HTML files match stage, ${inspected.size} local dependency paths resolve, and no publish residue remains.`);
