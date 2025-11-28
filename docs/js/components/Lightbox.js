/**
 * Lightbox Component
 * Image gallery lightbox with zoom, swipe, and accessibility features
 * @module components/Lightbox
 */

import { $, $$, on, setAttributes, getFocusableElements, announceToScreenReader } from '../utils/dom.js';
import CONFIG from '../config.js';

export class Lightbox {
  /**
   * @param {Object} options - Lightbox options
   * @param {string} options.lightboxSelector - Lightbox container selector
   * @param {string} options.triggerSelector - Elements that open lightbox
   */
  constructor(options = {}) {
    this.lightbox = $(options.lightboxSelector || '#lightbox');
    this.triggerSelector = options.triggerSelector || '.gallery-item';

    if (!this.lightbox) return;

    this.elements = this.cacheElements();
    this.state = this.getInitialState();
    this.handlers = new Map();

    this.init();
  }

  /**
   * Cache DOM elements
   * @private
   * @returns {Object} Cached elements
   */
  cacheElements() {
    return {
      image: $('#lightbox-img', this.lightbox),
      title: $('#lightbox-title', this.lightbox),
      size: $('#lightbox-size', this.lightbox),
      materials: $('#lightbox-materials', this.lightbox),
      description: $('#lightbox-description', this.lightbox),
      price: $('#lightbox-price', this.lightbox),
      availability: $('#lightbox-availability', this.lightbox),
      closeBtn: $('.close-lightbox', this.lightbox),
      prevBtn: $('#prev-btn', this.lightbox),
      nextBtn: $('#next-btn', this.lightbox),
      indicator: $('#slider-indicator', this.lightbox),
      inquireBtn: $('.inquire-btn', this.lightbox),
    };
  }

  /**
   * Get initial state
   * @private
   * @returns {Object} Initial state
   */
  getInitialState() {
    return {
      images: [],
      currentIndex: 0,
      isOpen: false,
      previousFocus: null,
      // Touch state
      touchStartX: 0,
      touchEndX: 0,
      // Zoom state
      scale: 1,
      lastScale: 1,
      translateX: 0,
      translateY: 0,
      lastTranslateX: 0,
      lastTranslateY: 0,
      lastTap: 0,
    };
  }

  /**
   * Initialize lightbox
   * @private
   */
  init() {
    this.setInitialAttributes();
    this.attachEventListeners();
  }

  /**
   * Set initial ARIA attributes
   * @private
   */
  setInitialAttributes() {
    setAttributes(this.lightbox, { 'aria-hidden': 'true' });
  }

  /**
   * Attach all event listeners
   * @private
   */
  attachEventListeners() {
    // Attach to gallery items
    this.attachToTriggers();

    // Close handlers
    if (this.elements.closeBtn) {
      on(this.elements.closeBtn, 'click', () => this.close());
    }

    on(this.lightbox, 'click', (e) => {
      if (e.target === this.lightbox) this.close();
    });

    // Navigation
    if (this.elements.prevBtn) {
      on(this.elements.prevBtn, 'click', (e) => {
        e.stopPropagation();
        this.showPrevious();
      });
    }

    if (this.elements.nextBtn) {
      on(this.elements.nextBtn, 'click', (e) => {
        e.stopPropagation();
        this.showNext();
      });
    }

    // Keyboard navigation
    on(document, 'keydown', (e) => this.handleKeyboard(e));

    // Touch events for swipe and pinch-zoom
    if (this.elements.image) {
      this.attachTouchEvents();
    }

    // Inquire button
    if (this.elements.inquireBtn) {
      on(this.elements.inquireBtn, 'click', () => this.handleInquiry());
    }
  }

  /**
   * Attach lightbox to trigger elements
   * @private
   */
  attachToTriggers() {
    const triggers = $$(this.triggerSelector);
    triggers.forEach(trigger => {
      on(trigger, 'click', () => this.openFromTrigger(trigger));
    });
  }

  /**
   * Attach touch events for swipe and zoom
   * @private
   */
  attachTouchEvents() {
    const img = this.elements.image;

    on(img, 'touchstart', (e) => this.handleTouchStart(e), { passive: false });
    on(img, 'touchmove', (e) => this.handleTouchMove(e), { passive: false });
    on(img, 'touchend', (e) => this.handleTouchEnd(e), { passive: false });
    on(img, 'click', (e) => this.handleDoubleTap(e));

    img.style.touchAction = 'none';
    img.style.userSelect = 'none';
  }

