export const pageMetadata = Object.freeze({
  home: {
    en: { title: "Branchstone by Viktoria — Mixed Media Art", description: "Branchstone is Viktoria's living material archive: mixed-media works shaped by bark, earth, memory, and time." },
    uk: { title: "Branchstone від Вікторії — мистецтво змішаних медіа", description: "Живий матеріальний архів Branchstone: роботи з кори, землі, пам’яті й часу." },
  },
  gallery: {
    en: { title: "Works — Branchstone by Viktoria", description: "Explore 32 mixed-media works across Branchstone's living material archive." },
    uk: { title: "Роботи — Branchstone від Вікторії", description: "Перегляньте 32 роботи змішаних медіа в живому матеріальному архіві Branchstone." },
  },
  exhibitions: {
    en: { title: "Exhibitions & Press — Branchstone by Viktoria", description: "Selected exhibitions, events, interviews, and published conversations from Viktoria's Branchstone practice." },
    uk: { title: "Виставки та преса — Branchstone від Вікторії", description: "Вибрані виставки, події, інтерв’ю та публікації про мистецьку практику Вікторії Branchstone." },
  },
  about: {
    en: { title: "Practice — Branchstone by Viktoria", description: "Viktoria's practice moves between painting and nature, carrying material memory from Donbas to California." },
    uk: { title: "Практика — Branchstone від Вікторії", description: "Практика Вікторії поєднує живопис і природу, несучи матеріальну пам’ять від Донбасу до Каліфорнії." },
  },
  commissions: {
    en: { title: "Commission — Branchstone by Viktoria", description: "Begin a considered conversation about a one-of-a-kind Branchstone commission." },
    uk: { title: "Індивідуальна робота — Branchstone", description: "Почніть уважну розмову про унікальну роботу Branchstone, створену для вашого простору." },
  },
  contact: {
    en: { title: "Contact — Branchstone by Viktoria", description: "Contact Viktoria about gallery, curatorial, collection, press, artwork, or commission enquiries." },
    uk: { title: "Контакти — Branchstone від Вікторії", description: "Напишіть Вікторії щодо галерейної, кураторської чи колекційної співпраці, преси, робіт або індивідуальних замовлень." },
  },
  privacy: {
    en: { title: "Privacy — Branchstone by Viktoria", description: "How Branchstone handles preferences, inquiry drafts, and correspondence." },
    uk: { title: "Конфіденційність — Branchstone", description: "Як Branchstone працює з налаштуваннями, чернетками запитів і листуванням." },
  },
  terms: {
    en: { title: "Terms — Branchstone by Viktoria", description: "Terms for viewing, purchasing, and commissioning work from Branchstone." },
    uk: { title: "Умови — Branchstone", description: "Умови перегляду, придбання та індивідуального замовлення робіт Branchstone." },
  },
  notFound: {
    en: { title: "Layer weathered away — Branchstone", description: "The Branchstone page you followed is no longer here." },
    uk: { title: "Шар вивітрився — Branchstone", description: "Сторінки Branchstone за цією адресою більше немає." },
  },
});

export function getPageMetadata(page, locale = "en") {
  return pageMetadata[page]?.[locale === "uk" ? "uk" : "en"] ?? pageMetadata.home.en;
}
