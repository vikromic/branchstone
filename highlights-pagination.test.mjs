import assert from 'node:assert/strict';
import {
  getCarouselPageStarts,
  resolveCurrentPage,
  getNextPageStart
} from './docs/js/highlights-pagination.mjs';

const run = () => {
  // Happy path: partial last page should have a dedicated page start.
  const pageStarts = getCarouselPageStarts(5, 2);
  assert.deepEqual(pageStarts, [0, 2, 3], 'expected page starts [0, 2, 3] for 5 items and 2 slides');

  // Happy path: forward/backward direction should stay semantically correct.
  assert.equal(getNextPageStart(pageStarts, 0, 1), 2, 'forward from first page should go to second page');
  assert.equal(getNextPageStart(pageStarts, 2, 1), 3, 'forward from second page should go to last page');
  assert.equal(getNextPageStart(pageStarts, 3, 1), 0, 'forward from last page should wrap to first page');
  assert.equal(getNextPageStart(pageStarts, 0, -1), 3, 'backward from first page should wrap to last page');
  assert.equal(getNextPageStart(pageStarts, 3, -1), 2, 'backward from last page should go to previous page');

  // Happy path: resolve current page from an in-between index.
  assert.equal(resolveCurrentPage(pageStarts, 1), 0, 'index 1 should map to page 0');
  assert.equal(resolveCurrentPage(pageStarts, 3), 2, 'index 3 should map to last page');

  // Error path: invalid slidesPerView should fail fast.
  assert.throws(
    () => getCarouselPageStarts(5, 0),
    /slidesPerView must be a positive integer/,
    'expected validation error for invalid slidesPerView'
  );

  // Error path: invalid direction should fail fast.
  assert.throws(
    () => getNextPageStart(pageStarts, 0, 0),
    /direction must be 1 \(forward\) or -1 \(backward\)/,
    'expected validation error for invalid direction'
  );
};

run();
console.log('highlights-pagination tests passed');
