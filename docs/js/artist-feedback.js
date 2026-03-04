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
      storage.removeItem(STORAGE_KEYS.PENDING_INQUIRY);
      return;
    }

    const { artworks, timestamp } = inquiryData;

    // Check if data is stale (older than 1 hour)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - timestamp > oneHour) {
      storage.removeItem(STORAGE_KEYS.PENDING_INQUIRY);
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
      storage.removeItem(STORAGE_KEYS.PENDING_INQUIRY);
    } catch (error) {
      console.error('Error pre-filling inquiry:', error);
      // Clean up on error
      storage.removeItem(STORAGE_KEYS.PENDING_INQUIRY);
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
