/**
 * Gallery Data Management
 * Handles loading and rendering artwork data from JSON
 */

import { sanitizeText } from './security.js';

export class GalleryDataManager {
  constructor() {
    this.artworks = [];
    this.collections = [];
  }

  /**
   * Load artworks from JSON file
   */
  async loadArtworks() {
    try {
      console.log('[GalleryData] Fetching artworks.json...');
      const response = await fetch('./artworks.json');
      console.log('[GalleryData] Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[GalleryData] JSON parsed, artworks count:', data.artworks?.length || 0);
      this.artworks = data.artworks || [];
      this.extractCollections();
      this.sortArtworks();
      console.log('[GalleryData] Collections extracted:', this.collections);
      console.log('[GalleryData] Artworks sorted by priority (highlighted unsold -> available -> sold)');
      return this.artworks;
    } catch (error) {
      console.error('[GalleryData] Error loading artworks:', error);
      throw error;
    }
  }

  /**
   * Extract unique collections from artworks
   */
  extractCollections() {
    const collectionsSet = new Set();
    this.artworks.forEach(artwork => {
      if (artwork.collection) {
        collectionsSet.add(artwork.collection);
      }
    });
    this.collections = Array.from(collectionsSet).sort();
  }

  /**
   * Sort artworks by priority:
   * 1. Highlighted and not sold (featured pieces)
   * 2. Not highlighted and not sold (regular available pieces)
   * 3. Sold pieces (archived at the end)
   */
  sortArtworks() {
    this.artworks.sort((a, b) => {
      // Calculate priority (lower number = higher priority)
      const getPriority = (artwork) => {
        if (artwork.sold) return 3; // Sold pieces last
        if (artwork.highlighted) return 1; // Highlighted available pieces first
        return 2; // Regular available pieces in the middle
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      return priorityA - priorityB;
    });
  }

  /**
   * Get all collections
   */
  getCollections() {
    return this.collections;
  }

  /**
   * Get all artworks
   */
  getArtworks() {
    return this.artworks;
  }

  /**
   * Convert collection name to filter-friendly slug
   */
  collectionToSlug(collection) {
    return collection
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get size class based on artwork scale metadata
   * Maps scale field to data-size attribute for CSS Grid sizing
   */
  getSizeClass(artwork) {
    // Map scale values to size categories
    const scale = artwork.scale || 'medium'; // Default to medium if not specified

    // Normalize empty string to medium
    if (scale === '') {
      return 'medium';
    }

    return scale; // Returns: "small" | "medium" | "large"
  }


  /**
   * Create SVG element using namespace
   */
  createSVG(viewBox, paths) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    paths.forEach(pathData => {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', pathData);
      svg.appendChild(path);
    });

    return svg;
  }

  /**
   * Create artwork card HTML element using safe DOM methods
   */
  createArtworkCard(artwork, index) {
    const article = document.createElement('article');
    const sizeClass = this.getSizeClass(artwork);
    const collectionSlug = this.collectionToSlug(artwork.collection);

    article.className = 'artwork-card';
    if (artwork.sold) {
      article.classList.add('artwork-card--sold');
    }

    // Apply size-based data attribute for CSS Grid sizing
    article.setAttribute('data-size', sizeClass);
    article.setAttribute('data-collection', collectionSlug);
    article.setAttribute('data-lightbox-trigger', '');
    if (artwork.prints) {
      article.setAttribute('data-prints-available', 'true');
    }
    if (artwork.dimensions) {
      article.setAttribute('data-dimensions', artwork.dimensions);
    }

    // Create unique artwork ID from name
    const artworkId = `artwork-${this.collectionToSlug(artwork.name)}`;

    // Sold badge
    if (artwork.sold) {
      const soldBadge = document.createElement('span');
      soldBadge.className = 'artwork-card__badge artwork-card__badge--sold';
      soldBadge.textContent = 'Sold';
      article.appendChild(soldBadge);
    }

    // Highlighted/Collector's choice badge
    if (artwork.highlighted && !artwork.sold) {
      const highlightBadge = document.createElement('span');
      highlightBadge.className = 'collectors-choice-indicator';
      highlightBadge.setAttribute('aria-label', "Collector's Choice");
      highlightBadge.setAttribute('title', 'Popular with collectors');
      article.appendChild(highlightBadge);
    }

    // Main image
    const img = document.createElement('img');
    const imagePath = artwork.main_image.startsWith('img/') ? artwork.main_image : `img/${artwork.main_image}`;
    img.src = imagePath;
    img.alt = sanitizeText(artwork.name);
    img.className = 'artwork-card__image';
    img.loading = 'lazy';

    // Set loading state
    img.setAttribute('data-loading', '');

    // Simple load handler - size is driven by data-size attribute, not aspect ratio
    img.addEventListener('load', () => {
      // Remove loading state and add loaded class for fade-in
      img.removeAttribute('data-loading');
      img.classList.add('loaded');
    });

    // Handle image load errors
    img.addEventListener('error', () => {
      img.removeAttribute('data-loading');
      console.error(`Failed to load image: ${imagePath}`);
    });

    article.appendChild(img);

    // Inquire button
    const inquireBtn = document.createElement('button');
    inquireBtn.className = 'artwork-card__inquire';
    inquireBtn.setAttribute('aria-label', `Inquire about ${sanitizeText(artwork.name)}`);
    inquireBtn.setAttribute('data-artwork-id', artworkId);
    inquireBtn.setAttribute('title', 'Inquire about this artwork');

    const inquireSvg = this.createSVG('0 0 24 24', ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']);
    inquireSvg.setAttribute('class', 'artwork-card__inquire-icon');
    inquireBtn.appendChild(inquireSvg);
    article.appendChild(inquireBtn);

    // Favorite button
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'artwork-card__favorite';
    favoriteBtn.setAttribute('aria-label', 'Add to favorites');
    favoriteBtn.setAttribute('data-artwork-id', artworkId);

    const favoriteSvg = this.createSVG('0 0 24 24', ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z']);
    favoriteSvg.setAttribute('class', 'artwork-card__favorite-icon');
    favoriteBtn.appendChild(favoriteSvg);
    article.appendChild(favoriteBtn);

    // Content div
    const content = document.createElement('div');
    content.className = 'artwork-card__content';

    // Title
    const title = document.createElement('h2');
    title.className = 'artwork-card__title';
    title.textContent = sanitizeText(artwork.name);
    content.appendChild(title);

    // Collection
    const collection = document.createElement('p');
    collection.className = 'artwork-card__collection';
    collection.textContent = sanitizeText(artwork.collection);
    content.appendChild(collection);

    // Description
    if (artwork.description) {
      const description = document.createElement('p');
      description.className = 'artwork-card__description';
      description.textContent = sanitizeText(artwork.description);
      content.appendChild(description);
    }

    // Price
    const price = document.createElement('p');
    price.className = 'artwork-card__price';
    price.textContent = artwork.price ? `$${artwork.price}` : 'Price on request';
    content.appendChild(price);

    article.appendChild(content);

    return article;
  }

  /**
   * Render all artworks to the gallery grid
   */
  renderGallery(containerSelector = '.bento-grid') {
    console.log('[GalleryData] Rendering gallery...');
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error('[GalleryData] Gallery container not found:', containerSelector);
      return;
    }

    console.log('[GalleryData] Container found, clearing and rendering', this.artworks.length, 'artworks');

    // Clear existing content (safe - no user input)
    container.innerHTML = '';

    // Separate artworks into available and sold
    const availableWorks = this.artworks.filter(art => !art.sold);
    const soldWorks = this.artworks.filter(art => art.sold);

    // Render available works section
    if (availableWorks.length > 0) {
      const availableLabel = this.createSectionLabel('Available Works');
      container.appendChild(availableLabel);

      availableWorks.forEach((artwork, index) => {
        const card = this.createArtworkCard(artwork, index);
        container.appendChild(card);
      });
    }

    // Add divider if both sections exist
    if (availableWorks.length > 0 && soldWorks.length > 0) {
      const divider = this.createSectionDivider('Collected Works');
      container.appendChild(divider);
    }

    // Render sold works section
    if (soldWorks.length > 0) {
      // Only add label if no divider was added (i.e., no available works)
      if (availableWorks.length === 0) {
        const soldLabel = this.createSectionLabel('Collected Works');
        container.appendChild(soldLabel);
      }

      soldWorks.forEach((artwork, index) => {
        const card = this.createArtworkCard(artwork, availableWorks.length + index);
        container.appendChild(card);
      });
    }

    console.log('[GalleryData] Gallery rendered successfully');

    // Dispatch custom event to notify other modules
    const event = new CustomEvent('galleryRendered', {
      detail: { count: this.artworks.length }
    });
    document.dispatchEvent(event);
  }

  /**
   * Create section label element
   */
  createSectionLabel(text) {
    const label = document.createElement('div');
    label.className = 'gallery-section-label';
    label.textContent = text;
    return label;
  }

  /**
   * Create section divider element
   */
  createSectionDivider(text) {
    const divider = document.createElement('div');
    divider.className = 'gallery-section-divider';

    const lineLeft = document.createElement('div');
    lineLeft.className = 'gallery-section-divider__line';

    const label = document.createElement('div');
    label.className = 'gallery-section-divider__label';
    label.textContent = text;

    const lineRight = document.createElement('div');
    lineRight.className = 'gallery-section-divider__line';

    divider.appendChild(lineLeft);
    divider.appendChild(label);
    divider.appendChild(lineRight);

    return divider;
  }

  /**
   * Create filter button element
   */
  createFilterButton(collection, isActive = false) {
    const button = document.createElement('button');
    const slug = this.collectionToSlug(collection);

    button.className = isActive ? 'tag tag-active' : 'tag';
    button.setAttribute('data-filter', slug);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    button.textContent = collection;

    return button;
  }

  /**
   * Create mobile filter chip element
   */
  createMobileFilterChip(collection, isActive = false) {
    const button = document.createElement('button');
    const slug = this.collectionToSlug(collection);

    button.className = isActive ? 'mobile-filter-chip mobile-filter-chip--active' : 'mobile-filter-chip';
    button.setAttribute('data-filter', slug);
    button.setAttribute('data-mobile-filter', '');
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    button.textContent = collection;

    return button;
  }

  /**
   * Render filter controls (desktop)
   */
  renderFilters(containerSelector = '.filter-controls') {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.warn('[GalleryData] Filter container not found:', containerSelector);
      return;
    }

    // Clear existing filters
    container.innerHTML = '';

    // Add "All" button
    const allButton = this.createFilterButton('All', true);
    allButton.setAttribute('data-filter', 'all');
    container.appendChild(allButton);

    // Add collection filters
    this.collections.forEach(collection => {
      const button = this.createFilterButton(collection);
      container.appendChild(button);
    });

    // Dispatch event
    const event = new CustomEvent('filtersRendered', {
      detail: { count: this.collections.length }
    });
    document.dispatchEvent(event);
  }

  /**
   * Render mobile filter dropdown
   */
  renderMobileFilters(containerSelector = '.mobile-filter-dropdown__content') {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error('Mobile filter container not found:', containerSelector);
      return;
    }

    // Clear existing filters
    container.innerHTML = '';

    // Add "All" button
    const allButton = this.createMobileFilterChip('All', true);
    allButton.setAttribute('data-filter', 'all');
    container.appendChild(allButton);

    // Add collection filters
    this.collections.forEach(collection => {
      const button = this.createMobileFilterChip(collection);
      container.appendChild(button);
    });
  }

  /**
   * Initialize gallery - load and render everything
   */
  async init() {
    try {
      // Show loading state
      const container = document.querySelector('.bento-grid');
      if (container) {
        const loadingMsg = document.createElement('p');
        loadingMsg.className = 'gallery-loading';
        loadingMsg.textContent = 'Loading artworks...';
        container.innerHTML = '';
        container.appendChild(loadingMsg);
      }

      // Load data
      await this.loadArtworks();

      // Render everything
      this.renderFilters();
      this.renderMobileFilters();
      this.renderGallery();

      return true;
    } catch (error) {
      console.error('Failed to initialize gallery:', error);

      // Show error state
      const container = document.querySelector('.bento-grid');
      if (container) {
        const errorMsg = document.createElement('p');
        errorMsg.className = 'gallery-error';
        errorMsg.textContent = 'Failed to load artworks. Please refresh the page.';
        container.innerHTML = '';
        container.appendChild(errorMsg);
      }

      return false;
    }
  }
}
