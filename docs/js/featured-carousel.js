/**
 * FeaturedCarousel - Featured artworks carousel for home page
 * Displays highlighted, unsold artworks with navigation and swipe support
 */

import { sanitizeText, isValidImageUrl } from './security.js';
import { prefersReducedMotion } from './utils.js';
import { URLS, ANIMATION } from './constants.js';
import { SwipeHandler } from './touch-handler.js';

export class FeaturedCarousel {
  constructor(containerSelector = '#featured-carousel') {
    this.container = document.querySelector(containerSelector);
    this.artworks = [];
    this.currentIndex = 0;
    this.slidesPerView = this.getSlidesPerView();
    this.autoplayInterval = null;
    this.autoplayEnabled = false;
    this.autoplayDelay = ANIMATION.TOAST_DURATION * 2.5; // 5 seconds
    this.isTransitioning = false;

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
    return 3;                        // Desktop: 3 slides
  }

  /**
   * Load and filter highlighted artworks from JSON
   * @returns {Promise<Array>} Array of highlighted artworks
   */
  async loadArtworks() {
    try {
      console.log('[FeaturedCarousel] Loading artworks...');
      const response = await fetch(URLS.ARTWORKS_JSON);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Filter: highlighted = true AND sold = false
      this.artworks = (data.artworks || []).filter(
        artwork => artwork.highlighted === true && artwork.sold === false
      );

      console.log('[FeaturedCarousel] Loaded', this.artworks.length, 'highlighted artworks');
      return this.artworks;
    } catch (error) {
      console.error('[FeaturedCarousel] Error loading artworks:', error);
      throw error;
    }
  }

  /**
   * Initialize the carousel
   */
  async init() {
    if (!this.container) {
      console.warn('[FeaturedCarousel] Container not found');
      return;
    }

    try {
      // Load artworks
      await this.loadArtworks();

      if (this.artworks.length === 0) {
        this.showEmptyState();
        return;
      }

      // Render carousel
      this.render();

      // Cache elements
      this.cacheElements();

      // Attach event listeners
      this.attachEventListeners();

      // Update navigation state
      this.updateNavigation();

      // Start autoplay if enabled
      if (this.autoplayEnabled) {
        this.startAutoplay();
      }

      console.log('[FeaturedCarousel] Initialized successfully');
    } catch (error) {
      console.error('[FeaturedCarousel] Initialization failed:', error);
      this.showErrorState();
    }
  }

  /**
   * Render the carousel structure
   */
  render() {
    // Create carousel wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'featured-carousel';
    wrapper.setAttribute('aria-label', 'Featured artworks carousel');

    // Create track container
    const track = document.createElement('div');
    track.className = 'featured-carousel__track';
    track.setAttribute('role', 'list');

    // Render artwork cards
    this.artworks.forEach((artwork, index) => {
      const card = this.createCard(artwork, index);
      track.appendChild(card);
    });

    // Create navigation arrows
    const prevButton = this.createNavButton('prev');
    const nextButton = this.createNavButton('next');

    // Create pagination dots
    const pagination = this.createPagination();

    // Assemble carousel
    wrapper.appendChild(prevButton);
    wrapper.appendChild(track);
    wrapper.appendChild(nextButton);
    wrapper.appendChild(pagination);

    // Clear container and insert carousel
    this.container.innerHTML = '';
    this.container.appendChild(wrapper);
  }

  /**
   * Create artwork card element
   * @param {Object} artwork - Artwork data
   * @param {number} index - Card index
   * @returns {HTMLElement} Card element
   */
  createCard(artwork, index) {
    const article = document.createElement('article');
    article.className = 'featured-carousel__card';
    article.setAttribute('role', 'listitem');
    article.setAttribute('data-index', index);
    article.setAttribute('data-artwork-id', `artwork-${this.slugify(artwork.name)}`);

    // Create link wrapper for card navigation
    const link = document.createElement('a');
    const artworkSlug = this.slugify(artwork.name);
    link.href = `${URLS.GALLERY}?artwork=${artworkSlug}`;
    link.className = 'featured-carousel__link';
    link.setAttribute('aria-label', `View ${artwork.name} in gallery`);

    // Image wrapper
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'featured-carousel__image-wrapper';

    // Image
    const img = document.createElement('img');
    const imagePath = artwork.main_image.startsWith('img/')
      ? artwork.main_image
      : `img/${artwork.main_image}`;

    if (isValidImageUrl(imagePath)) {
      img.src = imagePath;
    } else {
      console.warn('[FeaturedCarousel] Invalid image URL:', imagePath);
      img.src = URLS.PLACEHOLDER_IMAGE; // Fallback
    }

    img.alt = sanitizeText(artwork.name);
    img.className = 'featured-carousel__image';
    img.loading = index < this.slidesPerView ? 'eager' : 'lazy';

    imageWrapper.appendChild(img);

    // Content
    const content = document.createElement('div');
    content.className = 'featured-carousel__content';

    const title = document.createElement('h3');
    title.className = 'featured-carousel__title';
    title.textContent = sanitizeText(artwork.name);

    const collection = document.createElement('p');
    collection.className = 'featured-carousel__collection';
    collection.textContent = sanitizeText(artwork.collection);

    content.appendChild(title);
    content.appendChild(collection);

    // Favorite button
    const favoriteBtn = this.createFavoriteButton(artwork);

    // Assemble
    link.appendChild(imageWrapper);
    link.appendChild(content);

    article.appendChild(link);
    article.appendChild(favoriteBtn);

    return article;
  }

