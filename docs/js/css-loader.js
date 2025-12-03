/**
 * CSS Loader Utility
 * Handles async CSS loading without inline event handlers
 * Compliant with strict CSP (no 'unsafe-inline')
 */
(function () {
  'use strict';

  /**
   * Load CSS asynchronously by changing media attribute
   * Replaces inline onload handlers for CSP compliance
   */
  function loadAsyncCSS() {
    // Find all stylesheets with media="print" that should be loaded async
    const asyncStyles = document.querySelectorAll('link[rel="stylesheet"][media="print"]');

    asyncStyles.forEach((link) => {
      // Check if this is an async-load stylesheet (has data-async attribute or media="print")
      if (link.media === 'print') {
        // Change media to 'all' to apply styles
        link.media = 'all';
      }
    });
  }

  // Load async CSS when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAsyncCSS);
  } else {
    // DOM already loaded
    loadAsyncCSS();
  }
})();