  /**
   * Open lightbox from trigger element
   * @param {Element} trigger - Trigger element
   */
  openFromTrigger(trigger) {
    this.state.previousFocus = document.activeElement;

    // Get images from data attributes with safe JSON parsing
    const imagesJson = trigger.dataset.images;
    if (imagesJson) {
      try {
        this.state.images = JSON.parse(imagesJson);
      } catch {
        this.state.images = [trigger.dataset.img];
      }
    } else {
      this.state.images = [trigger.dataset.img];
    }
    this.state.currentIndex = 0;

    // Set content
    this.setContent({
      title: trigger.dataset.title,
      size: trigger.dataset.size,
      materials: trigger.dataset.materials,
      description: trigger.dataset.description,
      price: trigger.dataset.price,
      available: trigger.dataset.available,
    });

    this.open();
  }

  /**
   * Set lightbox content
   * @private
   * @param {Object} data - Content data
   */
  setContent(data) {
    if (this.elements.title) {
      this.elements.title.textContent = data.title || '';
    }

    if (this.elements.size) {
      const sizeLabel = window.getTranslation?.('lightbox.size') || 'Size:';
      this.elements.size.textContent = `${sizeLabel} ${data.size || ''}`;
    }

    if (this.elements.materials) {
      const materialsLabel = window.getTranslation?.('lightbox.materials') || 'Materials:';
      this.elements.materials.textContent = `${materialsLabel} ${data.materials || ''}`;
    }

    if (this.elements.description) {
      this.elements.description.textContent = data.description || '';
    }

    // Handle price display
    if (this.elements.price) {
      if (data.price) {
        this.elements.price.textContent = data.price;
      } else {
        const priceOnRequestLabel = window.getTranslation?.('lightbox.priceOnRequest') || 'Price on Request';
        this.elements.price.textContent = priceOnRequestLabel;
      }
    }

    // Handle availability display (sold items)
    if (this.elements.availability) {
      const isAvailable = data.available === 'true' || data.available === true;
      this.elements.availability.classList.toggle('hidden', isAvailable);
    }
  }

  /**
   * Open lightbox
   */
  open() {
    this.state.isOpen = true;
    this.lightbox.style.display = 'flex';
    setAttributes(this.lightbox, { 'aria-hidden': 'false' });

    this.updateSlider();
    this.enableFocusTrap();

    // Focus close button
    setTimeout(() => {
      if (this.elements.closeBtn) this.elements.closeBtn.focus();
    }, 100);
  }

  /**
   * Close lightbox
   */
  close() {
    this.state.isOpen = false;
    this.lightbox.style.display = 'none';
    setAttributes(this.lightbox, { 'aria-hidden': 'true' });

    this.state.images = [];
    this.state.currentIndex = 0;
    this.resetZoom();
    this.disableFocusTrap();

    // Restore focus
    if (this.state.previousFocus) {
      this.state.previousFocus.focus();
      this.state.previousFocus = null;
    }
  }

  /**
   * Show next image
   */
  showNext() {
    if (this.state.images.length > 0) {
      this.state.currentIndex = (this.state.currentIndex + 1) % this.state.images.length;
      this.updateSlider();
    }
  }

  /**
   * Show previous image
   */
  showPrevious() {
    if (this.state.images.length > 0) {
      this.state.currentIndex =
        (this.state.currentIndex - 1 + this.state.images.length) % this.state.images.length;
      this.updateSlider();
    }
  }

  /**
   * Update slider display
   * @private
   */
  updateSlider() {
    if (this.state.images.length === 0) return;

    // Update image with responsive srcset if available
    if (this.elements.image) {
      const currentImage = this.state.images[this.state.currentIndex];
      this.elements.image.src = currentImage;
      this.elements.image.alt = this.elements.title?.textContent || '';

      // TODO: Add srcset support for lightbox images
      // When multiple sizes are generated, update artworks.json to include srcset arrays
      // Example: { image: "img/art.jpg", srcset: ["img/art-800.jpg 800w", "img/art-1200.jpg 1200w", "img/art-1920.jpg 1920w"] }
      // For now, lightbox displays full-size images for optimal quality
    }

    // Update navigation buttons
    const hasMultiple = this.state.images.length > 1;
    if (this.elements.prevBtn) {
      this.elements.prevBtn.style.display = hasMultiple ? 'flex' : 'none';
    }
    if (this.elements.nextBtn) {
      this.elements.nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    }

    // Update indicator
    if (this.elements.indicator) {
      if (hasMultiple) {
        this.elements.indicator.textContent =
          `${this.state.currentIndex + 1} / ${this.state.images.length}`;
        this.elements.indicator.style.display = 'block';
        setAttributes(this.elements.indicator, {
          role: 'status',
          'aria-live': 'polite',
        });
      } else {
        this.elements.indicator.style.display = 'none';
      }
    }

    // Announce to screen readers
    const announcement = `Image ${this.state.currentIndex + 1} of ${this.state.images.length}: ${this.elements.title?.textContent || ''}`;
    announceToScreenReader(announcement);
  }

