/**
 * Lightbox Component
 * Image gallery lightbox with zoom, swipe, and accessibility features
 * @module components/Lightbox
 */

import {
  $,
  on,
  setAttributes,
  getFocusableElements,
  announceToScreenReader,
} from '../utils/dom.js';
import { sanitizeText, sanitizeURL, sanitizeJSON } from '../utils/sanitize.js';
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

    if (!this.lightbox) {
      return;
    }

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
      prints: $('#lightbox-prints', this.lightbox),
      closeBtn: $('.close-lightbox', this.lightbox),
      backBtn: $('#back-to-gallery', this.lightbox),
      prevBtn: $('#prev-btn', this.lightbox),
      nextBtn: $('#next-btn', this.lightbox),
      indicator: $('#slider-indicator', this.lightbox),
      inquireBtn: $('.inquire-btn', this.lightbox),
      zoomIndicator: null, // Created dynamically
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
      touchStartTime: 0,
      // Momentum tracking
      velocityX: 0,
      lastMoveX: 0,
      lastMoveTime: 0,
      // Zoom state
      scale: 1,
      lastScale: 1,
      translateX: 0,
      translateY: 0,
      lastTranslateX: 0,
      lastTranslateY: 0,
      lastTap: 0,
      // Zoom indicator state
      zoomIndicatorTimeout: null,
      // First-time user hints
      hasShownGestureHint: false,
      // Image loading state
      isLoading: false,
      // Image transition state
      isTransitioning: false,
    };
  }

  /**
   * Initialize lightbox
   * @private
   */
  init() {
    this.setInitialAttributes();
    this.createZoomIndicator();
    this.createLoadingIndicator();
    this.createGestureHint();
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
   * Create zoom indicator element
   * @private
   */
  createZoomIndicator() {
    const container = $('.lightbox-image-container', this.lightbox);
    if (!container) {
      return;
    }

    const indicator = document.createElement('div');
    indicator.className = 'zoom-indicator';
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-live', 'polite');
    indicator.innerHTML = `
      <div class="zoom-level"></div>
      <div class="zoom-hint"></div>
    `;
    container.appendChild(indicator);

    this.elements.zoomIndicator = indicator;
    this.elements.zoomLevel = indicator.querySelector('.zoom-level');
    this.elements.zoomHint = indicator.querySelector('.zoom-hint');
  }

  /**
   * Create loading indicator element
   * @private
   */
  createLoadingIndicator() {
    const container = $('.lightbox-image-container', this.lightbox);
    if (!container) {
      return;
    }

    const loader = document.createElement('div');
    loader.className = 'lightbox-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Loading image');
    loader.innerHTML = `
      <div class="loader-spinner"></div>
    `;
    container.appendChild(loader);

    this.elements.loader = loader;
  }

  /**
   * Create gesture hint overlay for first-time users
   * @private
   */
  createGestureHint() {
    const container = $('.lightbox-image-container', this.lightbox);
    if (!container) {
      return;
    }

    const hint = document.createElement('div');
    hint.className = 'gesture-hint';
    hint.setAttribute('role', 'tooltip');
    hint.innerHTML = `
      <div class="gesture-hint-content">
        <div class="gesture-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          <span>Swipe to navigate</span>
        </div>
        <div class="gesture-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
          </svg>
          <span>Pinch to zoom</span>
        </div>
      </div>
    `;
    container.appendChild(hint);

    this.elements.gestureHint = hint;
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

    // Back to Gallery button (desktop full-screen view)
    if (this.elements.backBtn) {
      on(this.elements.backBtn, 'click', () => this.close());
    }

    on(this.lightbox, 'click', (e) => {
      if (e.target === this.lightbox) {
        this.close();
      }
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
   * Attach lightbox via event delegation on gallery container
   * Single listener instead of per-item (better memory, works with dynamic content)
   * @private
   */
  attachToTriggers() {
    const galleryContainer = $('.gallery-grid');
    if (!galleryContainer) {
      return;
    }

    // Use event delegation - single listener handles all gallery items
    on(galleryContainer, 'click', (e) => {
      const trigger = e.target.closest(this.triggerSelector);
      if (trigger) {
        this.openFromTrigger(trigger);
      }
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

    // Get images from data attributes with safe JSON parsing and sanitization
    const imagesJson = trigger.dataset.images;
    if (imagesJson) {
      const parsed = sanitizeJSON(imagesJson, null);
      if (parsed && Array.isArray(parsed)) {
        // Sanitize URLs in the images array
        this.state.images = parsed.map((item) => {
          if (typeof item === 'string') {
            return sanitizeURL(item);
          } else if (item && typeof item === 'object') {
            // Handle video objects
            return {
              ...item,
              webm: item.webm ? sanitizeURL(item.webm) : '',
              mp4: item.mp4 ? sanitizeURL(item.mp4) : '',
              poster: item.poster ? sanitizeURL(item.poster) : '',
            };
          }
          return item;
        });
      } else {
        this.state.images = [sanitizeURL(trigger.dataset.img || '')];
      }
    } else {
      this.state.images = [sanitizeURL(trigger.dataset.img || '')];
    }
    this.state.currentIndex = 0;

    // Set content with sanitized data
    this.setContent({
      title: sanitizeText(trigger.dataset.title || ''),
      size: sanitizeText(trigger.dataset.size || ''),
      materials: sanitizeText(trigger.dataset.materials || ''),
      description: sanitizeText(trigger.dataset.description || ''),
      price: sanitizeText(trigger.dataset.price || ''),
      available: trigger.dataset.available,
      soldOut: trigger.dataset.soldout,
      printsAvailable: trigger.dataset.printsavailable,
    });

    this.open();
  }

  /**
   * Get artwork key from title for translations
   * @private
   * @param {string} title - Artwork title
   * @returns {string} Key for translations
   */
  getArtworkKey(title) {
    if (!title) {
      return null;
    }
    // Convert title to snake_case key: "Born of Burn" -> "born_of_burn"
    return title.toLowerCase().replace(/\s+/g, '_');
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
      // Try to get translated description
      const artworkKey = this.getArtworkKey(data.title);
      const translatedDesc = artworkKey ? window.getTranslation?.(`artworks.${artworkKey}`) : null;
      this.elements.description.textContent = translatedDesc || data.description || '';
    }

    // Handle price display
    if (this.elements.price) {
      if (data.price) {
        this.elements.price.textContent = data.price;
        this.elements.price.classList.remove('hidden');
      } else {
        const priceOnRequestLabel =
          window.getTranslation?.('lightbox.priceOnRequest') || 'Price on Request';
        this.elements.price.textContent = priceOnRequestLabel;
        this.elements.price.classList.remove('hidden');
      }
    }

    // Handle availability display (sold items)
    if (this.elements.availability) {
      const isSoldOut = data.soldOut === 'true' || data.soldOut === true;
      this.elements.availability.classList.toggle('hidden', !isSoldOut);
    }

    // Handle prints availability display
    if (this.elements.prints) {
      const printsAvailable = data.printsAvailable === 'true' || data.printsAvailable === true;
      this.elements.prints.classList.toggle('hidden', !printsAvailable);
    }
  }

  /**
   * Check if viewport is desktop size
   * @private
   * @returns {boolean} True if desktop viewport
   */
  isDesktop() {
    return window.matchMedia('(min-width: 769px)').matches;
  }

  /**
   * Open lightbox with choreographed animation
   */
  open() {
    this.state.isOpen = true;
    this.lightbox.style.display = 'flex';
    setAttributes(this.lightbox, { 'aria-hidden': 'false' });

    // Apply animation classes only on mobile (desktop uses instant full-screen)
    this.lightbox.classList.remove('is-closing');
    if (!this.isDesktop()) {
      this.lightbox.classList.add('is-open');
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = this.getScrollbarWidth() + 'px';

    this.updateSlider();
    this.enableFocusTrap();

    // Show gesture hint for first-time users (mobile only)
    this.showGestureHintIfNeeded();

    // Focus appropriate button based on viewport
    setTimeout(() => {
      const focusTarget = this.isDesktop() ? this.elements.backBtn : this.elements.closeBtn;
      if (focusTarget) {
        focusTarget.focus();
      }
    }, 150);
  }

  /**
   * Get scrollbar width to prevent layout shift
   * @private
   * @returns {number} Scrollbar width in pixels
   */
  getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  /**
   * Show gesture hint for first-time mobile users
   * @private
   */
  showGestureHintIfNeeded() {
    // Only show on touch devices, only once per session, only if multiple images
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasMultipleImages = this.state.images.length > 1;

    if (
      isTouchDevice &&
      hasMultipleImages &&
      !this.state.hasShownGestureHint &&
      this.elements.gestureHint
    ) {
      this.state.hasShownGestureHint = true;

      // Show hint
      this.elements.gestureHint.classList.add('visible');

      // Auto-hide after 3 seconds
      setTimeout(() => {
        if (this.elements.gestureHint) {
          this.elements.gestureHint.classList.remove('visible');
        }
      }, 3000);
    }
  }

  /**
   * Close lightbox with smooth animation
   */
  close() {
    // Prevent double-close
    if (!this.state.isOpen) {
      return;
    }

    this.state.isOpen = false;
    setAttributes(this.lightbox, { 'aria-hidden': 'true' });

    const isDesktop = this.isDesktop();

    // Apply closing animation only on mobile
    this.lightbox.classList.remove('is-open');
    if (!isDesktop) {
      this.lightbox.classList.add('is-closing');
    }

    // Desktop: instant close. Mobile: wait for animation
    const animationDuration = isDesktop ? 0 : 300;

    setTimeout(() => {
      this.lightbox.style.display = 'none';
      this.lightbox.classList.remove('is-closing');

      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      this.state.images = [];
      this.state.currentIndex = 0;
      this.state.isLoading = false;
      this.resetZoom();
      this.disableFocusTrap();
      this.hideLoader();

      // Restore focus
      if (this.state.previousFocus) {
        this.state.previousFocus.focus();
        this.state.previousFocus = null;
      }
    }, animationDuration);
  }

  /**
   * Show loading indicator
   * @private
   */
  showLoader() {
    if (this.elements.loader) {
      this.elements.loader.classList.add('visible');
      this.state.isLoading = true;
    }
  }

  /**
   * Hide loading indicator
   * @private
   */
  hideLoader() {
    if (this.elements.loader) {
      this.elements.loader.classList.remove('visible');
      this.state.isLoading = false;
    }
  }

  /**
   * Show next image with cross-fade transition
   */
  showNext() {
    if (this.state.images.length > 0 && !this.state.isTransitioning) {
      this.transitionToImage((this.state.currentIndex + 1) % this.state.images.length);
    }
  }

  /**
   * Show previous image with cross-fade transition
   */
  showPrevious() {
    if (this.state.images.length > 0 && !this.state.isTransitioning) {
      this.transitionToImage(
        (this.state.currentIndex - 1 + this.state.images.length) % this.state.images.length,
      );
    }
  }

  /**
   * Transition to a specific image index with cross-fade
   * @private
   * @param {number} newIndex - Target image index
   */
  transitionToImage(newIndex) {
    if (newIndex === this.state.currentIndex) {
      return;
    }

    this.state.isTransitioning = true;

    // Fade out current image
    if (this.elements.image) {
      this.elements.image.classList.add('fading-out');
    }

    // After fade-out, switch image and fade in
    setTimeout(() => {
      this.state.currentIndex = newIndex;
      this.updateSlider();

      // Remove fade-out class after slider update
      setTimeout(() => {
        if (this.elements.image) {
          this.elements.image.classList.remove('fading-out');
        }
        this.state.isTransitioning = false;
      }, 50);
    }, 150); // Half of the transition duration
  }

  /**
   * Show image in lightbox
   * @private
   * @param {string} imageSrc - Image source URL
   * @param {Element} container - Container element
   */
  showImage(imageSrc, container) {
    // Remove any existing video
    const existingVideo = $('.lightbox-video', container);
    if (existingVideo) {
      existingVideo.remove();
    }

    // Show image element with sanitized URL
    if (this.elements.image) {
      this.elements.image.style.display = 'block';
      // URL is already sanitized in openFromTrigger, but double-check for safety
      const safeURL = sanitizeURL(imageSrc);
      if (safeURL) {
        // Check if image is already cached (complete and has natural size)
        const isCached = this.isImageCached(safeURL);

        if (isCached) {
          // Image is cached, show immediately
          this.elements.image.src = safeURL;
          this.elements.image.style.opacity = '1';
        } else {
          // Show loading state for uncached images
          this.showLoader();
          this.elements.image.style.opacity = '0.5';

          // Create new image to preload
          const preloadImg = new Image();
          preloadImg.onload = () => {
            if (this.elements.image) {
              this.elements.image.src = safeURL;
              this.elements.image.style.opacity = '1';
            }
            this.hideLoader();
          };
          preloadImg.onerror = () => {
            if (this.elements.image) {
              this.elements.image.src = safeURL;
              this.elements.image.style.opacity = '1';
            }
            this.hideLoader();
          };
          preloadImg.src = safeURL;
        }
      }
      this.elements.image.alt = this.elements.title?.textContent || '';
    }

    // Preload adjacent images for faster navigation
    this.preloadAdjacentImages();
  }

  /**
   * Check if an image is already cached in browser
   * @private
   * @param {string} src - Image source URL
   * @returns {boolean} True if image is cached
   */
  isImageCached(src) {
    const img = new Image();
    img.src = src;
    return img.complete && img.naturalWidth > 0;
  }

  /**
   * Preload next and previous images for faster navigation
   * @private
   */
  preloadAdjacentImages() {
    if (this.state.images.length <= 1) {
      return;
    }

    const nextIndex = (this.state.currentIndex + 1) % this.state.images.length;
    const prevIndex =
      (this.state.currentIndex - 1 + this.state.images.length) % this.state.images.length;

    [nextIndex, prevIndex].forEach((index) => {
      const media = this.state.images[index];
      // Only preload images, not videos
      if (typeof media === 'string') {
        const safeURL = sanitizeURL(media);
        if (safeURL) {
          const img = new Image();
          img.src = safeURL;
        }
      }
    });
  }

  /**
   * Show video in lightbox
   * @private
   * @param {Object} videoData - Video data object with webm/mp4 sources
   * @param {Element} container - Container element
   */
  showVideo(videoData, container) {
    // Hide image element
    if (this.elements.image) {
      this.elements.image.style.display = 'none';
    }

    // Remove any existing video
    const existingVideo = $('.lightbox-video', container);
    if (existingVideo) {
      existingVideo.remove();
    }

    // Create video element
    const video = document.createElement('video');
    video.className = 'lightbox-video';
    video.controls = true;
    video.autoplay = true;
    video.loop = true;
    video.muted = false; // Allow sound in lightbox (user clicked to view)
    video.playsInline = true;
    video.setAttribute('aria-label', `Video of ${this.elements.title?.textContent || 'artwork'}`);

    // Add poster if available (sanitized)
    if (videoData.poster) {
      const safePoster = sanitizeURL(videoData.poster);
      if (safePoster) {
        video.poster = safePoster;
      }
    }

    // Add sources (WebM first for better compression, MP4 as fallback)
    // URLs are already sanitized in openFromTrigger, but validate again
    if (videoData.webm) {
      const safeWebm = sanitizeURL(videoData.webm);
      if (safeWebm) {
        const webmSource = document.createElement('source');
        webmSource.src = safeWebm;
        webmSource.type = 'video/webm';
        video.appendChild(webmSource);
      }
    }

    if (videoData.mp4) {
      const safeMp4 = sanitizeURL(videoData.mp4);
      if (safeMp4) {
        const mp4Source = document.createElement('source');
        mp4Source.src = safeMp4;
        mp4Source.type = 'video/mp4';
        video.appendChild(mp4Source);
      }
    }

    // Fallback text
    video.textContent = 'Your browser does not support the video tag.';

    // Insert before zoom indicator
    const zoomIndicator = this.elements.zoomIndicator;
    if (zoomIndicator) {
      container.insertBefore(video, zoomIndicator);
    } else {
      container.appendChild(video);
    }
  }

  /**
   * Update slider display
   * @private
   */
  updateSlider() {
    if (this.state.images.length === 0) {
      return;
    }

    const container = $('.lightbox-image-container', this.lightbox);
    const currentMedia = this.state.images[this.state.currentIndex];

    // Check if current media is a video
    const isVideo = typeof currentMedia === 'object' && currentMedia.type === 'video';

    if (isVideo) {
      // Handle video display
      this.showVideo(currentMedia, container);
    } else {
      // Handle image display
      this.showImage(currentMedia, container);
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
        this.elements.indicator.textContent = `${this.state.currentIndex + 1} / ${this.state.images.length}`;
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
    if (!this.state.isOpen) {
      return;
    }

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
      case '+':
      case '=':
        e.preventDefault();
        this.zoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        this.zoomOut();
        break;
      case '0':
        e.preventDefault();
        this.resetZoom();
        break;
      case 'Home':
        e.preventDefault();
        this.goToFirst();
        break;
      case 'End':
        e.preventDefault();
        this.goToLast();
        break;
    }
  }

  /**
   * Zoom in by a step
   * @private
   */
  zoomIn() {
    const newScale = Math.min(CONFIG.ui.lightbox.zoomMax, this.state.scale + 0.5);
    if (newScale !== this.state.scale) {
      this.state.scale = newScale;
      this.applyZoom();
    }
  }

  /**
   * Zoom out by a step
   * @private
   */
  zoomOut() {
    const newScale = Math.max(CONFIG.ui.lightbox.zoomMin, this.state.scale - 0.5);
    if (newScale !== this.state.scale) {
      this.state.scale = newScale;
      if (this.state.scale < 1.1) {
        this.resetZoom();
      } else {
        this.applyZoom();
      }
    }
  }

  /**
   * Go to first image
   * @private
   */
  goToFirst() {
    if (this.state.images.length > 0 && this.state.currentIndex !== 0) {
      this.state.currentIndex = 0;
      this.updateSlider();
    }
  }

  /**
   * Go to last image
   * @private
   */
  goToLast() {
    const lastIndex = this.state.images.length - 1;
    if (this.state.images.length > 0 && this.state.currentIndex !== lastIndex) {
      this.state.currentIndex = lastIndex;
      this.updateSlider();
    }
  }

  /**
   * Handle touch start
   * @private
   */
  handleTouchStart(e) {
    if (!e.touches || e.touches.length === 0) {
      return;
    }

    if (e.touches.length === 2) {
      e.preventDefault();
      this.state.lastScale = this.state.scale;
      this.initialDist = null;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.state.touchStartX = touch.clientX;
      this.state.touchStartTime = Date.now();
      // Reset velocity tracking
      this.state.velocityX = 0;
      this.state.lastMoveX = touch.clientX;
      this.state.lastMoveTime = Date.now();
    }
  }

  /**
   * Handle touch move
   * @private
   */
  handleTouchMove(e) {
    if (!e.touches || e.touches.length === 0) {
      return;
    }

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
          Math.min(CONFIG.ui.lightbox.zoomMax, this.state.lastScale * (dist / this.initialDist)),
        );
        this.applyZoom();
      }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();

      // Track velocity for momentum physics
      const timeDelta = now - this.state.lastMoveTime;
      if (timeDelta > 0) {
        const moveDelta = touch.clientX - this.state.lastMoveX;
        // Exponential moving average for smooth velocity
        this.state.velocityX = 0.8 * (moveDelta / timeDelta) + 0.2 * this.state.velocityX;
      }
      this.state.lastMoveX = touch.clientX;
      this.state.lastMoveTime = now;

      // If zoomed, allow panning
      if (this.state.scale > 1) {
        e.preventDefault();
        const deltaX = touch.clientX - this.state.touchStartX;
        this.state.translateX = this.state.lastTranslateX + deltaX / this.state.scale;
        this.applyZoom();
      }
    }
  }

  /**
   * Handle touch end
   * @private
   */
  handleTouchEnd(e) {
    if (!e.touches) {
      return;
    }

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
   * Handle swipe gesture with momentum physics
   * Uses velocity tracking for natural, physics-based navigation
   * @private
   */
  handleSwipe() {
    const diff = this.state.touchStartX - this.state.touchEndX;
    const velocity = this.state.velocityX;
    const elapsedTime = Date.now() - this.state.touchStartTime;

    // Momentum threshold: pixels per millisecond
    // A quick flick (high velocity) triggers navigation even with small distance
    const VELOCITY_THRESHOLD = 0.3; // px/ms
    const DISTANCE_THRESHOLD = CONFIG.ui.lightbox.swipeThreshold;

    // Calculate if swipe should trigger navigation
    // Either: sufficient distance OR sufficient velocity (quick flick)
    const hasSufficientDistance = Math.abs(diff) > DISTANCE_THRESHOLD;
    const hasSufficientVelocity = Math.abs(velocity) > VELOCITY_THRESHOLD && elapsedTime < 300;

    if (hasSufficientDistance || hasSufficientVelocity) {
      // Direction determined by either distance or velocity
      const direction = hasSufficientVelocity ? -Math.sign(velocity) : Math.sign(diff);

      if (direction > 0) {
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
    if (!this.elements.image) {
      return;
    }
    this.elements.image.style.transform = `scale(${this.state.scale}) translate(${this.state.translateX}px, ${this.state.translateY}px)`;
    this.elements.image.style.transition = this.state.scale === 1 ? 'transform 0.3s ease' : 'none';

    // Visual feedback: dim navigation arrows when zoomed (swipe disabled)
    this.updateNavigationState();
    this.updateZoomIndicator();
  }

  /**
   * Update navigation buttons state based on zoom level
   * @private
   */
  updateNavigationState() {
    const isZoomed = this.state.scale > 1;

    if (this.elements.prevBtn) {
      this.elements.prevBtn.classList.toggle('disabled-by-zoom', isZoomed);
    }
    if (this.elements.nextBtn) {
      this.elements.nextBtn.classList.toggle('disabled-by-zoom', isZoomed);
    }
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
   * Update zoom indicator display
   * @private
   */
  updateZoomIndicator() {
    if (!this.elements.zoomIndicator || !this.elements.zoomLevel || !this.elements.zoomHint) {
      return;
    }

    const scale = this.state.scale;
    const isZoomed = scale > 1.05;

    if (isZoomed) {
      // Show zoom level
      this.elements.zoomLevel.textContent = `${scale.toFixed(1)}x`;

      // Show hint message
      const hintText =
        window.getTranslation?.('lightbox.doubleTapToReset') || 'Double-tap to reset';
      this.elements.zoomHint.textContent = hintText;

      // Show indicator
      this.elements.zoomIndicator.classList.add('visible');

      // Clear existing timeout
      if (this.state.zoomIndicatorTimeout) {
        clearTimeout(this.state.zoomIndicatorTimeout);
      }

      // Auto-hide after 2 seconds of no interaction
      this.state.zoomIndicatorTimeout = setTimeout(() => {
        if (this.elements.zoomIndicator) {
          this.elements.zoomIndicator.classList.remove('visible');
        }
      }, 2000);
    } else {
      // Hide indicator when not zoomed
      this.elements.zoomIndicator.classList.remove('visible');
      if (this.state.zoomIndicatorTimeout) {
        clearTimeout(this.state.zoomIndicatorTimeout);
        this.state.zoomIndicatorTimeout = null;
      }
    }
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
    if (focusableElements.length === 0) {
      return;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    this.focusTrapHandler = (e) => {
      if (e.key !== 'Tab') {
        return;
      }

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
   * Refresh trigger attachments
   * Note: With event delegation, this is no longer needed for dynamic content
   * Kept for backwards compatibility
   * @deprecated Event delegation handles dynamic content automatically
   */
  refresh() {
    // No-op - event delegation handles dynamic content
  }
}

export default Lightbox;
