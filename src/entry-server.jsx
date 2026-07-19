import { renderToString } from "react-dom/server";
import { SiteProvider } from "./app/SiteContext.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { GalleryPage } from "./pages/GalleryPage.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";
import { CommissionsPage } from "./pages/CommissionsPage.jsx";
import { ContactPage } from "./pages/ContactPage.jsx";
import { PrivacyPage } from "./pages/PrivacyPage.jsx";
import { TermsPage } from "./pages/TermsPage.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";
import "./styles/index.css";

const pages = {
  home: HomePage,
  gallery: GalleryPage,
  about: AboutPage,
  commissions: CommissionsPage,
  contact: ContactPage,
  privacy: PrivacyPage,
  terms: TermsPage,
  notFound: NotFoundPage,
};

export function renderPage(page, locale = "en") {
  const Page = pages[page];
  if (!Page) throw new Error(`Unknown page: ${page}`);
  return renderToString(<SiteProvider initialLocale={locale}><Page /></SiteProvider>);
}
