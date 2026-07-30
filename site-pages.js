export const sitePages = Object.freeze([
  { id: "home", filename: "index.html" },
  { id: "gallery", filename: "gallery.html" },
  { id: "exhibitions", filename: "exhibitions.html" },
  { id: "about", filename: "about.html" },
  { id: "commissions", filename: "commissions.html" },
  { id: "contact", filename: "contact.html" },
  { id: "privacy", filename: "privacy.html" },
  { id: "terms", filename: "terms.html" },
  { id: "notFound", filename: "404.html" },
]);

export const htmlFiles = Object.freeze(sitePages.map(({ filename }) => filename));
export const pagePathById = Object.freeze(Object.fromEntries(
  sitePages.map(({ id, filename }) => [id, filename === "index.html" ? "/" : `/${filename}`]),
));
