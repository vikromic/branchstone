/**
 * Infinite Scroll Gallery Component (Mobile Only)
 * iOS/TikTok-style vertical scrolling experience for mobile
 * @module components/InfiniteGallery
 */

import { $, createElement } from '../utils/dom.js';
import { sanitizeText, sanitizeURL } from '../utils/sanitize.js';
import CONFIG from '../config.js';

export class InfiniteGallery {
  /**
   * @param {Object} options - Gallery options
   * @param {string} options.containerSelector - Gallery container selector
   * @param {Array} options.artworks - Array of artwork data
   */
  constructor(options = {}) {
    this.container = $(options.containerSelector);
    this.artworks = options.artworks || [];

    if (!this.container) {
      return;
    }

    this.state = {
      currentIndex: 0,
      detailsOpen: false,
      overlayVisible: true,
      preloadedImages: new Set(),
      // Zoom state
      zoomed: false,
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      lastPanX: 0,
      lastPanY: 0,
      lastTapTime: 0,
      lastTapItem: null,
      lastTapX: 0,
      lastTapY: 0,
      lastTouchX: 0,
      lastTouchY: 0,
      touchMoved: false,
      pendingSingleTap: false,
      isPanning: false,
      isPinching: false,
      initialPinchDistance: 0,
      initialZoomLevel: 1,
      currentZoomedItem: null,
      currentZoomedImg: null,
    };

    // Zoom configuration
    this.zoomConfig = {
      minZoom: 1,
      maxZoom: 4,
      doubleTapDelay: 300,
    };

    this.init();
  }

  /**
   * Initialize infinite scroll gallery
   * @private
   */
  init() {
    // Create infinite scroll container
    this.createInfiniteContainer();

    // Render all artworks
    this.render();

    // Setup event listeners
    this.attachEventListeners();

    // Preload adjacent images
    this.preloadAdjacentImages();

    // Setup intersection observer for tracking
    this.setupIntersectionObserver();
  }