  /**
   * Handle keyboard navigation
   * @private
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyboard(e) {
    if (!this.state.isOpen) return;

    switch (e.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.showPrevious();
        break;
      case 'ArrowRight':
        this.showNext();
        break;
    }
  }

  /**
   * Handle touch start
   * @private
   */
  handleTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      this.state.lastScale = this.state.scale;
      this.initialDist = null;
    } else if (e.touches.length === 1) {
      this.state.touchStartX = e.touches[0].clientX;
    }
  }

  /**
   * Handle touch move
   * @private
   */
  handleTouchMove(e) {
    if (!e.touches || e.touches.length === 0) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

      if (!this.initialDist) {
        this.initialDist = dist;
      } else {
        this.state.scale = Math.max(
          CONFIG.ui.lightbox.zoomMin,
          Math.min(CONFIG.ui.lightbox.zoomMax, this.state.lastScale * (dist / this.initialDist))
        );
        this.applyZoom();
      }
    } else if (e.touches.length === 1 && this.state.scale > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.state.touchStartX;
      this.state.translateX = this.state.lastTranslateX + deltaX / this.state.scale;
      this.applyZoom();
    }
  }

  /**
   * Handle touch end
   * @private
   */
  handleTouchEnd(e) {
    if (!e.touches) return;

    if (e.touches.length === 0) {
      this.initialDist = null;
      this.state.lastTranslateX = this.state.translateX;
      this.state.lastTranslateY = this.state.translateY;

      // Reset if zoomed out too much
      if (this.state.scale < 1.1) {
        this.resetZoom();
      }
    }

    // Handle swipe (only if not zoomed)
    if (e.changedTouches && e.changedTouches.length > 0 && this.state.scale === 1) {
      this.state.touchEndX = e.changedTouches[0].clientX;
      this.handleSwipe();
    }
  }

  /**
   * Handle swipe gesture
   * @private
   */
  handleSwipe() {
    const diff = this.state.touchStartX - this.state.touchEndX;
    if (Math.abs(diff) > CONFIG.ui.lightbox.swipeThreshold) {
      if (diff > 0) {
        this.showNext();
      } else {
        this.showPrevious();
      }
    }
  }

  /**
   * Handle double tap to zoom
   * @private
   */
  handleDoubleTap(e) {
    const currentTime = Date.now();
    const tapLength = currentTime - this.state.lastTap;

    if (tapLength < CONFIG.ui.lightbox.doubleTapDelay && tapLength > 0) {
      e.preventDefault();
      if (this.state.scale === 1) {
        this.state.scale = 2;
        const rect = this.elements.image.getBoundingClientRect();
        const x = e.clientX || e.touches?.[0]?.clientX;
        const y = e.clientY || e.touches?.[0]?.clientY;
        this.state.translateX = (rect.width / 2 - (x - rect.left)) / 2;
        this.state.translateY = (rect.height / 2 - (y - rect.top)) / 2;
      } else {
        this.resetZoom();
      }
      this.applyZoom();
    }
    this.state.lastTap = currentTime;
  }

  /**
   * Apply zoom transformation
   * @private
   */
  applyZoom() {
    if (!this.elements.image) return;
    this.elements.image.style.transform =
      `scale(${this.state.scale}) translate(${this.state.translateX}px, ${this.state.translateY}px)`;
    this.elements.image.style.transition = this.state.scale === 1 ? 'transform 0.3s ease' : 'none';
  }

  /**
   * Reset zoom to default
   * @private
   */
  resetZoom() {
    this.state.scale = 1;
    this.state.lastScale = 1;
    this.state.translateX = 0;
    this.state.translateY = 0;
    this.state.lastTranslateX = 0;
    this.state.lastTranslateY = 0;
    this.applyZoom();
  }

  /**
   * Handle inquiry button click
   * @private
   */
  handleInquiry() {
    const title = this.elements.title?.textContent || 'this artwork';
    const size = this.elements.size?.textContent.replace('Size: ', '') || '';
    const message = `I'm interested in "${title}" (${size}). Please provide more information about availability and pricing.`;

    // Store in localStorage for contact page
    try {
      localStorage.setItem(CONFIG.storage.inquiryMessage, message);
      window.location.href = 'contact.html';
    } catch (e) {
      console.warn('Could not store inquiry message:', e);
      window.location.href = 'contact.html';
    }
  }

  /**
   * Enable focus trap
   * @private
   */
  enableFocusTrap() {
    const focusableElements = getFocusableElements(this.lightbox);
    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    this.focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    this.handlers.set('focusTrap', on(document, 'keydown', this.focusTrapHandler));
  }

  /**
   * Disable focus trap
   * @private
   */
  disableFocusTrap() {
    const cleanup = this.handlers.get('focusTrap');
    if (cleanup) {
      cleanup();
      this.handlers.delete('focusTrap');
    }
  }

  /**
   * Refresh trigger attachments (call after dynamically adding gallery items)
   */
  refresh() {
    this.attachToTriggers();
  }
}

export default Lightbox;