  /**
   * Create favorite button
   * @param {Object} artwork - Artwork data
   * @returns {HTMLElement} Favorite button
   */
  createFavoriteButton(artwork) {
    const button = document.createElement('button');
    button.className = 'featured-carousel__favorite';
    button.setAttribute('aria-label', 'Add to favorites');
    button.setAttribute('data-artwork-id', `artwork-${this.slugify(artwork.name)}`);
    button.type = 'button';

    // Create SVG icon
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'featured-carousel__favorite-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z');

    svg.appendChild(path);
    button.appendChild(svg);

    // Click handler - prevent link navigation
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Dispatch custom event for favorites manager to handle
      const event = new CustomEvent('favoriteToggle', {
        detail: { artworkId: button.getAttribute('data-artwork-id') }
      });
      document.dispatchEvent(event);
    });

    return button;
  }

  /**
   * Create navigation button
   * @param {string} direction - 'prev' or 'next'
   * @returns {HTMLElement} Button element
   */
  createNavButton(direction) {
    const button = document.createElement('button');
    button.className = `featured-carousel__nav featured-carousel__nav--${direction}`;
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
   * Create pagination dots
   * @returns {HTMLElement} Pagination container
   */
  createPagination() {
    const pagination = document.createElement('div');
    pagination.className = 'featured-carousel__pagination';
    pagination.setAttribute('role', 'tablist');
    pagination.setAttribute('aria-label', 'Carousel pagination');

    const totalPages = Math.ceil(this.artworks.length / this.slidesPerView);

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 'featured-carousel__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.setAttribute('data-index', i);
      dot.type = 'button';

      if (i === 0) {
        dot.classList.add('is-active');
      }

      pagination.appendChild(dot);
    }

    return pagination;
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      track: this.container.querySelector('.featured-carousel__track'),
      cards: this.container.querySelectorAll('.featured-carousel__card'),
      prevButton: this.container.querySelector('.featured-carousel__nav--prev'),
      nextButton: this.container.querySelector('.featured-carousel__nav--next'),
      pagination: this.container.querySelector('.featured-carousel__pagination'),
      dots: this.container.querySelectorAll('.featured-carousel__dot')
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
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

    // Touch/swipe support using SwipeHandler
    if (this.elements.track) {
      this.swipeHandler = new SwipeHandler(this.elements.track, {
        onSwipeLeft: () => this.navigate(1),
        onSwipeRight: () => this.navigate(-1)
      });
    }

    // Pause autoplay on hover
    this.container.addEventListener('mouseenter', () => this.stopAutoplay());
    this.container.addEventListener('mouseleave', () => {
      if (this.autoplayEnabled) this.startAutoplay();
    });

    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeydown(e) {
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

      // Adjust current index to prevent out of bounds
      const maxIndex = Math.max(0, this.artworks.length - this.slidesPerView);
      this.currentIndex = Math.min(this.currentIndex, maxIndex);

      // Re-render pagination
      this.updatePagination();

      // Update position
      this.updateCarouselPosition(false); // No animation on resize
      this.updateNavigation();
    }
  }

  /**
   * Navigate to next/previous slide
   * @param {number} direction - 1 for next (forward), -1 for previous (backward)
   */
  navigate(direction) {
    if (this.isTransitioning) return;

    const maxIndex = Math.max(0, this.artworks.length - this.slidesPerView);
    let targetIndex;

    if (direction < 0) {
      // Moving backward (previous) - show earlier items
      targetIndex = this.currentIndex - this.slidesPerView;
      if (targetIndex < 0) {
        targetIndex = maxIndex; // Wrap to end
      }
    } else {
      // Moving forward (next) - show later items
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
    if (this.isTransitioning) return;

    const maxIndex = Math.max(0, this.artworks.length - this.slidesPerView);
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
    if (!this.elements.track) return;

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

    // Disable buttons if not enough artworks to scroll
    this.elements.prevButton.disabled = this.artworks.length <= this.slidesPerView;
    this.elements.nextButton.disabled = this.artworks.length <= this.slidesPerView;
  }

  /**
   * Update pagination dots
   */
  updatePagination() {
    if (!this.elements.pagination) return;

    // Clear and recreate pagination
    this.elements.pagination.innerHTML = '';

    const totalPages = Math.ceil(this.artworks.length / this.slidesPerView);
    const currentPage = Math.floor(this.currentIndex / this.slidesPerView);

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 'featured-carousel__dot';
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

      this.elements.pagination.appendChild(dot);
    }

    // Update cache
    this.elements.dots = this.elements.pagination.querySelectorAll('.featured-carousel__dot');
  }

  /**
   * Start autoplay
   */
  startAutoplay() {
    this.stopAutoplay(); // Clear any existing interval

    if (!this.autoplayEnabled) return;

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
   * Show empty state - safe DOM creation
   */
  showEmptyState() {
    const message = document.createElement('div');
    message.className = 'featured-carousel__empty';

    const text = document.createElement('p');
    text.textContent = 'No featured artworks available at the moment.';

    const link = document.createElement('a');
    link.href = URLS.GALLERY;
    link.className = 'btn btn--primary';
    link.textContent = 'View Full Gallery';

    message.appendChild(text);
    message.appendChild(link);
    this.container.appendChild(message);
  }

  /**
   * Show error state - safe DOM creation
   */
  showErrorState() {
    const message = document.createElement('div');
    message.className = 'featured-carousel__error';

    const text = document.createElement('p');
    text.textContent = 'Unable to load featured artworks. Please try again later.';

    message.appendChild(text);
    this.container.appendChild(message);
  }

  /**
   * Convert text to URL-friendly slug
   * @param {string} text - Text to slugify
   * @returns {string} Slugified text
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

    // Clear container (safe - clearing internal content we control)
    if (this.container) {
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
    }
  }
}
