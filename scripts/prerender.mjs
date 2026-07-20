import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getPageMetadata } from "../src/domain/metadata.js";
import { localePathname } from "../src/domain/content.js";
import { sitePages } from "../site-pages.js";

const root = process.cwd();
const { renderPage } = await import(pathToFileURL(resolve(root, ".stage-ssr/entry-server.js")));
function pagePath(filename, locale = "en") {
  const pathname = filename === "index.html" ? "/" : `/${filename}`;
  return localePathname(pathname, locale);
}

function addLocaleLinks(html, filename) {
  const canonical = html.match(/<link rel="canonical"[^>]*>/)?.[0];
  if (!canonical) return html;
  const englishUrl = `https://branchstone.art${pagePath(filename, "en")}`;
  const ukrainianUrl = `https://branchstone.art${pagePath(filename, "uk")}`;
  const alternates = `${canonical}\n    <link rel="alternate" hreflang="en" href="${englishUrl}" />\n    <link rel="alternate" hreflang="uk" href="${ukrainianUrl}" />\n    <link rel="alternate" hreflang="x-default" href="${englishUrl}" />`;
  return html.replace(canonical, alternates);
}

function localizeHead(html, filename, page) {
  const { title, description } = getPageMetadata(page, "uk");
  const canonicalUrl = `https://branchstone.art${pagePath(filename, "uk")}`;
  return html
    .replace('<html lang="en"', '<html lang="uk"')
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content=${JSON.stringify(description)} />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content=${JSON.stringify(title)} />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content=${JSON.stringify(description)} />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
}

await mkdir(resolve(root, ".stage", "uk"), { recursive: true });

for (const { filename, id: page } of sitePages) {
  const path = resolve(root, ".stage", filename);
  const html = await readFile(path, "utf8");
  const marker = '<div id="root"></div>';
  if (!html.includes(marker)) throw new Error(`${filename} is missing the prerender root marker`);
  const englishMarkup = renderPage(page, "en");
  const ukrainianMarkup = renderPage(page, "uk");
  const { title: ukrainianTitle, description: ukrainianDescription } = getPageMetadata(page, "uk");
  const localeBootstrap = `<script>(function(){var r=document.getElementById('root'),t=document.getElementById('branchstone-uk-root'),l='en',q=new URLSearchParams(location.search).get('lang'),p=location.pathname==='/uk'||location.pathname.startsWith('/uk/'),s=null;if(p){l='uk'}else if(q==='uk'||q==='en'){l=q;try{localStorage.setItem('branchstone.language',q)}catch(e){}}else{try{s=localStorage.getItem('branchstone.language')}catch(e){}if(s==='uk'||s==='en')l=s;else{var n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];if(n.some(function(x){return /^uk(?:-|$)/i.test(x||'')}))l='uk'}}r.dataset.initialLocale=l;if(l==='uk'){document.documentElement.lang='uk';r.replaceChildren(t.content.cloneNode(true));document.title=${JSON.stringify(ukrainianTitle)};var d=document.querySelector('meta[name="description"]');if(d)d.content=${JSON.stringify(ukrainianDescription)};var ot=document.querySelector('meta[property="og:title"]');if(ot)ot.content=${JSON.stringify(ukrainianTitle)};var od=document.querySelector('meta[property="og:description"]');if(od)od.content=${JSON.stringify(ukrainianDescription)};var u=new URL(location.href);if(u.pathname!=='/uk'&&!u.pathname.startsWith('/uk/'))u.pathname=u.pathname==='/'?'/uk/':'/uk'+u.pathname;u.searchParams.delete('lang');history.replaceState(history.state,'',u.pathname+u.search+u.hash)}else if(q==='en'){var e=new URL(location.href);e.searchParams.delete('lang');history.replaceState(history.state,'',e.pathname+e.search+e.hash)}t.remove()})()</script>`;
  const localizedRoot = `<div id="root" data-initial-locale="en">${englishMarkup}</div><template id="branchstone-uk-root">${ukrainianMarkup}</template>${localeBootstrap}`;
  await writeFile(path, addLocaleLinks(html, filename).replace(marker, localizedRoot));

  const ukrainianRoot = `<div id="root" data-initial-locale="uk">${ukrainianMarkup}</div>`;
  const ukrainianHtml = addLocaleLinks(localizeHead(html, filename, page), filename).replace(marker, ukrainianRoot);
  await writeFile(resolve(root, ".stage", "uk", filename), ukrainianHtml);
}
