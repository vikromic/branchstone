/**
 * Testimonials Section - Load and render testimonials from JSON
 * Desktop: 3-column grid (unchanged)
 * Mobile: Horizontal scroll-snap carousel with pagination dots
 */

import { BREAKPOINTS } from './constants.js';

class TestimonialsManager {
  constructor() {
    this.testimonials = [];
    this.container = null;
    this.gridElement = null;
    this.paginationElement = null;
    this.currentIndex = 0;

    // AbortController for cleanup
    this.abortController = new AbortController();

    // Bind methods
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Initialize the testimonials manager
   */
  async init() {
    this.container = document.querySelector('.section--testimonials');
    this.gridElement = this.container?.querySelector('.grid--three-column');
    this.paginationElement = document.querySelector('.testimonials__pagination');

    if (!this.gridElement) {
      console.warn('[Testimonials] Grid element not found');
      return;
    }

    // Guard: skip if initDynamicFeedbacks already loaded content (prevents double-loading)
    if (this.gridElement.dataset.feedbacksLoaded) {
      console.log('[Testimonials] Content already loaded by main.js, skipping');
      return;
    }
    this.gridElement.dataset.feedbacksLoaded = 'true';

    try {
      await this.loadTestimonials();

      if (this.testimonials.length === 0) {
        this.renderEmptyState();
        return;
      }

      this.renderTestimonials();

      // Setup mobile-specific features
      if (window.innerWidth < BREAKPOINTS.MOBILE) {
        this.setupMobilePagination();
        this.setupScrollSync();
      }

      // Handle window resize with cleanup signal
      window.addEventListener('resize', this.handleResize, { signal: this.abortController.signal });
    } catch (error) {
      console.error('[Testimonials] Initialization error:', error);
      this.renderEmptyState();
    }
  }

  /**
   * Load testimonials from JSON
   */
  async loadTestimonials() {
    try {
      const response = await fetch('json_data/feedbacks.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.feedbacks || !Array.isArray(data.feedbacks)) {
        throw new Error('Invalid testimonials data format');
      }

      // Limit to first 3 testimonials
      this.testimonials = data.feedbacks.slice(0, 3);
    } catch (error) {
      console.error('[Testimonials] Error loading testimonials:', error);
      throw error;
    }
  }

  /**
   * Render testimonials (both desktop grid and mobile carousel use same HTML)
   */
  renderTestimonials() {
    if (!this.gridElement) return;

    // Clear existing content using safe DOM method
    while (this.gridElement.firstChild) {
      this.gridElement.removeChild(this.gridElement.firstChild);
    }

    // Add class for mobile carousel
    if (window.innerWidth < BREAKPOINTS.MOBILE) {
      this.gridElement.classList.add('testimonials-grid');
    } else {
      this.gridElement.classList.remove('testimonials-grid');
    }

    // Render testimonial cards
    this.testimonials.forEach((testimonial, index) => {
      const card = this.createTestimonialCard(testimonial, index);
      this.gridElement.appendChild(card);
    });

    // Invalidate caches when content changes
    this._cachedMobileCards = null;
    this._cachedMobileDots = null;
  }

  /**
   * Create a testimonial card element (safe DOM construction)
   */
  createTestimonialCard(testimonial, index) {
    // Create article element
    const article = document.createElement('article');
    article.className = 'testimonial-card';
    article.setAttribute('data-index', index);

    // Create quote icon
    const quoteIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    quoteIcon.setAttribute('class', 'testimonial-card__quote-icon');
    quoteIcon.setAttribute('viewBox', '0 0 24 24');
    quoteIcon.setAttribute('fill', 'currentColor');
    quoteIcon.setAttribute('aria-hidden', 'true');

    const quotePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    quotePath.setAttribute('d', 'M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z');

    quoteIcon.appendChild(quotePath);
    article.appendChild(quoteIcon);

    // Create review text
    const review = document.createElement('p');
    review.className = 'testimonial-card__review';
    review.textContent = testimonial.review || '';
    article.appendChild(review);

    // Create author wrapper
    const author = document.createElement('div');
    author.className = 'testimonial-card__author';

    // Create name
    const name = document.createElement('p');
    name.className = 'testimonial-card__name';
    name.textContent = testimonial.name || '';
    author.appendChild(name);

    // Create location
    if (testimonial.location) {
      const location = document.createElement('p');
      location.className = 'testimonial-card__location';
      location.textContent = testimonial.location;
      author.appendChild(location);
    }

    article.appendChild(author);

    return article;
  }

  /**
   * Setup mobile pagination dots
   */
  setupMobilePagination() {
    if (!this.paginationElement || this.testimonials.length === 0) return;

    // Only show pagination on mobile
    if (window.innerWidth >= BREAKPOINTS.MOBILE) {
      this.paginationElement.style.display = 'none';
      return;
    }

    // Clear existing dots using safe DOM method
    while (this.paginationElement.firstChild) {
      this.paginationElement.removeChild(this.paginationElement.firstChild);
    }
    this.paginationElement.style.display = 'flex';

    this.testimonials.forEach((_, index) => {
      const button = document.createElement('button');
      button.className = 'testimonials__dot';
      button.dataset.index = index;
      button.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
      button.setAttribute('aria-pressed', index === 0);
      button.type = 'button';

      if (index === 0) {
        button.classList.add('is-active');
      }

      button.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        this.scrollToTestimonial(idx);
      });

      this.paginationElement.appendChild(button);
    });

