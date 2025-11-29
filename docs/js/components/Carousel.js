/**
 * Carousel Component
 * Continuous looping carousel with autoplay
 * Supports single-item and multi-item display modes
 * @module components/Carousel
 */

import { $, $$, on, setAttributes, announceToScreenReader } from '../utils/dom.js';
import CONFIG from '../config.js';

export class Carousel {
  /**
   * @param {Object} options - Carousel options
   * @param {string} options.containerSelector - Container selector
   * @param {string} options.itemSelector - Item selector
   * @param {number} options.autoplayDelay - Autoplay delay in ms
   * @param {boolean} options.loop - Enable looping
   * @param {boolean} options.pauseOnHover - Pause on hover
   * @param {number} options.itemsPerView - Items to show per view (default: 1)
   * @param {number} options.itemsPerRow - Items per row for layout (default: itemsPerView)
   */
  constructor(options = {}) {
    this.container = $(options.containerSelector);
    this.itemSelector = options.itemSelector || '.carousel-item';
    this.autoplayDelay = options.autoplayDelay || CONFIG.ui.carousel.autoplayDelay;
    this.loop = options.loop !== undefined ? options.loop : CONFIG.ui.carousel.loop;
    this.pauseOnHover = options.pauseOnHover !== undefined
      ? options.pauseOnHover
      : CONFIG.ui.carousel.pauseOnHover;

    // Multi-item carousel support
    this.itemsPerView = options.itemsPerView || 1;
    this.itemsPerRow = options.itemsPerRow || this.itemsPerView;

    if (!this.container) return;

    this.items = $$(this.itemSelector, this.container);
    this.originalItems = [...this.items];
    this.currentIndex = 0;
    this.autoplayTimer = null;
    this.isPlaying = true;
    this.isTransitioning = false;
    this.slideGap = 0;

    this.init();
  }

  /**
   * Initialize carousel
   * @private
   */
  init() {
    if (this.items.length === 0) return;

    // For multi-item carousels, setup infinite cloning
    if (this.itemsPerView > 1 && this.loop) {
      this.setupInfiniteClone();
    }

    this.setupItems();
    this.setupControls();
    this.attachEventListeners();
    this.startAutoplay();
  }

  /**
   * Setup infinite clone for multi-item carousels
   * @private
   */
  setupInfiniteClone() {
    const track = this.container.querySelector('.carousel-track');
    if (!track) return;

    // Get the number of items to clone (at least itemsPerView)
    const cloneCount = Math.max(this.itemsPerView, 3);

    // Clone items from the start and add to end
    for (let i = 0; i < cloneCount && i < this.originalItems.length; i++) {
      const clone = this.originalItems[i].cloneNode(true);
      clone.classList.add('carousel-clone');
      clone.removeAttribute('id'); // Remove id to avoid duplicates
      track.appendChild(clone);
    }

    // Clone items from the end and add to start
    for (let i = Math.max(0, this.originalItems.length - cloneCount); i < this.originalItems.length; i++) {
      const clone = this.originalItems[i].cloneNode(true);
      clone.classList.add('carousel-clone');
      clone.removeAttribute('id');
      track.insertBefore(clone, track.firstChild);
    }

    // Refresh items list to include clones
    this.items = $$(this.itemSelector, this.container);

    // Get slide gap from CSS for positioning
    const computedStyle = window.getComputedStyle(track);
    const gap = computedStyle.gap || computedStyle.columnGap || '0px';
    this.slideGap = parseFloat(gap);

    // Position carousel to show original first item
    this.currentIndex = cloneCount;
    this.updateTrackPosition(true);
  }

  /**
   * Setup carousel items
   * @private
   */
  setupItems() {
    // For single-item carousel, use active class
    if (this.itemsPerView === 1) {
      this.items.forEach((item, index) => {
        item.classList.toggle('active', index === 0);
        setAttributes(item, {
          'aria-hidden': index !== 0 ? 'true' : 'false',
        });
      });
    }
  }

  /**
   * Setup navigation controls
   * @private
   */
  setupControls() {
    const controls = this.container.querySelector('.carousel-controls');
    if (!controls) return;

    this.prevBtn = controls.querySelector('.carousel-prev');
    this.nextBtn = controls.querySelector('.carousel-next');

    if (this.prevBtn) {
      on(this.prevBtn, 'click', () => {
        this.stopAutoplay();
        this.previous();
        this.startAutoplay();
      });
    }

    if (this.nextBtn) {
      on(this.nextBtn, 'click', () => {
        this.stopAutoplay();
        this.next();
        this.startAutoplay();
      });
    }

    // Setup indicators (only for single-item carousels)
    if (this.itemsPerView === 1) {
      this.setupIndicators();
    }
  }

