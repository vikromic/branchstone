import feedbackSource from "../../docs/json_data/feedbacks.json";

const englishFeedback = [0, 3, 5].map((index) => feedbackSource.feedbacks[index]);

const ukrainianFeedback = [
  { name: "Сара Мітчелл", location: "Плейно, Техас", review: "Робота Вікторії принесла частинку лісу в наш дім." },
  { name: "Девід К.", location: "Даллас, Техас", review: "Я розмістив «Липневі сосни» у спальні. Кольори, текстури й атмосфера повертають відчуття літа, проведеного в лісі з друзями." },
  { name: "Емілі Родрігез", location: "Плейно, Техас", review: "Це не просто мистецтво — це розмова з природою." },
];

export function getFeedbacks(locale) {
  return locale === "uk" ? ukrainianFeedback : englishFeedback;
}
