import englishHighlights from "../../docs/json_data/highlights.json";
import ukrainianHighlights from "../../docs/json_data/ukr/highlights_uk.json";

const ukrainianHighlightById = new Map(
  ukrainianHighlights.highlights.map((highlight) => [highlight.id, highlight]),
);

export function getHighlights(locale) {
  const records = englishHighlights.highlights.map((highlight) => (
    locale === "uk" ? { ...highlight, ...(ukrainianHighlightById.get(highlight.id) ?? {}) } : highlight
  ));
  return records.reverse();
}
