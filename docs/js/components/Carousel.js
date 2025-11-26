/**
 * Carousel Component
 * Continuous looping carousel with autoplay
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
   */
  constructor(options = {}) {
    this.container = $(options.containerSelector);
    this.itemSelector = options.itemSelector || '.carousel-item';
    this.autoplayDelay = options.autoplayDelay || CONFIG.ui.carousel.autoplayDelay;
    this.loop = options.loop !== undefined ? options.loop : CONFIG.ui.carousel.loop;
    this.pauseOnHover = options.pauseOnHover !== undefined
      ? options.pauseOnHover
      : CONFIG.ui.carousel.pauseOnHover;

    if (!this.container) return;

    this.items = $$(this.itemSelector, this.container);
    this.currentIndex = 0;
    this.autoplayTimer = null;
    this.isPlaying = true;

    this.init();
  }

  /**
   * Initialize carousel
   * @private
   */
  init() {
    if (this.items.length === 0) return;

    this.setupItems();
    this.setupControls();
    this.attachEventListeners();
    this.startAutoplay();
  }

  /**
   * Setup carousel items
   * @private
   */
  setupItems() {
    this.items.forEach((item, index) => {
      item.classList.toggle('active', index === 0);
      setAttributes(item, {
        'aria-hidden': index !== 0 ? 'true' : 'false',
      });
    });
  }

  /**
   * Setup navigation controls
   * @private
   */
  setupControls() {
    const controls = this.container.querySelector('.carousel-controls');
    if (!controls) return;

    const prevBtn = controls.querySelector('.carousel-prev');
    const nextBtn = controls.querySelector('.carousel-next');

    if (prevBtn) {
      on(prevBtn, 'click', () => {
        this.stopAutoplay();
        this.previous();
        this.startAutoplay();
      });
    }

    if (nextBtn) {
      on(nextBtn, 'click', () => {
        this.stopAutoplay();
        this.next();
        this.startAutoplay();
      });
    }

    // Setup indicators
    this.setupIndicators();
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
   * Go to specific slide
   * @param {number} index - Slide index
   */
  goTo(index) {
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
  }

  /**
   * Go to next slide
   */
  next() {
    let nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.items.length) {
      nextIndex = this.loop ? 0 : this.items.length - 1;
    }
    this.goTo(nextIndex);
  }

  /**
   * Go to previous slide
   */
  previous() {
    let prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.loop ? this.items.length - 1 : 0;
    }
    this.goTo(prevIndex);
  }

  /**
   * Start autoplay
   */
  startAutoplay() {
    if (!this.loop || !this.isPlaying) return;

    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      this.next();
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
}

export default Carousel;
