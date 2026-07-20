export const CONTACT_EMAIL = "thebranchstone@gmail.com";
export const INSTAGRAM_URL = "https://www.instagram.com/thebranchstone/";

export const copy = {
  en: {
    nav: { home: "Home", gallery: "Works", about: "Practice", commissions: "Commission", contact: "Correspondence" },
    shell: {
      menu: "Menu",
      close: "Close",
      language: "Українська",
      themeSoil: "Use soil mode",
      themePaper: "Use paper mode",
      favorites: "Saved works",
      skip: "Skip to content",
      savedAgain: "Some saved-work data was unreadable or no longer matched the archive. Please save that work again.",
      storageUnavailable: "This browser blocked local storage. Changes work for this visit but cannot be kept after you leave.",
      archive: "Living material archive",
      archiveIndex: "ARCHIVE",
      routes: "BRANCHSTONE / ROUTES",
      primaryNavigation: "Primary navigation",
      footerKicker: "STAY INFORMED / NO SUBSCRIPTION NEEDED",
      footerTitle: "Follow what is taking form.",
      privacy: "Privacy",
      terms: "Terms",
      homeLabel: "Branchstone by Viktoria, home",
    },
    common: {
      available: "Available",
      collected: "Collected",
      inquire: "Inquire",
      view: "View work",
      save: "Save work",
      saved: "Saved",
      all: "All",
      close: "Close",
      back: "Back",
      continue: "Continue",
    },
  },
  uk: {
    nav: { home: "Головна", gallery: "Роботи", about: "Практика", commissions: "Замовити", contact: "Листування" },
    shell: {
      menu: "Меню",
      close: "Закрити",
      language: "English",
      themeSoil: "Увімкнути режим ґрунту",
      themePaper: "Увімкнути паперовий режим",
      favorites: "Збережені роботи",
      skip: "До основного вмісту",
      savedAgain: "Частину даних про збережені роботи неможливо прочитати або зіставити з архівом. Будь ласка, збережіть роботу ще раз.",
      storageUnavailable: "Браузер заблокував локальне сховище. Зміни працюють зараз, але не збережуться після виходу.",
      archive: "Живий архів матеріалів",
      archiveIndex: "АРХІВ",
      routes: "BRANCHSTONE / МАРШРУТИ",
      primaryNavigation: "Основна навігація",
      footerKicker: "БУДЬТЕ В КУРСІ / БЕЗ ПІДПИСКИ",
      footerTitle: "Слідкуйте за тим, що формується.",
      privacy: "Політика конфіденційності",
      terms: "Умови надання послуг",
      homeLabel: "Branchstone by Viktoria, головна сторінка",
    },
    common: {
      available: "Доступна",
      collected: "У колекції",
      inquire: "Запитати",
      view: "Переглянути",
      save: "Зберегти",
      saved: "Збережено",
      all: "Усі",
      close: "Закрити",
      back: "Назад",
      continue: "Далі",
    },
  },
};

export function isUkrainianPath(pathname) {
  return pathname === "/uk" || pathname.startsWith("/uk/");
}

export function localePathname(pathname, locale) {
  const isLocalized = isUkrainianPath(pathname);
  if (locale === "uk" && !isLocalized) return pathname === "/" ? "/uk/" : `/uk${pathname}`;
  if (locale !== "uk" && isLocalized) return pathname === "/uk" || pathname === "/uk/" ? "/" : pathname.slice(3);
  return pathname;
}

export function localeHref(path, locale) {
  const url = new URL(path, "https://branchstone.art");
  url.pathname = localePathname(url.pathname, locale);
  url.searchParams.delete("lang");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function contactInquiryHref(locale, message, artworkIds = []) {
  const search = new URLSearchParams();
  const ids = Array.isArray(artworkIds) ? artworkIds : [artworkIds];
  ids.filter(Boolean).forEach((id) => search.append("art", id));
  search.set("message", message);
  return localeHref(`/contact.html?${search.toString()}`, locale);
}