  /**
   * Create infinite scroll container structure
   * @private
   */
  createInfiniteContainer() {
    // Mark container as infinite scroll mode FIRST
    this.container.classList.add('infinite-scroll-mode');

    // Measure actual header height and set CSS variable
    const header = document.querySelector('header');
    if (header) {
      const headerHeight = header.offsetHeight;
      this.container.style.setProperty('--header-height', `${headerHeight}px`);
    }

    // Hide existing content (gallery header, filter, grid)
    const existingContent = this.container.querySelectorAll(
      '.gallery-header, .gallery-filter, .gallery-grid',
    );
    existingContent.forEach((el) => {
      el.style.display = 'none';
    });

    // Create infinite scroll container
    this.infiniteContainer = createElement('div', {
      className: 'gallery-infinite',
      role: 'region',
      'aria-label': 'Artwork gallery',
    });

    // Create details modal
    this.detailsModal = this.createDetailsModal();

    // Create backdrop
    this.backdrop = createElement('div', {
      className: 'gallery-infinite-backdrop',
    });

    // Add to DOM
    this.container.appendChild(this.infiniteContainer);
    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.detailsModal);
  }

  /**
   * Create details modal structure
   * @private
   * @returns {Element} Details modal element
   */
  createDetailsModal() {
    const modal = createElement('div', {
      className: 'gallery-infinite-details',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'infinite-details-title',
    });

    modal.innerHTML = `
      <h2 id="infinite-details-title" class="gallery-infinite-details-title"></h2>
      <p class="gallery-infinite-details-meta"></p>
      <p class="gallery-infinite-details-description"></p>
      <p class="gallery-infinite-details-price"></p>
      <div class="gallery-infinite-details-actions">
        <button class="gallery-infinite-btn gallery-infinite-btn-primary" data-action="inquire">
          Purchase Inquiry
        </button>
        <button class="gallery-infinite-btn gallery-infinite-btn-secondary" data-action="close">
          Close
        </button>
      </div>
    `;

    return modal;
  }

  /**
   * Render all artworks as infinite scroll items
   * @private
   */
  render() {
    const fragment = document.createDocumentFragment();

    this.artworks.forEach((artwork, index) => {
      const item = this.createInfiniteItem(artwork, index);
      fragment.appendChild(item);
    });

    this.infiniteContainer.appendChild(fragment);
  }

  /**
   * Create infinite scroll item
   * @private
   * @param {Object} artwork - Artwork data
   * @param {number} index - Item index
   * @returns {Element} Infinite scroll item element
   */
  createInfiniteItem(artwork, index) {
    // Sanitize data
    const safeTitle = sanitizeText(artwork.title || '');
    const safeSize = sanitizeText(artwork.size || '');
    const safeMaterials = sanitizeText(artwork.materials || '');
    const safeDescription = sanitizeText(artwork.description || '');
    const safePrice = sanitizeText(artwork.price || '');
    const safeImages = artwork.images
      ? artwork.images.map((img) => sanitizeURL(img || ''))
      : [sanitizeURL(artwork.image || '')];

    const item = createElement('div', {
      className: 'gallery-infinite-item',
      dataset: {
        index: index.toString(),
        title: safeTitle,
        size: safeSize,
        materials: safeMaterials,
        description: safeDescription,
        price: safePrice,
        available: artwork.available?.toString() || 'true',
        soldOut: artwork.soldOut?.toString() || 'false',
      },
    });

    // Create image container (with slider if multiple images)
    const imageContainer = this.createImageContainer(safeImages, safeTitle);
    item.appendChild(imageContainer);

    // Add zoom indicator
    const zoomIndicator = createElement('div', {
      className: 'gallery-infinite-zoom-indicator',
      dataset: { defaultText: 'Double-tap to zoom' },
    });
    zoomIndicator.textContent = 'Double-tap to zoom';
    item.appendChild(zoomIndicator);

    // Add sold indicator if needed
    if (artwork.soldOut) {
      const soldBadge = createElement('div', {
        className: 'gallery-infinite-sold',
      });
      soldBadge.textContent = 'Sold';
      item.appendChild(soldBadge);
    }

    // Create overlay with minimal info
    const overlay = this.createOverlay(safeTitle, safePrice);
    item.appendChild(overlay);

    return item;
  }

  /**
   * Create image container (single or slider)
   * @private
   * @param {Array<string>} images - Array of image URLs
   * @param {string} altText - Alt text for images
   * @returns {Element} Image container element
   */
  createImageContainer(images, altText) {
    if (images.length === 1) {
      // Single image - simple container
      const container = createElement('div', {
        className: 'gallery-infinite-item-image',
      });

      const img = createElement('img', {
        src: images[0],
        alt: altText,
        loading: 'lazy',
        decoding: 'async',
      });

      container.appendChild(img);
      return container;
    }

    // Multiple images - horizontal slider
    const slider = createElement('div', {
      className: 'gallery-infinite-slider',
    });

    images.forEach((imageSrc, imgIndex) => {
      const slideItem = createElement('div', {
        className: 'gallery-infinite-slider-item',
      });

      const img = createElement('img', {
        src: imageSrc,
        alt: `${altText} - view ${imgIndex + 1}`,
        loading: 'lazy',
        decoding: 'async',
      });

      slideItem.appendChild(img);
      slider.appendChild(slideItem);
    });

    // Add dots indicator
    if (images.length > 1) {
      const dots = this.createDotsIndicator(images.length);
      const container = createElement('div', {
        className: 'gallery-infinite-item-image',
        style: 'position: relative;',
      });
      container.appendChild(slider);
      container.appendChild(dots);

      // Setup slider scroll listener
      this.setupSliderListener(slider, dots);

      return container;
    }

    return slider;
  }

  /**
   * Create dots indicator for slider
   * @private
   * @param {number} count - Number of dots
   * @returns {Element} Dots container element
   */
  createDotsIndicator(count) {
    const dotsContainer = createElement('div', {
      className: 'gallery-infinite-dots',
      'aria-hidden': 'true',
    });

    for (let i = 0; i < count; i++) {
      const dot = createElement('div', {
        className: `gallery-infinite-dot ${i === 0 ? 'active' : ''}`,
        dataset: { index: i.toString() },
      });
      dotsContainer.appendChild(dot);
    }

    return dotsContainer;
  }

  /**
   * Setup horizontal slider scroll listener
   * @private
   * @param {Element} slider - Slider element
   * @param {Element} dotsContainer - Dots container element
   */
  setupSliderListener(slider, dotsContainer) {
    let scrollTimeout;

    slider.addEventListener(
      'scroll',
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const index = Math.round(slider.scrollLeft / slider.offsetWidth);
          const dots = dotsContainer.querySelectorAll('.gallery-infinite-dot');

          dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
          });
        }, 100);
      },
      { passive: true },
    );
  }

  /**
   * Create overlay with minimal info
   * @private
   * @param {string} title - Artwork title
   * @param {string} price - Artwork price
   * @returns {Element} Overlay element
   */
  createOverlay(title, price) {
    const overlay = createElement('div', {
      className: 'gallery-infinite-overlay',
    });

    const overlayTitle = createElement('h3', {
      className: 'gallery-infinite-overlay-title',
    });
    overlayTitle.textContent = title;

    const meta = createElement('div', {
      className: 'gallery-infinite-overlay-meta',
    });

    if (price) {
      const priceSpan = createElement('span', {
        className: 'gallery-infinite-overlay-price',
      });
      priceSpan.textContent = price;
      meta.appendChild(priceSpan);

      const separator = createElement('span', {
        style: 'opacity: 0.5;',
      });
      separator.textContent = ' • ';
      meta.appendChild(separator);
    }

    const action = createElement('span', {
      className: 'gallery-infinite-overlay-action',
    });
    action.textContent = 'Tap for details';
    meta.appendChild(action);

    overlay.appendChild(overlayTitle);
    overlay.appendChild(meta);

    return overlay;
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    // Track touch for double-tap and pan/pinch
    this.infiniteContainer.addEventListener(
      'touchstart',
      (e) => {
        const item = e.target.closest('.gallery-infinite-item');
        if (!item) {
          return;
        }

        // Store touch info for double-tap detection
        const touch = e.touches[0];
        const now = Date.now();
        const timeSinceLastTap = now - this.state.lastTapTime;

        // Check if this could be a double-tap (same area, within delay)
        if (
          timeSinceLastTap < this.zoomConfig.doubleTapDelay &&
          e.touches.length === 1 &&
          this.state.lastTapItem === item
        ) {
          // Double-tap detected - prevent default to stop zoom
          e.preventDefault();
          e.stopPropagation();
          this.toggleZoom(item, {
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
          this.state.lastTapTime = 0;
          this.state.lastTapItem = null;
          this.state.pendingSingleTap = false;
          return;
        }

        // Store for potential double-tap
        this.state.lastTapTime = now;
        this.state.lastTapItem = item;
        this.state.lastTapX = touch.clientX;
        this.state.lastTapY = touch.clientY;
        this.state.touchMoved = false;
        this.state.lastTouchX = touch.clientX;
        this.state.lastTouchY = touch.clientY;

        // Handle pan/pinch start if zoomed
        this.handleTouchStart(e);
      },
      { passive: false },
    );

    // Touch move for panning when zoomed or detecting significant movement
    this.infiniteContainer.addEventListener(
      'touchmove',
      (e) => {
        // Only mark as moved if it's a significant vertical gesture (not slider swipe)
        const touch = e.touches[0];
        const deltaY = Math.abs(touch.clientY - this.state.lastTouchY);

        // Mark as moved only for vertical swipes (>10px) or when zoomed and panning
        // Horizontal swipes (slider navigation) should NOT invalidate double-tap
        if (deltaY > 10 || this.state.zoomed) {
          this.state.touchMoved = true;
        }

        if (this.state.zoomed) {
          this.handlePan(e);
        }
      },
      { passive: false },
    );

    // Touch end - handle single tap for details
    this.infiniteContainer.addEventListener('touchend', (e) => {
      this.handleTouchEnd();

      // If touch moved significantly (vertical scroll or pan when zoomed),
      // invalidate the tap for double-tap detection
      // Note: Horizontal slider swipes are NOT counted as "moved" (see touchmove logic)
      if (this.state.touchMoved) {
        this.state.lastTapTime = 0;
        this.state.lastTapItem = null;
        this.state.touchMoved = false;
        return;
      }

      // If touch didn't move much and not zoomed, schedule single tap action
      if (!this.state.zoomed && this.state.lastTapItem) {
        const item = this.state.lastTapItem;

        // Wait to see if it's a double-tap
        this.state.pendingSingleTap = true;
        setTimeout(() => {
          if (this.state.pendingSingleTap && !this.state.zoomed) {
            // Single tap confirmed - show details
            const isSliderTap = e.target.closest('.gallery-infinite-slider');
            if (!isSliderTap) {
              this.showDetails(item);
            }
          }
          this.state.pendingSingleTap = false;
        }, this.zoomConfig.doubleTapDelay + 50);
      }
    });

    // Fallback click handler for non-touch devices
    this.infiniteContainer.addEventListener('click', (e) => {
      // Only handle if not a touch device (no recent touch)
      if (Date.now() - this.state.lastTapTime < 500) {
        return;
      }

      const item = e.target.closest('.gallery-infinite-item');
      if (!item || this.state.zoomed) {
        return;
      }

      const isSliderTap = e.target.closest('.gallery-infinite-slider');
      if (!isSliderTap) {
        this.showDetails(item);
      }
    });

    // Details modal actions
    this.detailsModal.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'close') {
        this.hideDetails();
      } else if (action === 'inquire') {
        this.handleInquiry();
      }
    });

    // Backdrop click to close
    this.backdrop.addEventListener('click', () => {
      this.hideDetails();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (this.state.detailsOpen && e.key === 'Escape') {
        this.hideDetails();
      }
      // Escape also exits zoom
      if (this.state.zoomed && e.key === 'Escape') {
        this.resetZoom();
      }
    });
  }

  /**
   * Toggle zoom on double-tap
   * @private
   * @param {Element} item - Gallery item element
   * @param {Event} e - Click/touch event
   */
  toggleZoom(item, e) {
    if (this.state.zoomed) {
      this.resetZoom();
    } else {
      this.zoomIn(item, e);
    }
  }

  /**
   * Zoom in on image
   * @private
   * @param {Element} item - Gallery item element
   * @param {Event} e - Click/touch event
   */
  zoomIn(item, e) {
    // Get the currently visible image (handles sliders with multiple images)
    const slider = item.querySelector('.gallery-infinite-slider');
    let img;

    if (slider) {
      // Find the currently scrolled-to slide
      const scrollLeft = slider.scrollLeft;
      const slideWidth = slider.offsetWidth;
      const currentSlideIndex = Math.round(scrollLeft / slideWidth);
      const slides = slider.querySelectorAll('.gallery-infinite-slider-item');
      const currentSlide = slides[currentSlideIndex];
      img = currentSlide?.querySelector('img');
    } else {
      // Single image artwork - query directly
      img = item.querySelector('.gallery-infinite-item-image img') || item.querySelector('img');
    }

    if (!img) {
      return;
    }

    // Get tap/click position
    const rect = img.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2;
    const clientY = e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2;

    // Apply zoom
    this.state.zoomLevel = 2.5;
    this.state.zoomed = true;
    this.state.currentZoomedItem = item;
    this.state.currentZoomedImg = img;

    // Calculate pan to center on tap point
    const imgRect = img.getBoundingClientRect();
    const tapX = clientX - imgRect.left;
    const tapY = clientY - imgRect.top;

    // Calculate offset to center the tap point
    const centerX = imgRect.width / 2;
    const centerY = imgRect.height / 2;
    this.state.panX = (centerX - tapX) * (this.state.zoomLevel - 1);
    this.state.panY = (centerY - tapY) * (this.state.zoomLevel - 1);

    // Clamp pan to bounds
    this.clampPan(img);

    this.applyTransform(img);
    item.classList.add('zoomed');

    // Show zoom indicator
    const indicator = item.querySelector('.gallery-infinite-zoom-indicator');
    if (indicator) {
      indicator.textContent = 'Drag to pan • Double-tap to exit';
      indicator.classList.add('visible');
      setTimeout(() => indicator.classList.remove('visible'), 2000);
    }

    // Disable vertical scrolling when zoomed
    this.infiniteContainer.style.overflowY = 'hidden';
  }

  /**
   * Apply transform to image
   * @private
   * @param {Element} img - Image element
   */
  applyTransform(img) {
    const { zoomLevel, panX, panY } = this.state;
    img.style.transform = `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`;
  }

  /**
   * Clamp pan values to keep image in bounds
   * @private
   * @param {Element} img - Image element
   */
  clampPan(img) {
    const rect = img.getBoundingClientRect();
    const scale = this.state.zoomLevel;

    // Calculate max pan based on how much the image extends beyond viewport
    const maxPanX = Math.max(0, (rect.width * scale - rect.width) / 2);
    const maxPanY = Math.max(0, (rect.height * scale - rect.height) / 2);

    this.state.panX = Math.max(-maxPanX, Math.min(maxPanX, this.state.panX));
    this.state.panY = Math.max(-maxPanY, Math.min(maxPanY, this.state.panY));
  }

  /**
   * Reset zoom to normal
   * @private
   */
  resetZoom() {
    if (!this.state.currentZoomedItem) {
      return;
    }

    const item = this.state.currentZoomedItem;

    // Reset ALL images in the item (handles sliders with multiple images)
    const imgs = item.querySelectorAll('img');
    imgs.forEach((img) => {
      img.style.transform = '';
    });

    item.classList.remove('zoomed');
    this.state.zoomed = false;
    this.state.zoomLevel = 1;
    this.state.currentZoomedItem = null;
    this.state.currentZoomedImg = null;
    this.state.panX = 0;
    this.state.panY = 0;
    this.state.lastPanX = 0;
    this.state.lastPanY = 0;

    // Reset zoom indicator text
    const indicator = item.querySelector('.gallery-infinite-zoom-indicator');
    if (indicator) {
      const defaultText = indicator.dataset.defaultText || 'Double-tap to zoom';
      indicator.textContent = defaultText;
    }

    // Re-enable vertical scrolling
    this.infiniteContainer.style.overflowY = '';
  }

  /**
   * Handle touch start for pan tracking
   * @private
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    if (!this.state.zoomed) {
return;
}

    if (e.touches.length === 1) {
      this.state.isPanning = true;
      this.state.lastTouchX = e.touches[0].clientX;
      this.state.lastTouchY = e.touches[0].clientY;
      this.state.lastPanX = this.state.panX;
      this.state.lastPanY = this.state.panY;
    } else if (e.touches.length === 2) {
      // Pinch gesture start
      this.state.isPinching = true;
      this.state.initialPinchDistance = this.getPinchDistance(e);
      this.state.initialZoomLevel = this.state.zoomLevel;
    }
  }

  /**
   * Handle pan gesture when zoomed
   * @private
   * @param {TouchEvent} e - Touch event
   */
  handlePan(e) {
    if (!this.state.zoomed || !this.state.currentZoomedImg) {
return;
}

    e.preventDefault();

    if (e.touches.length === 2 && this.state.isPinching) {
      // Pinch to zoom
      const distance = this.getPinchDistance(e);
      const scale = distance / this.state.initialPinchDistance;
      this.state.zoomLevel = Math.max(
        this.zoomConfig.minZoom,
        Math.min(this.zoomConfig.maxZoom, this.state.initialZoomLevel * scale),
      );

      // If zoomed out to 1x, exit zoom mode
      if (this.state.zoomLevel <= 1.1) {
        this.resetZoom();
        return;
      }

      this.clampPan(this.state.currentZoomedImg);
      this.applyTransform(this.state.currentZoomedImg);
    } else if (e.touches.length === 1 && this.state.isPanning) {
      // Single finger pan
      const deltaX = e.touches[0].clientX - this.state.lastTouchX;
      const deltaY = e.touches[0].clientY - this.state.lastTouchY;

      this.state.panX = this.state.lastPanX + deltaX;
      this.state.panY = this.state.lastPanY + deltaY;

      this.clampPan(this.state.currentZoomedImg);
      this.applyTransform(this.state.currentZoomedImg);
    }
  }

  /**
   * Get distance between two touch points
   * @private
   * @param {TouchEvent} e - Touch event
   * @returns {number} Distance in pixels
   */
  getPinchDistance(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Handle touch end
   * @private
   */
  handleTouchEnd() {
    this.state.isPanning = false;
    this.state.isPinching = false;
  }

  /**
   * Setup intersection observer to track current item
   * @private
   */
  setupIntersectionObserver() {
    const options = {
      root: this.infiniteContainer,
      threshold: 0.5, // When 50% visible
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const item = entry.target;
          const index = parseInt(item.dataset.index, 10);
          this.state.currentIndex = index;

          // Reset zoom when scrolling to new item
          if (this.state.zoomed && this.state.currentZoomedItem !== item) {
            this.resetZoom();
          }

          // Preload adjacent images when user scrolls to new item
          this.preloadAdjacentImages();
        }
      });
    }, options);

    // Observe all items
    const items = this.infiniteContainer.querySelectorAll('.gallery-infinite-item');
    items.forEach((item) => this.observer.observe(item));
  }

  /**
   * Preload adjacent images for smooth scrolling
   * @private
   */
  preloadAdjacentImages() {
    const currentIndex = this.state.currentIndex;
    const indices = [
      currentIndex - 1,
      currentIndex,
      currentIndex + 1,
      currentIndex + 2, // Preload 2 ahead for smoother experience
    ];

    indices.forEach((index) => {
      if (index >= 0 && index < this.artworks.length) {
        const artwork = this.artworks[index];
        const images = artwork.images || [artwork.image];

        images.forEach((imageSrc) => {
          const safeURL = sanitizeURL(imageSrc || '');
          if (safeURL && !this.state.preloadedImages.has(safeURL)) {
            this.state.preloadedImages.add(safeURL);
            const img = new Image();
            img.src = safeURL;
          }
        });
      }
    });
  }

  /**
   * Show details modal
   * @private
   * @param {Element} item - Infinite scroll item element
   */
  showDetails(item) {
    const { title, size, materials, description, price } = item.dataset;

    // Populate modal
    const titleEl = this.detailsModal.querySelector('.gallery-infinite-details-title');
    const metaEl = this.detailsModal.querySelector('.gallery-infinite-details-meta');
    const descEl = this.detailsModal.querySelector('.gallery-infinite-details-description');
    const priceEl = this.detailsModal.querySelector('.gallery-infinite-details-price');

    if (titleEl) {
      titleEl.textContent = title;
    }

    if (metaEl) {
      metaEl.textContent = `${size} • ${materials}`;
    }

    if (descEl) {
      descEl.textContent = description;
    }

    if (priceEl) {
      priceEl.textContent = price || 'Price on Request';
    }

    // Show modal
    this.detailsModal.classList.add('visible');
    this.backdrop.classList.add('visible');
    this.state.detailsOpen = true;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Focus management
    setTimeout(() => {
      const closeBtn = this.detailsModal.querySelector('[data-action="close"]');
      if (closeBtn) {
        closeBtn.focus();
      }
    }, 100);
  }

  /**
   * Hide details modal
   * @private
   */
  hideDetails() {
    this.detailsModal.classList.remove('visible');
    this.backdrop.classList.remove('visible');
    this.state.detailsOpen = false;

    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Handle inquiry button click
   * @private
   */
  handleInquiry() {
    const titleEl = this.detailsModal.querySelector('.gallery-infinite-details-title');
    const metaEl = this.detailsModal.querySelector('.gallery-infinite-details-meta');

    const title = titleEl?.textContent || 'this artwork';
    const size = metaEl?.textContent.split(' • ')[0] || '';

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
   * Cleanup
   */
  destroy() {
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
    }

    // Remove from DOM
    if (this.infiniteContainer) {
      this.infiniteContainer.remove();
    }

    if (this.detailsModal) {
      this.detailsModal.remove();
    }

    if (this.backdrop) {
      this.backdrop.remove();
    }

    // Restore container state
    this.container.classList.remove('infinite-scroll-mode');
  }
}

export default InfiniteGallery;
