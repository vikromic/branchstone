/**
 * Highlights Section - Load and render highlights from JSON
 * Desktop: Carousel with navigation arrows and pagination dots (matching Featured Works)
 * Mobile: Horizontal scroll-snap carousel with pagination
 */

import { SwipeHandler } from './touch-handler.js';
import { prefersReducedMotion } from './utils.js';
import { BREAKPOINTS } from './constants.js';
import { getI18n } from './i18n.js';
import { getCarouselPageStarts, resolveCurrentPage, getNextPageStart } from './highlights-pagination.js';

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

    // AbortController for cleanup
    this.abortController = new AbortController();

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
    if (width < BREAKPOINTS.MOBILE) return 1;      // Mobile: 1 slide
    if (width < BREAKPOINTS.TABLET) return 2;      // Tablet: 2 slides
    if (width < 1280) return 2;                    // Medium desktop: 2 slides
    return 3;                                      // Large desktop: 3 slides
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
      if (this.autoplayEnabled) {
        this.startAutoplay();
      }

      // Listen for language changes to reload highlights
      this.setupLanguageChangeListener();
    } catch (error) {
      console.error('[Highlights] Initialization error:', error);
      this.renderEmptyState();
    }
  }

  /**
   * Set up listener for language change events
   */
  setupLanguageChangeListener() {
    document.addEventListener('languageChanged', async (event) => {
      console.log('[Highlights] Detected language change event:', event.detail);
      await this.reloadHighlights();
    });
  }

  /**
   * Reload highlights when language changes
   */
  async reloadHighlights() {
    try {
      this.stopAutoplay();
      await this.loadHighlights();

      if (this.highlights.length === 0) {
        this.renderEmptyState();
        return;
      }

      this.currentIndex = 0;
      this.renderCarousel();
      this.cacheElements();
      this.updateNavigation();

      if (this.autoplayEnabled) {
        this.startAutoplay();
      }

      console.log('[Highlights] Reloaded for new language');
    } catch (error) {
      console.error('[Highlights] Error reloading highlights:', error);
    }
  }

  /**
   * Detect current language from multiple sources
   * @returns {string} Language code ('en' or 'uk')
   */
  detectLanguage() {
    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    console.log('[Highlights] Language detection - URL param:', urlLang);
    if (urlLang === 'uk') return 'uk';

    // 2. Check localStorage (uses same key as i18n system)
    try {
      const storedLang = localStorage.getItem('branchstone.language');
      console.log('[Highlights] Language detection - localStorage:', storedLang);
      if (storedLang === 'uk') return 'uk';
    } catch (e) {
      console.log('[Highlights] Language detection - localStorage unavailable');
    }

    // 3. Check i18n instance
    const i18n = getI18n();
    console.log('[Highlights] Language detection - i18n:', i18n?.currentLanguage);
    if (i18n?.currentLanguage === 'uk') return 'uk';

    // 4. Default to English
    console.log('[Highlights] Language detection - defaulting to en');
    return 'en';
  }

  /**
   * Load highlights from JSON (language-aware)
   */
  async loadHighlights() {
    try {
      // Determine which JSON file to load based on current language
      const currentLang = this.detectLanguage();

      // Use Ukrainian file for 'uk' language, otherwise English
      const jsonPath = currentLang === 'uk'
        ? 'json_data/ukr/highlights_uk.json'
        : 'json_data/highlights.json';

      console.log(`[Highlights] Detected language: ${currentLang}, loading from: ${jsonPath}`);

      const response = await fetch(jsonPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Highlights] Loaded ${data.highlights?.length || 0} highlights from ${jsonPath}`);

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
    if (window.innerWidth < BREAKPOINTS.MOBILE) {
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

    // Invalidate caches when content changes
    this._cachedMobileCards = null;
    this._cachedMobileDots = null;

    this.setupMobilePagination();
    this.setupScrollSync();
  }

  /**
   * Create a highlight card element (safe DOM construction)
   */
  createHighlightCard(highlight, index) {
    // Support both string URLs and object format { url: "...", external: true }
    const linkUrl = typeof highlight.link === 'string' ? highlight.link : highlight.link?.url;
    const hasLink = !!linkUrl;
    const isExternal = typeof highlight.link === 'string' ? true : highlight.link?.external !== false;

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
      const i18n = getI18n();
      linkText.textContent = i18n?.t('about.highlights.readMore', 'Read more') || 'Read more';
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
      link.href = linkUrl;
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
    if (window.innerWidth >= BREAKPOINTS.MOBILE) {
      // Navigation buttons
      this.elements.prevButton?.addEventListener('click', () => this.navigate(-1));
      this.elements.nextButton?.addEventListener('click', () => this.navigate(1));

      // Keyboard navigation
      document.addEventListener('keydown', this.handleKeydown, { signal: this.abortController.signal });

      // Touch/swipe support
      if (this.elements.track) {
        this.swipeHandler = new SwipeHandler(this.elements.track, {
          onSwipeLeft: () => this.navigate(1),
          onSwipeRight: () => this.navigate(-1)
        });
      }

      if (this.container) {
        this.container.addEventListener('mouseenter', () => this.stopAutoplay());
        this.container.addEventListener('mouseleave', () => {
          if (this.autoplayEnabled) this.startAutoplay();
        });
      }
    }
    
    // Always add touch listeners to container so mobile swipe pauses autoplay
    if (this.container) {
      this.container.addEventListener('touchstart', () => this.stopAutoplay(), { passive: true });
      this.container.addEventListener('touchend', () => {
        if (this.autoplayEnabled) this.startAutoplay();
      }, { passive: true });
    }

    // Handle window resize with cleanup signal
    window.addEventListener('resize', this.handleResize, { signal: this.abortController.signal });
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
      if ((window.innerWidth < BREAKPOINTS.MOBILE && this.elements.track) ||
          (window.innerWidth >= BREAKPOINTS.MOBILE && !this.elements.track)) {
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
      if (window.innerWidth >= BREAKPOINTS.MOBILE) {
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
    if (this.isTransitioning || window.innerWidth < BREAKPOINTS.MOBILE) return;
    const pageStarts = this.getDesktopPageStarts();
    if (pageStarts.length <= 1) return;

    const normalizedDirection = direction < 0 ? -1 : 1;
    const targetIndex = getNextPageStart(pageStarts, this.currentIndex, normalizedDirection);
    this.goToSlide(targetIndex);
  }

  /**
   * Go to specific slide index
   * @param {number} index - Target slide index
   */
  goToSlide(index) {
    if (this.isTransitioning || window.innerWidth < BREAKPOINTS.MOBILE) return;

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
    if (!this.elements.track || window.innerWidth < BREAKPOINTS.MOBILE) return;

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
    if (window.innerWidth < BREAKPOINTS.MOBILE) {
      this.setupMobilePagination();
      return;
    }

    // Desktop: dots for pages
    this.paginationElement.innerHTML = '';
    this.paginationElement.style.display = 'flex';

    const pageStarts = this.getDesktopPageStarts();
    const totalPages = pageStarts.length;
    const currentPage = this.getCurrentDesktopPageIndex(pageStarts);

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
        this.goToSlide(pageStarts[i]);
      });

      this.paginationElement.appendChild(dot);
    }

    // Update cache
    this.elements.dots = this.paginationElement.querySelectorAll('.highlights__dot');
  }

  /**
   * Compute desktop page starts for current data/viewport.
   * Example: 5 items with 2 cards per view -> [0, 2, 3]
   */
  getDesktopPageStarts() {
    return getCarouselPageStarts(this.highlights.length, this.slidesPerView);
  }

  /**
   * Resolve current desktop page index with safe fallback.
   */
  getCurrentDesktopPageIndex(pageStarts = this.getDesktopPageStarts()) {
    if (pageStarts.length === 0) return 0;

    try {
      return resolveCurrentPage(pageStarts, this.currentIndex);
    } catch (error) {
      console.warn('[Highlights] Failed to resolve current page, falling back to page 0', error);
      return 0;
    }
  }

  /**
   * Setup mobile pagination dots
   */
  setupMobilePagination() {
    if (!this.paginationElement || this.highlights.length === 0) return;

    // Only show pagination on mobile
    if (window.innerWidth >= BREAKPOINTS.MOBILE) {
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

    // Invalidate cache when dots are recreated
    this._cachedMobileDots = null;
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
    if (window.innerWidth >= BREAKPOINTS.MOBILE) return;

    // Cache queries for performance
    if (!this._cachedMobileCards) {
      this._cachedMobileCards = this.gridElement.querySelectorAll('.highlight-card');
    }
    if (!this._cachedMobileDots) {
      this._cachedMobileDots = this.paginationElement.querySelectorAll('.highlights__dot');
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
   * Start autoplay
   */
  startAutoplay() {
    this.stopAutoplay(); // Clear any existing interval

    if (!this.autoplayEnabled) return;

    this.autoplayInterval = setInterval(() => {
      if (window.innerWidth < BREAKPOINTS.MOBILE) {
        if (this.highlights.length <= 1) return;
        const nextIndex = (this.currentIndex + 1) % this.highlights.length;
        this.scrollToHighlight(nextIndex);
      } else {
        this.navigate(1);
      }
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
    // Remove all event listeners via AbortController
    this.abortController.abort();

    // Cleanup swipe handler
    if (this.swipeHandler) {
      this.swipeHandler.destroy();
      this.swipeHandler = null;
    }

    // Stop autoplay
    this.stopAutoplay();
  }
}

// Initialize only if container exists on page
function initHighlights() {
  const container = document.querySelector('.section--highlights');
  if (container) {
    const manager = new HighlightsManager();
    manager.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHighlights);
} else {
  initHighlights();
}

export default HighlightsManager;