  /**
   * Setup indicators
   * @private
   */
  setupIndicators() {
    const indicatorsContainer = this.container.querySelector('.carousel-indicators');
    if (!indicatorsContainer) return;

    indicatorsContainer.innerHTML = '';

    this.items.forEach((_, index) => {
      const indicator = document.createElement('button');
      indicator.className = 'carousel-indicator';
      indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
      indicator.classList.toggle('active', index === 0);

      on(indicator, 'click', () => {
        this.stopAutoplay();
        this.goTo(index);
        this.startAutoplay();
      });

      indicatorsContainer.appendChild(indicator);
    });
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    if (this.pauseOnHover) {
      on(this.container, 'mouseenter', () => this.stopAutoplay());
      on(this.container, 'mouseleave', () => this.startAutoplay());
    }

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    on(this.container, 'touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
      }
    }, { passive: true });

    on(this.container, 'touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchEndX = e.changedTouches[0].clientX;
        this.handleSwipe(touchStartX, touchEndX);
      }
    }, { passive: true });
  }

  /**
   * Handle swipe gesture
   * @private
   * @param {number} startX - Start X position
   * @param {number} endX - End X position
   */
  handleSwipe(startX, endX) {
    const diff = startX - endX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      this.stopAutoplay();
      if (diff > 0) {
        this.next();
      } else {
        this.previous();
      }
      this.startAutoplay();
    }
  }

  /**
   * Update track position with optional animation
   * @private
   * @param {boolean} instant - Skip animation
   */
  updateTrackPosition(instant = false) {
    const track = this.container.querySelector('.carousel-track');
    if (!track) return;

    // For multi-item carousel, calculate translation based on item width
    if (this.itemsPerView > 1) {
      // Get first item width (all items should have same width)
      const firstItem = this.items[0];
      const itemWidth = firstItem.getBoundingClientRect().width;
      const totalGap = this.slideGap * this.currentIndex;
      const translation = -(this.currentIndex * itemWidth + totalGap);

      // Temporarily disable transition for instant repositioning
      if (instant) {
        track.style.transition = 'none';
      } else {
        track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      }

      track.style.transform = `translateX(${translation}px)`;

      // Trigger reflow to apply instant transition
      if (instant) {
        void track.offsetHeight;
        track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      }
    }
  }

  /**
   * Go to specific slide
   * @param {number} index - Slide index
   */
  goTo(index) {
    // For single-item carousel
    if (this.itemsPerView === 1) {
      if (index === this.currentIndex) return;

      const prevIndex = this.currentIndex;
      this.currentIndex = index;

      // Update items
      this.items[prevIndex].classList.remove('active');
      this.items[this.currentIndex].classList.add('active');

      setAttributes(this.items[prevIndex], { 'aria-hidden': 'true' });
      setAttributes(this.items[this.currentIndex], { 'aria-hidden': 'false' });

      // Update indicators
      this.updateIndicators();

      // Announce to screen readers
      this.announceSlide();
    } else {
      // For multi-item carousel
      this.currentIndex = index;
      this.updateTrackPosition();
    }
  }

  /**
   * Go to next slide
   */
  next() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (this.itemsPerView > 1) {
      // For multi-item carousel, advance by itemsPerRow
      let nextIndex = this.currentIndex + this.itemsPerRow;

      // Check for infinite clone boundary
      const cloneCount = Math.max(this.itemsPerView, 3);
      const originalCount = this.originalItems.length;
      const totalWithClones = originalCount + 2 * cloneCount;

      if (nextIndex >= originalCount + cloneCount) {
        // We've reached the cloned section at the end, jump back to original
        this.updateTrackPosition();
        setTimeout(() => {
          const jumpIndex = cloneCount + (nextIndex - (originalCount + cloneCount));
          this.currentIndex = jumpIndex;
          this.updateTrackPosition(true);
          this.isTransitioning = false;
        }, 600); // Match transition duration
      } else {
        this.currentIndex = nextIndex;
        this.updateTrackPosition();
        setTimeout(() => {
          this.isTransitioning = false;
        }, 600);
      }
    } else {
      // For single-item carousel
      let nextIndex = this.currentIndex + 1;
      if (nextIndex >= this.items.length) {
        nextIndex = this.loop ? 0 : this.items.length - 1;
      }
      this.goTo(nextIndex);
      this.isTransitioning = false;
    }
  }

  /**
   * Go to previous slide
   */
  previous() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (this.itemsPerView > 1) {
      // For multi-item carousel, go back by itemsPerRow
      let prevIndex = this.currentIndex - this.itemsPerRow;
      const cloneCount = Math.max(this.itemsPerView, 3);

      if (prevIndex < cloneCount) {
        // We've reached the cloned section at the start, jump to end
        this.updateTrackPosition();
        setTimeout(() => {
          const originalCount = this.originalItems.length;
          const jumpIndex = originalCount + cloneCount - (cloneCount - prevIndex) - this.itemsPerRow;
          this.currentIndex = jumpIndex;
          this.updateTrackPosition(true);
          this.isTransitioning = false;
        }, 600); // Match transition duration
      } else {
        this.currentIndex = prevIndex;
        this.updateTrackPosition();
        setTimeout(() => {
          this.isTransitioning = false;
        }, 600);
      }
    } else {
      // For single-item carousel
      let prevIndex = this.currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = this.loop ? this.items.length - 1 : 0;
      }
      this.goTo(prevIndex);
      this.isTransitioning = false;
    }
  }

  /**
   * Start autoplay
   */
  startAutoplay() {
    if (!this.loop || !this.isPlaying) return;

    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      // Only autoplay if not currently transitioning
      if (!this.isTransitioning) {
        this.next();
      }
    }, this.autoplayDelay);
  }

  /**
   * Stop autoplay
   */
  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  /**
   * Pause carousel
   */
  pause() {
    this.isPlaying = false;
    this.stopAutoplay();
  }

  /**
   * Play carousel
   */
  play() {
    this.isPlaying = true;
    this.startAutoplay();
  }

  /**
   * Update indicators
   * @private
   */
  updateIndicators() {
    const indicators = this.container.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentIndex);
    });
  }

  /**
   * Announce slide to screen readers
   * @private
   */
  announceSlide() {
    announceToScreenReader(`Slide ${this.currentIndex + 1} of ${this.items.length}`);
  }

  /**
   * Destroy carousel and cleanup
   */
  destroy() {
    this.stopAutoplay();
  }

  /**
   * Recalculate carousel dimensions (useful for responsive behavior)
   * Call this on window resize or layout changes
   */
  recalculate() {
    if (this.itemsPerView > 1) {
      // Recalculate and update position after layout changes
      setTimeout(() => {
        this.updateTrackPosition(true);
      }, 100);
    }
  }
}

export default Carousel;