    // Invalidate cache when dots are recreated
    this._cachedMobileDots = null;
  }

  /**
   * Setup scroll sync for mobile pagination
   */
  setupScrollSync() {
    if (!this.gridElement || this.testimonials.length === 0) return;

    let scrollTimeout;
    this.gridElement.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateActiveDot();
      }, 100);
    });
  }

  /**
   * Scroll to a specific testimonial (mobile)
   */
  scrollToTestimonial(index) {
    if (!this.gridElement) return;

    const cards = this.gridElement.querySelectorAll('.testimonial-card');
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      });
    }
  }

  /**
   * Update active dot based on scroll position (mobile)
   */
  updateActiveDot() {
    if (!this.gridElement || !this.paginationElement) return;
    if (window.innerWidth >= BREAKPOINTS.MOBILE) return;

    // Cache queries for performance
    if (!this._cachedMobileCards) {
      this._cachedMobileCards = this.gridElement.querySelectorAll('.testimonial-card');
    }
    if (!this._cachedMobileDots) {
      this._cachedMobileDots = this.paginationElement.querySelectorAll('.testimonials__dot');
    }

    const cards = this._cachedMobileCards;
    const scrollLeft = this.gridElement.scrollLeft;

    // Find the card that's most in view
    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardLeft = card.offsetLeft - this.gridElement.offsetLeft;
      const distance = Math.abs(scrollLeft - cardLeft);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    // Update dots (use cached query)
    this._cachedMobileDots.forEach((dot, index) => {
      const isActive = index === closestIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-pressed', isActive);
    });

    this.currentIndex = closestIndex;
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Re-render for mobile/desktop switch
    const wasMobile = this.gridElement?.classList.contains('testimonials-grid');
    const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;

    if (wasMobile !== isMobile) {
      this.renderTestimonials();

      if (isMobile) {
        this.setupMobilePagination();
        this.setupScrollSync();
      } else {
        // Hide pagination on desktop
        if (this.paginationElement) {
          this.paginationElement.style.display = 'none';
        }
      }
    }
  }

  /**
   * Render empty state when no testimonials
   */
  renderEmptyState() {
    if (!this.gridElement) return;

    this.gridElement.textContent = '';
    this.gridElement.className = 'testimonials__empty';

    const emptyDiv = document.createElement('div');
    emptyDiv.textContent = 'No testimonials available at this time.';

    this.gridElement.appendChild(emptyDiv);
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    // Remove all event listeners via AbortController
    this.abortController.abort();
  }
}

// Initialize only if container exists on page
function initTestimonials() {
  const container = document.querySelector('.section--testimonials');
  if (container) {
    const manager = new TestimonialsManager();
    manager.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTestimonials);
} else {
  initTestimonials();
}

export default TestimonialsManager;
