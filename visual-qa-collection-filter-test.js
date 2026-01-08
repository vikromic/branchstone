/**
 * Collection Filter Persistence - Browser Console Test Script
 * Run this in browser console at http://localhost:8000/gallery.html
 */

(function() {
  'use strict';

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  function log(message, type = 'info') {
    const prefix = {
      'pass': '✅',
      'fail': '❌',
      'warn': '⚠️',
      'info': 'ℹ️'
    }[type];
    console.log(`${prefix} ${message}`);
  }

  function assert(condition, message) {
    if (condition) {
      results.passed.push(message);
      log(message, 'pass');
      return true;
    } else {
      results.failed.push(message);
      log(message, 'fail');
      return false;
    }
  }

  function warn(message) {
    results.warnings.push(message);
    log(message, 'warn');
  }

  // Test Suite
  console.log('\n=== Collection Filter Persistence Test Suite ===\n');

  // Test 1: URL Parameter Parsing
  console.log('\n--- Test 1: URL Parameter Parsing ---');
  const urlParams = new URLSearchParams(window.location.search);
  const collectionParam = urlParams.get('collection');
  log(`Current URL collection param: ${collectionParam || 'none'}`, 'info');

  // Test 2: localStorage Access
  console.log('\n--- Test 2: localStorage Persistence ---');
  try {
    const storedCollection = localStorage.getItem('branchstone.gallery.selectedCollection');
    log(`Stored collection: ${storedCollection || 'none'}`, 'info');
    assert(true, 'localStorage is accessible');
  } catch (e) {
    assert(false, `localStorage access failed: ${e.message}`);
  }

  // Test 3: Gallery Manager Instance
  console.log('\n--- Test 3: Gallery Manager ---');
  const galleryDataScript = document.querySelector('script[src*="gallery-data"]');
  assert(galleryDataScript !== null, 'gallery-data.js script is loaded');

  // Test 4: Collections Metadata
  console.log('\n--- Test 4: Collections Metadata ---');
  fetch('./json_data/collections.json')
    .then(response => {
      assert(response.ok, 'collections.json is accessible');
      return response.json();
    })
    .then(data => {
      assert(Array.isArray(data.collections), 'collections array exists');
      log(`Found ${data.collections.length} collections in metadata`, 'info');

      data.collections.forEach(collection => {
        assert(
          collection.name && collection.description,
          `Collection "${collection.name}" has name and description`
        );
      });
    })
    .catch(error => {
      assert(false, `Failed to load collections.json: ${error.message}`);
    });

  // Test 5: Header Elements
  console.log('\n--- Test 5: Header Elements ---');
  const titleElement = document.getElementById('gallery-title');
  const subtitleElement = document.querySelector('.gallery-hero .subheading');

  assert(titleElement !== null, 'Gallery title element exists');
  assert(subtitleElement !== null, 'Gallery subtitle element exists');

  if (titleElement) {
    log(`Current title: "${titleElement.textContent}"`, 'info');
  }
  if (subtitleElement) {
    log(`Current subtitle length: ${subtitleElement.textContent.length} chars`, 'info');
  }

  // Test 6: Filter Buttons
  console.log('\n--- Test 6: Filter Buttons ---');
  const filterButtons = document.querySelectorAll('[data-filter]');
  assert(filterButtons.length > 0, `Found ${filterButtons.length} filter buttons`);

  const activeButton = document.querySelector('[data-filter].tag-active');
  if (activeButton) {
    log(`Active filter: "${activeButton.textContent.trim()}"`, 'info');
  } else {
    warn('No active filter button found');
  }

  // Test 7: Artwork Cards
  console.log('\n--- Test 7: Artwork Cards ---');
  const artworkCards = document.querySelectorAll('[data-collection]');
  assert(artworkCards.length > 0, `Found ${artworkCards.length} artwork cards`);

  const visibleCards = Array.from(artworkCards).filter(card =>
    card.style.display !== 'none'
  );
  log(`Visible cards: ${visibleCards.length}`, 'info');

  // Test 8: Console Errors
  console.log('\n--- Test 8: Console Error Check ---');
  // Note: This needs to be checked manually in the console
  warn('Check console for any errors or warnings (manual check required)');

  // Test 9: URL Encoding
  console.log('\n--- Test 9: URL Encoding Test ---');
  const testCollections = [
    'Following Her Steps',
    'Of Ash and Flowers',
    'The Calm of the Forest'
  ];

  testCollections.forEach(collectionName => {
    const encoded = encodeURIComponent(collectionName);
    const decoded = decodeURIComponent(encoded);
    assert(
      decoded === collectionName,
      `URL encoding/decoding works for "${collectionName}"`
    );
  });

  // Test 10: Filter Function Exists
  console.log('\n--- Test 10: Filter Functions ---');
  const hasFilterGallery = typeof window.filterGallery !== 'undefined';
  if (!hasFilterGallery) {
    warn('filterGallery function not in global scope (may be in module scope)');
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.failed.length > 0) {
    console.log('\nFailed Tests:');
    results.failed.forEach(test => console.log(`  - ${test}`));
  }

  if (results.warnings.length > 0) {
    console.log('\nWarnings:');
    results.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  console.log('\n=== Interactive Test Instructions ===');
  console.log('1. Click on a collection filter button');
  console.log('2. Verify URL updates with ?collection=...');
  console.log('3. Verify localStorage is updated');
  console.log('4. Verify header title and description change');
  console.log('5. Reload the page');
  console.log('6. Verify the collection remains selected');
  console.log('7. Copy URL and open in new tab');
  console.log('8. Verify collection is selected from URL');
  console.log('9. Try invalid collection in URL: ?collection=InvalidName');
  console.log('10. Verify graceful fallback to "All"');

  return {
    results,
    getReport: () => results
  };
})();
