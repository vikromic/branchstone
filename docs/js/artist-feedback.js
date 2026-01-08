/**
 * Artist Feedback Implementation - JavaScript Enhancements
 * Handles carousel, inquiry pre-fill, and enhanced lightbox functionality
 * Uses safe DOM methods to prevent XSS vulnerabilities
 */

// Import foundational modules
import { STORAGE_KEYS } from './constants.js';
import { createSVG } from './utils.js';
import * as storage from './storage.js';

(function() {
  'use strict';

  // ========================================
  // ENHANCED LIGHTBOX WITH CAROUSEL & DETAILS
  // ========================================

  const initEnhancedLightbox = () => {
    const lightbox = document.querySelector('[data-lightbox-modal]') || document.querySelector('.modal-overlay');
    if (!lightbox) return;

    const lightboxTitle = lightbox.querySelector('[data-lightbox-title]') || lightbox.querySelector('.lightbox__title');
    const lightboxCollection = lightbox.querySelector('[data-lightbox-collection]') || lightbox.querySelector('.lightbox__collection');
    const lightboxDescription = lightbox.querySelector('[data-lightbox-description]') || lightbox.querySelector('.lightbox__description');
    const lightboxCaption = lightbox.querySelector('.lightbox__caption');

    if (!lightboxCaption) return;

    // Store reference to current artwork for prints availability
    let currentArtworkElement = null;

    // Listen for lightbox open events to track current artwork
    const artworkTriggers = document.querySelectorAll('[data-lightbox-trigger]');
    artworkTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        currentArtworkElement = trigger;
      });
    });

    // Create prints available marker (conditional)
    const printsMarker = document.createElement('div');
    printsMarker.className = 'artwork-prints-available';
    printsMarker.style.display = 'none'; // Hidden by default

    const refreshSVG = createSVG('0 0 24 24', [
      { points: '23 4 23 10 17 10' },
      { d: 'M20.49 15a9 9 0 1 1-2.12-9.36L23 10' }
    ]);

    const printsText = document.createElement('span');
    printsText.textContent = 'Prints Available';

    printsMarker.appendChild(refreshSVG);
    printsMarker.appendChild(printsText);

    // Create color notice
    const colorNotice = document.createElement('div');
    colorNotice.className = 'artwork-color-notice';

    const infoSVG = createSVG('0 0 24 24', [
      { tag: 'circle', cx: '12', cy: '12', r: '10' },
      { tag: 'line', x1: '12', y1: '8', x2: '12', y2: '12' },
      { tag: 'line', x1: '12', y1: '16', x2: '12.01', y2: '16' }
    ]);

    const noticeText = document.createElement('span');
    noticeText.textContent = 'Please note that colours vary slightly on different screens';

    colorNotice.appendChild(infoSVG);
    colorNotice.appendChild(noticeText);

    // Create try before you buy message
    const tryBeforeBuy = document.createElement('div');
    tryBeforeBuy.className = 'artwork-try-before-buy';

    const tryTitle = document.createElement('div');
    tryTitle.className = 'artwork-try-before-buy__title';
    tryTitle.textContent = 'TRY BEFORE YOU BUY!';

    const tryText = document.createElement('div');
    tryText.className = 'artwork-try-before-buy__text';
    tryText.textContent = 'Email me to see a mock up of this painting on your wall';

    tryBeforeBuy.appendChild(tryTitle);
    tryBeforeBuy.appendChild(tryText);

    // Create inquiry button
    const inquiryButton = document.createElement('button');
    inquiryButton.className = 'artwork-inquiry-button';

    const messageSVG = createSVG('0 0 24 24', [
      { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }
    ]);

    const buttonText = document.createElement('span');
    buttonText.textContent = 'Inquiry Details';

    inquiryButton.appendChild(messageSVG);
    inquiryButton.appendChild(buttonText);

    // Append elements to caption
    if (lightboxDescription && lightboxDescription.parentNode === lightboxCaption) {
      lightboxDescription.insertAdjacentElement('afterend', printsMarker);
      printsMarker.insertAdjacentElement('afterend', colorNotice);
      colorNotice.insertAdjacentElement('afterend', tryBeforeBuy);
      tryBeforeBuy.insertAdjacentElement('afterend', inquiryButton);
    }

    // Update prints availability when lightbox opens
    const updatePrintsAvailability = () => {
      if (currentArtworkElement && currentArtworkElement.dataset.printsAvailable === 'true') {
        printsMarker.style.display = 'inline-flex';
      } else {
        printsMarker.style.display = 'none';
      }
    };

    // Observer for lightbox visibility changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'aria-hidden') {
          const isHidden = lightbox.getAttribute('aria-hidden') === 'true';
          if (!isHidden) {
            updatePrintsAvailability();
          }
        }
      });
    });

    observer.observe(lightbox, { attributes: true });

    // Also update on trigger clicks
    artworkTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        setTimeout(updatePrintsAvailability, 100);
      });
    });

    // Handle inquiry button click
    inquiryButton.addEventListener('click', () => {
      const artworkTitle = lightboxTitle?.textContent?.trim() || 'Artwork';
      const collection = lightboxCollection?.textContent?.trim() || '';

      // Validate that we have meaningful data
      if (!artworkTitle || artworkTitle === 'Artwork') {
        console.warn('No valid artwork title found for inquiry');
      }

      // Prepare inquiry data with validation
      const inquiryData = {
        artworks: [{
          title: artworkTitle,
          collection: collection,
          price: ''
        }],
        timestamp: Date.now()
      };

      // Store inquiry data using safe localStorage write
      const writeSuccess = storage.setItem(STORAGE_KEYS.PENDING_INQUIRY, inquiryData);

      if (!writeSuccess) {
        console.warn('Failed to store inquiry data, continuing to contact page anyway');
      }

      // Navigate to contact page (even if storage failed, user can still contact)
      window.location.href = 'contact.html';
    });
  };

  // ========================================
  // DISABLE STATS COUNTER ANIMATION
  // ========================================

  const disableStatsAnimation = () => {
    const statItems = document.querySelectorAll('[data-stat-item]');
    statItems.forEach(item => {
      item.classList.add('is-visible');
      const numberEl = item.querySelector('[data-stat-number]');
      if (numberEl) {
        const targetValue = numberEl.getAttribute('data-stat-number');
        const text = numberEl.textContent;
        const hasPlus = text.includes('+');
        const hasPercent = text.includes('%');
        const suffix = hasPlus ? '+' : hasPercent ? '%' : '';
        numberEl.textContent = targetValue + suffix;
      }
    });
  };

  // ========================================
  // ENHANCED CONTACT FORM WITH SUBJECT PRE-FILL
  // ========================================

  const enhanceContactForm = () => {
    if (!window.location.pathname.includes('contact')) return;

    const messageField = document.querySelector('[name="message"]') || document.getElementById('contact-message');
    const subjectField = document.querySelector('[name="subject"]') || document.getElementById('contact-subject');

    if (!messageField || !subjectField) return;

    // Use safe localStorage read
    const inquiryData = storage.getItem(STORAGE_KEYS.PENDING_INQUIRY);
    if (!inquiryData) return;

    // Validate inquiry data structure
    if (!inquiryData.artworks || !Array.isArray(inquiryData.artworks) || !inquiryData.timestamp) {
      console.warn('Invalid inquiry data structure:', inquiryData);
      try {
        localStorage.removeItem('pendingInquiry');
      } catch (e) {
        // Ignore cleanup errors
      }
      return;
    }

    const { artworks, timestamp } = inquiryData;

    // Check if data is stale (older than 1 hour)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - timestamp > oneHour) {
      try {
        localStorage.removeItem('pendingInquiry');
      } catch (e) {
        // Ignore cleanup errors
      }
      return;
    }

    // Validate artwork data
    const artwork = artworks[0];
    if (!artwork || !artwork.title) {
      console.warn('No valid artwork data in inquiry');
      return;
    }

    try {
      // Pre-fill subject field
      if (subjectField.tagName === 'SELECT') {
        const purchaseOption = Array.from(subjectField.options).find(
          opt => opt.value === 'purchase' || opt.textContent.toLowerCase().includes('purchase')
        );
        if (purchaseOption) {
          subjectField.value = purchaseOption.value;
        }
      } else {
        subjectField.value = `Inquiry about ${artwork.title}`;
      }

      // Pre-fill message field
      messageField.value = `Hello, I'm interested in ${artwork.title}`;

      // Scroll to and focus message field
      setTimeout(() => {
        messageField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageField.focus();
      }, 300);

      // Clean up localStorage after successful pre-fill
      try {
        localStorage.removeItem('pendingInquiry');
      } catch (e) {
        // Ignore cleanup errors
      }
    } catch (error) {
      console.error('Error pre-filling inquiry:', error);
      // Clean up on error
      try {
        localStorage.removeItem('pendingInquiry');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  };

  // ========================================
  // PRINTS AVAILABILITY MARKER
  // ========================================

  const addPrintsAvailability = () => {
    const artworkCards = document.querySelectorAll('.artwork-card');

    artworkCards.forEach(card => {
      const printsAvailable = card.dataset.printsAvailable === 'true';

      if (printsAvailable) {
        const printsMarker = document.createElement('div');
        printsMarker.className = 'artwork-prints-available';

        const refreshSVG = createSVG('0 0 24 24', [
          { points: '23 4 23 10 17 10' },
          { d: 'M20.49 15a9 9 0 1 1-2.12-9.36L23 10' }
        ]);

        const markerText = document.createElement('span');
        markerText.textContent = 'Prints Available';

        printsMarker.appendChild(refreshSVG);
        printsMarker.appendChild(markerText);

        const content = card.querySelector('.artwork-card__content');
        if (content) {
          content.appendChild(printsMarker);
        }
      }
    });
  };

  // ========================================
  // INITIALIZATION
  // ========================================

  const init = () => {
    try {
      // initEnhancedLightbox(); // REMOVED: Lightbox removed in preparation for new modal system
      disableStatsAnimation();
      enhanceContactForm();
      addPrintsAvailability();
    } catch (error) {
      console.error('Artist Feedback: Initialization error', error);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      init();
    }
  });
})();
