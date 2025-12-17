/**
 * LightboxManager - Image lightbox functionality
 * Handles image viewing, navigation, and keyboard/touch interactions
 */

import { prefersReducedMotion } from './utils.js';
import { isValidImageUrl } from './security.js';

export class LightboxManager {
  constructor() {
    this.galleryData = [];
    this.currentIndex = 0;
    this.lightbox = null;
    this.elements = {};
    this.touchStart = { x: 0, y: 0 };
    this.touchEnd = { x: 0, y: 0 };
  }

  /**
   * Initialize the lightbox with DOM elements and event listeners
   */
  init() {
    // Support both explicit triggers and artwork cards (for home page)
    const lightboxTriggers = document.querySelectorAll('[data-lightbox-trigger], .artwork-card');

    // Support both data attribute and class-based modal selectors
    this.lightbox = document.querySelector('[data-lightbox]') ||
                    document.querySelector('[data-lightbox-modal]') ||
                    document.querySelector('.modal-overlay');

    if (!this.lightbox || lightboxTriggers.length === 0) return;

    this._cacheElements();
    this._buildGalleryData(lightboxTriggers);
    this._setupTriggers(lightboxTriggers);
    this._attachEventListeners();
  }

  /**
   * Cache DOM element references
   * @private
   */
  _cacheElements() {
    this.elements = {
      image: this.lightbox.querySelector('[data-lightbox-image]') ||
             this.lightbox.querySelector('.lightbox__image'),
      title: this.lightbox.querySelector('[data-lightbox-title]') ||
             this.lightbox.querySelector('.lightbox__title'),
      collection: this.lightbox.querySelector('[data-lightbox-collection]') ||
                  this.lightbox.querySelector('.lightbox__collection'),
      description: this.lightbox.querySelector('[data-lightbox-description]') ||
                   this.lightbox.querySelector('.lightbox__description'),
      prevButton: this.lightbox.querySelector('[data-lightbox-prev]') ||
                  this.lightbox.querySelector('.lightbox__nav--prev'),
      nextButton: this.lightbox.querySelector('[data-lightbox-next]') ||
                  this.lightbox.querySelector('.lightbox__nav--next'),
      closeButton: this.lightbox.querySelector('[data-lightbox-close]') ||
                   this.lightbox.querySelector('.lightbox__close')
    };
  }

  /**
   * Build gallery data from artwork cards
   * @private
   * @param {NodeList} triggers - Lightbox trigger elements
   */
  _buildGalleryData(triggers) {
    this.galleryData = Array.from(triggers).map(trigger => {
      // Get image from within the card or from data attribute
      const img = trigger.querySelector('img') || trigger.querySelector('.artwork-card__image');
      const titleEl = trigger.querySelector('.artwork-card__title');
      const collectionEl = trigger.querySelector('.artwork-card__collection');

      return {
        src: trigger.getAttribute('data-lightbox-src') ||
             (img ? img.src : '') ||
             trigger.src,
        title: trigger.getAttribute('data-lightbox-title') ||
               (titleEl ? titleEl.textContent : '') ||
               (img ? img.alt : ''),
        collection: trigger.getAttribute('data-lightbox-collection') ||
                   (collectionEl ? collectionEl.textContent : ''),
        description: trigger.getAttribute('data-lightbox-description') || ''
      };
    });
  }

