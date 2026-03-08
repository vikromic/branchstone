/**
 * Highlights pagination helpers
 * Pure utilities for page-based carousel navigation.
 */

/**
 * Build stable page start indexes for a carousel.
 * Example: 5 items with 2 per view -> [0, 2, 3]
 *
 * @param {number} totalItems
 * @param {number} slidesPerView
 * @returns {number[]}
 */
export const getCarouselPageStarts = (totalItems, slidesPerView) => {
  if (!Number.isInteger(totalItems) || totalItems < 0) {
    throw new Error('[HighlightsPagination] totalItems must be a non-negative integer');
  }

  if (!Number.isInteger(slidesPerView) || slidesPerView <= 0) {
    throw new Error('[HighlightsPagination] slidesPerView must be a positive integer');
  }

  if (totalItems === 0) {
    return [];
  }

  const totalPages = Math.ceil(totalItems / slidesPerView);
  const maxStartIndex = Math.max(0, totalItems - slidesPerView);
  const starts = [];

  for (let page = 0; page < totalPages; page++) {
    const startIndex = Math.min(page * slidesPerView, maxStartIndex);
    if (starts[starts.length - 1] !== startIndex) {
      starts.push(startIndex);
    }
  }

  return starts;
};

/**
 * Resolve current page index from page starts.
 * Uses the last page start that does not exceed currentIndex.
 *
 * @param {number[]} pageStarts
 * @param {number} currentIndex
 * @returns {number}
 */
export const resolveCurrentPage = (pageStarts, currentIndex) => {
  if (!Array.isArray(pageStarts) || pageStarts.length === 0) {
    throw new Error('[HighlightsPagination] pageStarts must be a non-empty array');
  }

  if (!Number.isInteger(currentIndex) || currentIndex < 0) {
    throw new Error('[HighlightsPagination] currentIndex must be a non-negative integer');
  }

  let pageIndex = 0;
  for (let i = 0; i < pageStarts.length; i++) {
    if (currentIndex >= pageStarts[i]) {
      pageIndex = i;
    } else {
      break;
    }
  }

  return pageIndex;
};

/**
 * Get the next page start index in a specific direction.
 * Direction: 1 = forward, -1 = backward. Wraps around.
 *
 * @param {number[]} pageStarts
 * @param {number} currentIndex
 * @param {number} direction
 * @returns {number}
 */
export const getNextPageStart = (pageStarts, currentIndex, direction) => {
  if (direction !== 1 && direction !== -1) {
    throw new Error('[HighlightsPagination] direction must be 1 (forward) or -1 (backward)');
  }

  const currentPage = resolveCurrentPage(pageStarts, currentIndex);
  const pageCount = pageStarts.length;
  const targetPage = direction === 1
    ? (currentPage + 1) % pageCount
    : (currentPage - 1 + pageCount) % pageCount;

  return pageStarts[targetPage];
};
