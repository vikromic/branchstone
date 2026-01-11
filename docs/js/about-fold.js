/**
 * About Page - Text Fold Functionality
 * Implements expand/collapse for long artist bio text
 */

(function () {
  'use strict';

  const initAboutTextFold = () => {
    const bioContent = document.querySelector('.artist-bio__content');
    const foldToggle = document.querySelector('[data-fold-toggle]');

    if (!bioContent || !foldToggle) {
      console.log('[AboutFold] Required elements not found');
      return;
    }

    // Toggle fold state
    const toggleFold = () => {
      const isExpanded = bioContent.classList.contains('is-expanded');

      if (isExpanded) {
        // Collapse
        bioContent.classList.remove('is-expanded');
        bioContent.classList.add('is-collapsed');
        foldToggle.textContent = 'Read more';
        foldToggle.setAttribute('aria-expanded', 'false');

        // Smooth scroll to heading
        const heading = document.getElementById('story-heading');
        if (heading) {
          setTimeout(() => {
            heading.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }, 100);
        }
      } else {
        // Expand
        bioContent.classList.remove('is-collapsed');
        bioContent.classList.add('is-expanded');
        foldToggle.textContent = 'Read less';
        foldToggle.setAttribute('aria-expanded', 'true');
      }
    };

    // Event listener
    foldToggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFold();
    });

    // Initialize in collapsed state
    bioContent.classList.add('is-collapsed');
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutTextFold);
  } else {
    initAboutTextFold();
  }
})();
