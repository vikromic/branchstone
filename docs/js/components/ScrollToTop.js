/**
 * Scroll To Top Button Component
 * Shows button after scrolling and smoothly scrolls to top
 * @module components/ScrollToTop
 */

import { on, createElement } from '../utils/dom.js';
import CONFIG from '../config.js';

export class ScrollToTop {
  /**
   * @param {Object} options - Component options
   * @param {number} options.showAfterScroll - Show after px scrolled
   */
  constructor(options = {}) {
    this.showAfterScroll = options.showAfterScroll || CONFIG.ui.scrollToTop.showAfterScroll;
    this.button = null;
    this.cleanupFunctions = [];

    this.init();
  }

  /**
   * Initialize component
   * @private
   */
  init() {
    this.createButton();
    this.attachEventListeners();
  }

  /**
   * Create scroll-to-top button
   * @private
   */
  createButton() {
    this.button = createElement('button', {
      className: 'scroll-to-top',
      'aria-label': 'Scroll to top',
    });

    this.button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    `;

    document.body.appendChild(this.button);
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    // Show/hide based on scroll position
    let ticking = false;
    this.cleanupFunctions.push(
      on(window, 'scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            this.updateVisibility();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true }),
      on(this.button, 'click', () => this.scrollToTop())
    );

    // Initial visibility check
    this.updateVisibility();
  }

  /**
   * Update button visibility based on scroll position
   * @private
   */
  updateVisibility() {
    const shouldShow = window.pageYOffset > this.showAfterScroll;
    this.button.classList.toggle('visible', shouldShow);
  }

  /**
   * Scroll to top of page
   */
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Destroy component
   */
  destroy() {
    this.cleanupFunctions.forEach(cleanup => cleanup?.());
    this.cleanupFunctions = [];
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
  }
}

export default ScrollToTop;