  /**
   * Setup click and keyboard handlers for lightbox triggers
   * @private
   * @param {NodeList} triggers - Lightbox trigger elements
   */
  _setupTriggers(triggers) {
    triggers.forEach((trigger, index) => {
      trigger.style.cursor = 'pointer';

      // Click handler
      trigger.addEventListener('click', (e) => {
        // Don't open lightbox if clicking interactive buttons
        if (e.target.closest('.artwork-card__favorite') ||
            e.target.closest('.artwork-card__inquire')) {
          e.stopPropagation();
          return;
        }

        e.preventDefault();
        this.open(index);
      });

      // Make keyboard accessible
      if (!trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-label', `View ${this.galleryData[index]?.title || 'artwork'}`);

      // Keyboard handler
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.open(index);
        }
      });
    });
  }

  /**
   * Attach event listeners for lightbox controls
   * @private
   */
  _attachEventListeners() {
    const { closeButton, prevButton, nextButton } = this.elements;

    // Close button
    closeButton?.addEventListener('click', () => this.close());

    // Close on backdrop click
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox || e.target.classList.contains('modal-overlay')) {
        this.close();
      }
    });

    // Navigation buttons
    prevButton?.addEventListener('click', () => this.navigate(-1));
    nextButton?.addEventListener('click', () => this.navigate(1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this._handleKeydown(e));

    // Touch/swipe support
    this._setupTouchHandlers();
  }

  /**
   * Handle keyboard navigation
   * @private
   * @param {KeyboardEvent} e - Keyboard event
   */
  _handleKeydown(e) {
    const isOpen = this.lightbox.classList.contains('is-open') ||
                   this.lightbox.classList.contains('is-active') ||
                   this.lightbox.getAttribute('aria-hidden') === 'false';

    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.navigate(-1);
        break;
      case 'ArrowRight':
        this.navigate(1);
        break;
    }
  }

  /**
   * Setup touch/swipe handlers for mobile
   * @private
   */
  _setupTouchHandlers() {
    this.lightbox.addEventListener('touchstart', (e) => {
      this.touchStart.x = e.changedTouches[0].screenX;
      this.touchStart.y = e.changedTouches[0].screenY;
    }, { passive: true });

    this.lightbox.addEventListener('touchend', (e) => {
      this.touchEnd.x = e.changedTouches[0].screenX;
      this.touchEnd.y = e.changedTouches[0].screenY;
      this._handleSwipe();
    }, { passive: true });
  }

  /**
   * Handle swipe gestures
   * @private
   */
  _handleSwipe() {
    const horizontalThreshold = 50;
    const verticalThreshold = 100;
    const deltaX = this.touchEnd.x - this.touchStart.x;
    const deltaY = this.touchEnd.y - this.touchStart.y;

    // Horizontal swipe (navigation)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > horizontalThreshold) {
      if (deltaX > 0) {
        this.navigate(-1); // Swipe right = previous
      } else {
        this.navigate(1);  // Swipe left = next
      }
    }
    // Vertical swipe down (close lightbox)
    else if (deltaY > verticalThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
      this.close();
    }
  }

  /**
   * Open lightbox at specified index
   * @param {number} index - Gallery item index
   */
  open(index) {
    this.currentIndex = index;
    this._updateContent();

    this.lightbox.classList.add('is-open');
    this.lightbox.classList.add('is-active');
    this.lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus close button
    setTimeout(() => this.elements.closeButton?.focus(), 100);
  }

  /**
   * Close lightbox
   */
  close() {
    this.lightbox.classList.remove('is-open');
    this.lightbox.classList.remove('is-active');
    this.lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Return focus to trigger
    const triggers = document.querySelectorAll('[data-lightbox-trigger], .artwork-card');
    const trigger = triggers[this.currentIndex];
    if (trigger) trigger.focus();
  }

  /**
   * Navigate to next/previous item
   * @param {number} direction - Navigation direction (-1 for previous, 1 for next)
   */
  navigate(direction) {
    const newIndex = this.currentIndex + direction;

    if (newIndex >= 0 && newIndex < this.galleryData.length) {
      this.currentIndex = newIndex;
      this._updateContent();
    }
  }

  /**
   * Update lightbox content with smooth crossfade
   * @private
   */
  _updateContent() {
    const data = this.galleryData[this.currentIndex];
    const { image, title, collection, description, prevButton, nextButton } = this.elements;

    // Update image with crossfade animation
    if (image) {
      const animationDuration = prefersReducedMotion() ? 0 : 300;

      image.style.transition = `opacity ${animationDuration}ms ease-out`;
      image.style.opacity = '0';

      setTimeout(() => {
        // Security: Validate URL before setting image source
        if (isValidImageUrl(data.src)) {
          image.src = data.src;
        } else {
          console.warn('Invalid image URL blocked:', data.src);
          image.src = ''; // Clear src for invalid URLs
        }
        image.alt = data.title || 'Artwork image';

        image.onload = () => {
          image.style.transition = `opacity ${animationDuration}ms ease-in`;
          image.style.opacity = '1';
        };
      }, animationDuration);
    }

    // Update text content
    if (title) title.textContent = data.title;
    if (collection) collection.textContent = data.collection;
    if (description) description.textContent = data.description;

    // Update button states
    if (prevButton) prevButton.disabled = this.currentIndex === 0;
    if (nextButton) nextButton.disabled = this.currentIndex === this.galleryData.length - 1;
  }
}
