/**
 * Highlights Section - Load and render highlights from JSON
 * Desktop: Carousel with navigation arrows and pagination dots (matching Featured Works)
 * Mobile: Horizontal scroll-snap carousel with pagination
 */

import { SwipeHandler } from './touch-handler.js';
import { prefersReducedMotion } from './utils.js';

class HighlightsManager {
  constructor() {
    this.highlights = [];
    this.container = null;
    this.gridElement = null;
    this.paginationElement = null;
    this.currentIndex = 0;
    this.slidesPerView = this.getSlidesPerView();
    this.isTransitioning = false;
    this.autoplayInterval = null;
    this.autoplayEnabled = true; // Enable autoplay like Featured Works
    this.autoplayDelay = 5000; // 5 seconds

    // SwipeHandler instance
    this.swipeHandler = null;

    // Elements cache
    this.elements = {};

    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Get slides per view based on viewport width
   * @returns {number} Number of slides to show
   */
  getSlidesPerView() {
    const width = window.innerWidth;
    if (width < 768) return 1;      // Mobile: 1 slide
    if (width < 1024) return 2;     // Tablet: 2 slides
    if (width < 1280) return 2;     // Medium desktop: 2 slides
    return 3;                        // Large desktop: 3 slides
  }

  /**
   * Initialize the highlights manager
   */
  async init() {
    this.container = document.querySelector('.section--highlights');
    this.gridElement = document.querySelector('.highlights__grid');
    this.paginationElement = document.querySelector('.highlights__pagination');

    if (!this.gridElement) {
      console.warn('[Highlights] Grid element not found');
      return;
    }

    try {
      await this.loadHighlights();

      if (this.highlights.length === 0) {
        this.renderEmptyState();
        return;
      }

      this.renderCarousel();
      this.cacheElements();
      this.attachEventListeners();
      this.updateNavigation();

      // Start autoplay if enabled
      if (this.autoplayEnabled && window.innerWidth >= 768) {
        this.startAutoplay();
      }

      console.log('[Highlights] Initialized successfully');
    } catch (error) {
      console.error('[Highlights] Initialization error:', error);
      this.renderEmptyState();
    }
  }

  /**
   * Load highlights from JSON
   */
  async loadHighlights() {
    try {
      const response = await fetch('json_data/highlights.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.highlights || !Array.isArray(data.highlights)) {
        throw new Error('Invalid highlights data format');
      }

      this.highlights = this.sortHighlights(data.highlights);
    } catch (error) {
      console.error('[Highlights] Error loading highlights:', error);
      throw error;
    }
  }

  /**
   * Sort highlights: featured first, then by order, then by date
   */
  sortHighlights(highlights) {
    return highlights.sort((a, b) => {
      // Featured items first
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      // Then by order (if specified)
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }

      // Then by date (newest first)
      const dateA = this.parseDate(a.date);
      const dateB = this.parseDate(b.date);
      return dateB - dateA;
    });
  }

  /**
   * Parse date string (supports formats like "2025-01", "Mar 2025", "2025")
   */
  parseDate(dateStr) {
    if (!dateStr) return new Date(0);

    // Try parsing ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try parsing "Mon YYYY" format
    const monthYear = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (monthYear) {
      return new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    }

    // Fallback to just year
    const year = dateStr.match(/\d{4}/);
    if (year) {
      return new Date(year[0], 0, 1);
    }

    return new Date(0);
  }

  /**
   * Render the carousel structure
   */
  renderCarousel() {
    if (!this.gridElement) return;

    // Check if mobile (use scroll-snap, not carousel)
    if (window.innerWidth < 768) {
      this.renderMobileScroll();
      return;
    }

    // Desktop carousel
    this.gridElement.innerHTML = '';
    this.gridElement.className = 'highlights__carousel-track';

    // Create wrapper if not exists
    let wrapper = this.gridElement.parentElement;
    if (!wrapper.classList.contains('highlights__carousel')) {
      const newWrapper = document.createElement('div');
      newWrapper.className = 'highlights__carousel';
      newWrapper.setAttribute('aria-label', 'Highlights carousel');

      this.gridElement.parentElement.insertBefore(newWrapper, this.gridElement);
      newWrapper.appendChild(this.gridElement);
      wrapper = newWrapper;
    }

    // Render cards
    this.highlights.forEach((highlight, index) => {
      const card = this.createHighlightCard(highlight, index);
      this.gridElement.appendChild(card);
    });

    // Create navigation arrows
    if (!wrapper.querySelector('.highlights__nav--prev')) {
      const prevButton = this.createNavButton('prev');
      const nextButton = this.createNavButton('next');
      wrapper.appendChild(prevButton);
      wrapper.appendChild(nextButton);
    }

    // Update pagination for desktop
    this.updatePagination();
  }

