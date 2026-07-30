import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { htmlFiles } from "../site-pages.js";

const root = process.cwd();
const stage = resolve(root, ".stage");
const docs = resolve(root, "docs");
const ukrainianMarkers = {
  "index.html": ["усі роботи"],
  "gallery.html": ["ЖИВИЙ АРХІВ МАТЕРІАЛІВ", "Роботи, що несуть землю"],
  "exhibitions.html": ["Вибрана преса", "Галерея Rena Charles", "Запити від галерей"],
  "about.html": ["Statement художниці", "02 / Біографія", "05 / Продовження"],
  "commissions.html": ["ФОРМА / МАТЕРІЯ / ПАМ’ЯТЬ"],
  "contact.html": ["Почніть із нотатки."],
  "privacy.html": ["НОТАТКИ"],
  "terms.html": ["Умови для роботи й розмови."],
  "404.html": ["Цей шар уже вивітрився."],
};

function verifyPrehydrateContract(html, filename) {
  const prehydrate = html.indexOf("<script data-branchstone-prehydrate");
  const theme = html.indexOf("branchstone-theme");
  const body = html.indexOf("<body");
  const root = html.indexOf('<div id="root"');
  if (prehydrate < 0) throw new Error(`${filename}: pre-hydration contract is missing`);
  if (!(prehydrate < theme && theme < body && body < root)) {
    throw new Error(`${filename}: pre-hydration, theme, body, and SSR root ordering is unsafe`);
  }
  if (!html.includes("prefers-reduced-motion: reduce") || !html.includes("stay-enhanced")) {
    throw new Error(`${filename}: motion enhancement gate is missing`);
  }
  if (filename.endsWith("index.html") && (!html.includes('pageId === "home"') || !html.includes("currentLocation.replace(target)"))) {
    throw new Error(`${filename}: Home legacy artwork redirect is missing`);
  }
}

for (const filename of htmlFiles) {
  const html = await readFile(resolve(stage, filename), "utf8");
  verifyPrehydrateContract(html, filename);
  if (!html.includes("<main")) throw new Error(`${filename}: raw HTML has no semantic main content`);
  if (!html.includes("<h1")) throw new Error(`${filename}: raw HTML has no h1`);
  if (!html.includes('<template id="branchstone-uk-root">')) throw new Error(`${filename}: Ukrainian prerender template is missing`);
  if (!html.includes('<meta name="theme-color" content="#15110e"')) throw new Error(`${filename}: shared theme color is missing`);
  for (const marker of ukrainianMarkers[filename]) {
    if (!html.includes(marker)) throw new Error(`${filename}: Ukrainian marker is missing: ${marker}`);
  }
  if (
    filename === "gallery.html"
    && (html.match(/class="gallery-index-work"/g) ?? []).length !== 64
  ) {
    throw new Error(`${filename}: live and fallback locale archives must each expose all 32 linked works`);
  }
  if (/docs\/(?:js|css)\//.test(html)) throw new Error(`${filename}: legacy asset reference remains`);

  const ukrainianHtml = await readFile(resolve(stage, "uk", filename), "utf8");
  verifyPrehydrateContract(ukrainianHtml, `uk/${filename}`);
  if (!ukrainianHtml.includes('<html lang="uk"')) throw new Error(`uk/${filename}: live document language is not Ukrainian`);
  if (!ukrainianHtml.includes('data-initial-locale="uk"')) throw new Error(`uk/${filename}: Ukrainian root is not live`);
  if (ukrainianHtml.includes('id="branchstone-uk-root"')) throw new Error(`uk/${filename}: locale still depends on a script-swapped template`);
  if (!ukrainianHtml.includes("<main") || !ukrainianHtml.includes("<h1")) throw new Error(`uk/${filename}: semantic content is missing`);
  for (const marker of ukrainianMarkers[filename]) {
    if (!ukrainianHtml.includes(marker)) throw new Error(`uk/${filename}: live Ukrainian marker is missing: ${marker}`);
  }
  if (
    filename === "gallery.html"
    && (ukrainianHtml.match(/class="gallery-index-work"/g) ?? []).length !== 32
  ) {
    throw new Error(`uk/${filename}: progressive archive must expose all 32 linked works`);
  }
}

for (const required of ["CNAME", ".nojekyll", "favicon.svg", "site.webmanifest", "robots.txt", "sitemap.xml"]) {
  await access(resolve(docs, required));
}

const { artworks } = JSON.parse(await readFile(resolve(docs, "json_data/artworks.json"), "utf8"));
const { artworks: ukrainian } = JSON.parse(await readFile(resolve(docs, "json_data/ukr/artworks_uk.json"), "utf8"));
if (artworks.length !== 32 || ukrainian.length !== 32) throw new Error("Catalog must contain 32 EN and 32 UA artworks");
if (artworks.filter((artwork) => !artwork.sold).length !== 19) throw new Error("Expected 19 available artworks");
if (artworks.filter((artwork) => artwork.sold).length !== 13) throw new Error("Expected 13 collected artworks");

const uaImages = new Set(ukrainian.map((artwork) => artwork.main_image));
for (const artwork of artworks) {
  if (!uaImages.has(artwork.main_image)) throw new Error(`UA locale join missing ${artwork.main_image}`);
  const directory = artwork.main_image.slice(0, artwork.main_image.lastIndexOf("/") + 1);
  for (const image of [artwork.main_image, ...(artwork.images ?? []).map((filename) => `${directory}${filename}`)]) {
    await access(resolve(docs, image));
  }
}

const cname = (await readFile(resolve(docs, "CNAME"), "utf8")).trim();
if (cname !== "branchstone.art") throw new Error(`Unexpected CNAME: ${cname}`);
console.log(`Artifact contract verified: ${htmlFiles.length * 2} localized prerendered entries, 32/19/13 catalog invariants, locale joins, primary media, and deployment files.`);
