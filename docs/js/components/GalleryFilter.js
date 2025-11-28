/**
 * Gallery Filter Component
 * Manages gallery filtering by categories
 * @module components/GalleryFilter
 */

import { $, createElement } from '../utils/dom.js';

export class GalleryFilter {
  /**
   * @param {Object} options - Filter options
   * @param {string} options.containerSelector - Filter container selector
   * @param {string} options.gallerySelector - Gallery grid selector
   * @param {Array} options.categories - Available categories
   * @param {Function} options.onFilter - Callback after filtering
   */
  constructor(options = {}) {
    this.container = $(options.containerSelector);
    this.galleryContainer = $(options.gallerySelector);
    this.categories = options.categories || [];
    this.onFilterCallback = options.onFilter;
    this.activeCategory = 'all';

    if (!this.container || !this.galleryContainer) return;

    this.init();
  }

  /**
   * Initialize filter
   * @private
   */
  init() {
    this.render();
    this.attachEventListeners();

    // Update URL if there's a filter in the hash
    this.handleURLFilter();

    // Listen for language changes
    this.setupLanguageListener();
  }

  /**
   * Setup language change listener to update button labels
   * @private
   */
  setupLanguageListener() {
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        // Delay to allow i18n to update first
        setTimeout(() => this.updateButtonLabels(), 50);
      });
    }
  }

  /**
   * Update all filter button labels with current translations
   * @private
   */
  updateButtonLabels() {
    const buttons = this.container.querySelectorAll('.filter-btn');
    buttons.forEach(button => {
      const categoryId = button.dataset.category;
      button.textContent = this.getLabel(categoryId);
    });
  }

  /**
   * Get translated label for category
   * @private
   * @param {string} categoryId - Category ID
   * @returns {string} Translated label
   */
  getLabel(categoryId) {
    if (categoryId === 'all') {
      return window.getTranslation?.('gallery.filterAll') || 'All Works';
    }
    return window.getTranslation?.(`gallery.filters.${categoryId}`)
      || this.categories.find(cat => cat.id === categoryId)?.label
      || categoryId;
  }

  /**
   * Render filter buttons
   * @private
   */
  render() {
    const filterButtons = createElement('div', {
      className: 'gallery-filter-buttons',
      role: 'group',
      'aria-label': 'Filter artworks by category'
    });

    // Add "All Works" button
    const allLabel = this.getLabel('all');
    const allButton = this.createFilterButton('all', allLabel, true);
    filterButtons.appendChild(allButton);

    // Add category buttons
    this.categories.forEach(category => {
      const label = this.getLabel(category.id);
      const button = this.createFilterButton(
        category.id,
        label,
        false
      );
      filterButtons.appendChild(button);
    });

    this.container.appendChild(filterButtons);
    this.filterButtonsContainer = filterButtons;

    // Add screen reader live region for filter announcements
    const liveRegion = createElement('div', {
      className: 'sr-only',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      id: 'filter-announcement'
    });
    this.container.appendChild(liveRegion);
  }

  /**
   * Create filter button
   * @private
   * @param {string} categoryId - Category ID
   * @param {string} label - Button label
   * @param {boolean} isActive - Whether button is active
   * @returns {Element} Button element
   */
  createFilterButton(categoryId, label, isActive) {
    const button = createElement('button', {
      className: `filter-btn ${isActive ? 'active' : ''}`,
      dataset: { category: categoryId },
      'aria-pressed': isActive.toString()
    });
    button.textContent = label;
    return button;
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    // Filter button clicks
    this.container.addEventListener('click', (e) => {
      const button = e.target.closest('.filter-btn');
      if (!button) return;

      const category = button.dataset.category;
      this.filterGallery(category);
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.handleURLFilter();
    });
  }

  /**
   * Filter gallery by category
   * @param {string} category - Category to filter by
   */
  filterGallery(category) {
    if (this.activeCategory === category) return;

    this.activeCategory = category;

    // Update button states
    this.updateButtonStates(category);

    // Filter items with animation
    this.animateFilterTransition(category);

    // Update URL
    this.updateURL(category);

    // Announce to screen readers
    this.announceFilter(category);

    // Trigger callback
    if (this.onFilterCallback) {
      this.onFilterCallback(category);
    }
  }

  /**
   * Update button active states
   * @private
   * @param {string} activeCategory - Active category
   */
  updateButtonStates(activeCategory) {
    const buttons = this.container.querySelectorAll('.filter-btn');
    buttons.forEach(button => {
      const isActive = button.dataset.category === activeCategory;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive.toString());
    });
  }

  /**
   * Animate filter transition
   * Optimized to avoid layout thrashing (batched reads/writes)
   * @private
   * @param {string} category - Category to show
   */
  animateFilterTransition(category) {
    const items = this.galleryContainer.querySelectorAll('.gallery-item');

    // Phase 1: Add CSS class for fade-out (single style recalc)
    this.galleryContainer.classList.add('filtering');

    // Phase 2: After transition, batch all visibility changes
    setTimeout(() => {
      requestAnimationFrame(() => {
        // Batch all DOM writes together (no reads in between)
        items.forEach(item => {
          const itemCategory = item.dataset.category;
          const shouldShow = category === 'all' || itemCategory === category;

          item.classList.toggle('filtered-out', !shouldShow);
          item.setAttribute('aria-hidden', (!shouldShow).toString());
        });

        // Single reflow point after all changes
        this.galleryContainer.classList.remove('filtering');
      });
    }, 300);
  }

  /**
   * Update URL with filter state
   * @private
   * @param {string} category - Active category
   */
  updateURL(category) {
    const url = new URL(window.location);
    if (category === 'all') {
      url.hash = '';
    } else {
      url.hash = `category=${category}`;
    }
    window.history.pushState({ category }, '', url);
  }

  /**
   * Handle URL filter on page load or back/forward
   * @private
   */
  handleURLFilter() {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const category = params.get('category') || 'all';

    if (this.categories.find(cat => cat.id === category) || category === 'all') {
      this.filterGallery(category);
    }
  }

  /**
   * Announce filter change to screen readers
   * @private
   * @param {string} category - Active category
   */
  announceFilter(category) {
    const liveRegion = $('#filter-announcement');
    if (!liveRegion) return;

    const categoryLabel = this.getLabel(category);

    const visibleCount = this.galleryContainer.querySelectorAll(
      '.gallery-item[aria-hidden="false"]'
    ).length;

    liveRegion.textContent = `Showing ${visibleCount} ${categoryLabel} artworks`;
  }

  /**
   * Get active category
   * @returns {string} Active category ID
   */
  getActiveCategory() {
    return this.activeCategory;
  }

  /**
   * Reset filter to show all
   */
  reset() {
    this.filterGallery('all');
  }
}

export default GalleryFilter;