  /**
   * Render mobile scroll-snap layout
   */
  renderMobileScroll() {
    if (!this.gridElement) return;

    this.gridElement.innerHTML = '';
    this.gridElement.className = 'highlights__grid';

    this.highlights.forEach((highlight, index) => {
      const card = this.createHighlightCard(highlight, index);
      this.gridElement.appendChild(card);
    });

    this.setupMobilePagination();
    this.setupScrollSync();
  }

  /**
   * Create a highlight card element (safe DOM construction)
   */
  createHighlightCard(highlight, index) {
    const hasLink = highlight.link?.url;
    const isExternal = highlight.link?.external !== false;

    // Create article element
    const article = document.createElement('article');
    article.className = 'highlight-card';
    article.setAttribute('data-index', index);

    // Create image wrapper
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'highlight-card__image-wrapper';

    const img = document.createElement('img');
    img.src = highlight.image || 'img/placeholder.jpg';
    img.alt = highlight.title || '';
    img.className = 'highlight-card__image';
    img.loading = index < this.slidesPerView ? 'eager' : 'lazy';

    imageWrapper.appendChild(img);

    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'highlight-card__content';

    // Create meta information
    if (highlight.source || highlight.date) {
      const meta = document.createElement('div');
      meta.className = 'highlight-card__meta';

      if (highlight.source) {
        const source = document.createElement('span');
        source.className = 'highlight-card__source';
        source.textContent = highlight.source;
        meta.appendChild(source);
      }

      if (highlight.source && highlight.date) {
        const separator = document.createElement('span');
        separator.className = 'highlight-card__meta-separator';
        meta.appendChild(separator);
      }

      if (highlight.date) {
        const date = document.createElement('span');
        date.className = 'highlight-card__date';
        date.textContent = highlight.date;
        meta.appendChild(date);
      }

      content.appendChild(meta);
    }

    // Create title
    const title = document.createElement('h3');
    title.className = 'highlight-card__title';
    title.textContent = highlight.title || '';
    content.appendChild(title);

    // Create subtitle (optional)
    if (highlight.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'highlight-card__subtitle';
      subtitle.textContent = highlight.subtitle;
      content.appendChild(subtitle);
    }

    // Create description (optional)
    if (highlight.description) {
      const description = document.createElement('p');
      description.className = 'highlight-card__description';
      description.textContent = highlight.description;
      content.appendChild(description);
    }

    // Create link indicator (optional)
    if (hasLink) {
      const linkIndicator = document.createElement('div');
      linkIndicator.className = 'highlight-card__link-indicator';

      const linkText = document.createElement('span');
      linkText.textContent = 'Read more';
      linkIndicator.appendChild(linkText);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'highlight-card__link-icon');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('aria-hidden', 'true');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M7 17L17 7M17 7H7M17 7V17');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');

      svg.appendChild(path);
      linkIndicator.appendChild(svg);
      content.appendChild(linkIndicator);
    }

    // If there's a link, wrap in anchor tag
    if (hasLink) {
      const link = document.createElement('a');
      link.href = highlight.link.url;
      link.className = 'highlight-card__link';
      link.setAttribute('aria-label', `${highlight.title} - ${highlight.source || ''}`);

      if (isExternal) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      link.appendChild(imageWrapper);
      link.appendChild(content);
      article.appendChild(link);
    } else {
      article.appendChild(imageWrapper);
      article.appendChild(content);
    }

    return article;
  }

  /**
   * Create navigation button
   * @param {string} direction - 'prev' or 'next'
   * @returns {HTMLElement} Button element
   */
  createNavButton(direction) {
    const button = document.createElement('button');
    button.className = `highlights__nav highlights__nav--${direction}`;
    button.setAttribute('aria-label', direction === 'prev' ? 'Previous slide' : 'Next slide');
    button.type = 'button';

    // Create SVG icon
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', direction === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6');

    svg.appendChild(path);
    button.appendChild(svg);

    return button;
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    const wrapper = document.querySelector('.highlights__carousel');
    if (wrapper) {
      this.elements = {
        track: wrapper.querySelector('.highlights__carousel-track'),
        cards: wrapper.querySelectorAll('.highlight-card'),
        prevButton: wrapper.querySelector('.highlights__nav--prev'),
        nextButton: wrapper.querySelector('.highlights__nav--next'),
        pagination: this.paginationElement,
        dots: this.paginationElement?.querySelectorAll('.highlights__dot') || []
      };
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Desktop carousel controls
    if (window.innerWidth >= 768) {
      // Navigation buttons
      this.elements.prevButton?.addEventListener('click', () => this.navigate(-1));
      this.elements.nextButton?.addEventListener('click', () => this.navigate(1));

      // Pagination dots
      this.elements.dots.forEach(dot => {
        dot.addEventListener('click', () => {
          const index = parseInt(dot.getAttribute('data-index'));
          this.goToSlide(index * this.slidesPerView);
        });
      });

      // Keyboard navigation
      document.addEventListener('keydown', this.handleKeydown);

      // Touch/swipe support
      if (this.elements.track) {
        this.swipeHandler = new SwipeHandler(this.elements.track, {
          onSwipeLeft: () => this.navigate(1),
          onSwipeRight: () => this.navigate(-1)
        });
      }

      // Pause autoplay on hover
      if (this.container) {
        this.container.addEventListener('mouseenter', () => this.stopAutoplay());
        this.container.addEventListener('mouseleave', () => {
          if (this.autoplayEnabled) this.startAutoplay();
        });
      }
    }

    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeydown(e) {
    if (!this.container) return;

    // Only handle if carousel is in viewport
    const rect = this.container.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom >= 0;

    if (!isInViewport) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.navigate(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.navigate(1);
        break;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const newSlidesPerView = this.getSlidesPerView();

    if (newSlidesPerView !== this.slidesPerView) {
      this.slidesPerView = newSlidesPerView;

      // Re-render for mobile/desktop switch
      if ((window.innerWidth < 768 && this.elements.track) ||
          (window.innerWidth >= 768 && !this.elements.track)) {
        this.renderCarousel();
        this.cacheElements();
        this.attachEventListeners();
        this.updateNavigation();
        return;
      }

      // Adjust current index to prevent out of bounds
      const maxIndex = Math.max(0, this.highlights.length - this.slidesPerView);
      this.currentIndex = Math.min(this.currentIndex, maxIndex);

      // Re-render pagination
      this.updatePagination();

      // Update position
      if (window.innerWidth >= 768) {
        this.updateCarouselPosition(false); // No animation on resize
        this.updateNavigation();
      }
    }
  }

  /**
   * Navigate to next/previous slide
   * @param {number} direction - 1 for next, -1 for previous
   */
  navigate(direction) {
    if (this.isTransitioning || window.innerWidth < 768) return;

    const maxIndex = Math.max(0, this.highlights.length - this.slidesPerView);
    let targetIndex;

    if (direction < 0) {
      // Moving backward (previous)
      targetIndex = this.currentIndex - this.slidesPerView;
      if (targetIndex < 0) {
        targetIndex = maxIndex; // Wrap to end
      }
    } else {
      // Moving forward (next)
      targetIndex = this.currentIndex + this.slidesPerView;
      if (targetIndex > maxIndex) {
        targetIndex = 0; // Wrap to beginning
      }
    }

    this.goToSlide(targetIndex);
  }

  /**
   * Go to specific slide index
   * @param {number} index - Target slide index
   */
  goToSlide(index) {
    if (this.isTransitioning || window.innerWidth < 768) return;

    const maxIndex = Math.max(0, this.highlights.length - this.slidesPerView);
    this.currentIndex = Math.max(0, Math.min(index, maxIndex));

    this.updateCarouselPosition();
    this.updateNavigation();
    this.updatePagination();

    // Reset autoplay
    if (this.autoplayEnabled) {
      this.startAutoplay();
    }
  }

  /**
   * Update carousel position with animation
   * @param {boolean} animate - Whether to animate the transition
   */
  updateCarouselPosition(animate = true) {
    if (!this.elements.track || window.innerWidth < 768) return;

    const cardWidth = 100 / this.slidesPerView; // Percentage
    const offset = -(this.currentIndex * cardWidth);

    this.isTransitioning = true;

    if (animate && !prefersReducedMotion()) {
      this.elements.track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      this.elements.track.style.transition = 'none';
    }

    this.elements.track.style.transform = `translateX(${offset}%)`;

    // Reset transition flag after animation
    setTimeout(() => {
      this.isTransitioning = false;
    }, 500);
  }

  /**
   * Update navigation button states
   */
  updateNavigation() {
    if (!this.elements.prevButton || !this.elements.nextButton) return;

    // Disable buttons if not enough highlights to scroll
    const hasEnoughItems = this.highlights.length > this.slidesPerView;
    this.elements.prevButton.disabled = !hasEnoughItems;
    this.elements.nextButton.disabled = !hasEnoughItems;
  }

  /**
   * Update pagination dots
   */
  updatePagination() {
    if (!this.paginationElement) return;

    // Mobile: one dot per item
    if (window.innerWidth < 768) {
      this.setupMobilePagination();
      return;
    }

    // Desktop: dots for pages
    this.paginationElement.innerHTML = '';
    this.paginationElement.style.display = 'flex';

    const totalPages = Math.ceil(this.highlights.length / this.slidesPerView);
    const currentPage = Math.floor(this.currentIndex / this.slidesPerView);

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 'highlights__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.setAttribute('aria-selected', i === currentPage ? 'true' : 'false');
      dot.setAttribute('data-index', i);
      dot.type = 'button';

      if (i === currentPage) {
        dot.classList.add('is-active');
      }

      dot.addEventListener('click', () => {
        this.goToSlide(i * this.slidesPerView);
      });

      this.paginationElement.appendChild(dot);
    }

    // Update cache
    this.elements.dots = this.paginationElement.querySelectorAll('.highlights__dot');
  }

  /**
   * Setup mobile pagination dots
   */
  setupMobilePagination() {
    if (!this.paginationElement || this.highlights.length === 0) return;

    // Only show pagination on mobile
    if (window.innerWidth >= 768) {
      return;
    }

    this.paginationElement.innerHTML = '';
    this.paginationElement.style.display = 'flex';

    this.highlights.forEach((_, index) => {
      const button = document.createElement('button');
      button.className = 'highlights__dot';
      button.dataset.index = index;
      button.setAttribute('aria-label', `Go to highlight ${index + 1}`);
      button.setAttribute('aria-pressed', index === 0);

      if (index === 0) {
        button.classList.add('is-active');
      }

      button.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        this.scrollToHighlight(idx);
      });

      this.paginationElement.appendChild(button);
    });
  }

  /**
   * Setup scroll sync for mobile pagination
   */
  setupScrollSync() {
    if (!this.gridElement || this.highlights.length === 0) return;

    let scrollTimeout;
    this.gridElement.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateActiveDot();
      }, 100);
    });
  }

  /**
   * Scroll to a specific highlight (mobile)
   */
  scrollToHighlight(index) {
    if (!this.gridElement) return;

    const cards = this.gridElement.querySelectorAll('.highlight-card');
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
    if (window.innerWidth >= 768) return;

    const cards = this.gridElement.querySelectorAll('.highlight-card');
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

    // Update dots
    this.paginationElement.querySelectorAll('.highlights__dot').forEach((dot, index) => {
      const isActive = index === closestIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-pressed', isActive);
    });

    this.currentIndex = closestIndex;
  }

  /**
   * Start autoplay
   */
  startAutoplay() {
    this.stopAutoplay(); // Clear any existing interval

    if (!this.autoplayEnabled || window.innerWidth < 768) return;

    this.autoplayInterval = setInterval(() => {
      this.navigate(1);
    }, this.autoplayDelay);
  }

  /**
   * Stop autoplay
   */
  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  /**
   * Render empty state when no highlights
   */
  renderEmptyState() {
    if (!this.gridElement) return;

    this.gridElement.textContent = '';
    this.gridElement.className = 'highlights__grid';

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'highlights__empty';
    emptyDiv.textContent = 'No highlights available at this time.';

    this.gridElement.appendChild(emptyDiv);
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('resize', this.handleResize);

    // Cleanup swipe handler
    if (this.swipeHandler) {
      this.swipeHandler.destroy();
      this.swipeHandler = null;
    }

    // Stop autoplay
    this.stopAutoplay();
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const manager = new HighlightsManager();
    manager.init();
  });
} else {
  const manager = new HighlightsManager();
  manager.init();
}

export default HighlightsManager;
