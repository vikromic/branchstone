/**
 * Gallery Data Management
 * Handles loading and rendering artwork data from JSON
 *
 * TODO [REFACTOR]: This class violates SRP (Single Responsibility Principle).
 * It currently handles 5 distinct responsibilities:
 * 1. Data loading (loadArtworks, loadCollectionsMetadata)
 * 2. Domain logic (extractCollections, sortArtworks, getSizeClass)
 * 3. Rendering (createArtworkCard, renderGallery, renderFilters)
 * 4. String manipulation (collectionToSlug, slugToCollection, parseAspectRatio)
 * 5. Orchestration (init method)
 *
 * Suggested refactoring (future Phase 3):
 * - Extract ArtworkDataService for data loading
 * - Extract CollectionService for collection-related logic
 * - Extract ArtworkCardRenderer for card creation
 * - Extract GalleryRenderer for gallery/filter rendering
 * - Keep GalleryDataManager as thin orchestration layer
 */

import { sanitizeText } from './security.js';
import { GALLERY, SVG_NAMESPACE, ARTWORK_CARD } from './constants.js';

export class GalleryDataManager {
  constructor() {
    this.artworks = [];
    this.collections = [];
    this.collectionsMetadata = new Map(); // Map: collection name -> { name, description }
  }

  /**
   * Load artworks from JSON file
   */
  async loadArtworks() {
    try {
      console.log('[GalleryData] Fetching artworks.json...');
        const response = await fetch('./json_data/artworks.json');
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
   * Load collections metadata from JSON file
   */
  async loadCollectionsMetadata() {
    try {
      console.log('[GalleryData] Fetching collections metadata...');
      const response = await fetch('./json_data/collections.json');
      if (!response.ok) {
        console.warn('[GalleryData] Collections metadata not found, using defaults');
        return;
      }
      const data = await response.json();
      if (data.collections && Array.isArray(data.collections)) {
        data.collections.forEach(collection => {
          this.collectionsMetadata.set(collection.name, {
            name: collection.name,
            description: collection.description || ''
          });
        });
        console.log('[GalleryData] Collections metadata loaded:', this.collectionsMetadata.size, 'collections');
      }
    } catch (error) {
      console.warn('[GalleryData] Error loading collections metadata:', error);
      // Non-critical failure - continue without metadata
    }
  }

  /**
   * Get collection metadata by name
   */
  getCollectionMetadata(collectionName) {
    return this.collectionsMetadata.get(collectionName) || {
      name: collectionName,
      description: ''
    };
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
   * Convert slug back to collection name
   * Finds the collection whose slug matches the given slug
   */
  slugToCollection(slug) {
    if (!slug || slug === 'all') return 'all';

    // Find the collection that matches this slug
    const collection = this.collections.find(c => this.collectionToSlug(c) === slug);
    return collection || slug; // Return slug as fallback if no match found
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
   * Build full image paths from main_image and images array
   * @param {Object} artwork - The artwork object
   * @returns {Array<string>} Array of full image paths
   */
  buildImagePaths(artwork) {
    if (!artwork.main_image || typeof artwork.main_image !== 'string') {
      return [];
    }

    // Extract directory from main_image
    const lastSlash = artwork.main_image.lastIndexOf('/');
    const directory = artwork.main_image.substring(0, lastSlash);

    // Build array: [main_image, ...additional images]
    const allImages = [artwork.main_image];

    if (artwork.images && Array.isArray(artwork.images)) {
      artwork.images.forEach(filename => {
        allImages.push(`${directory}/${filename}`);
      });
    }

    return allImages;
  }

  /**
   * Parse dimensions string and calculate aspect ratio
   * Supports formats like "20 x 16 in", "16 x 20 in", etc.
   * Returns width/height ratio or null if parsing fails
   *
   * @param {string} dimensionsString - The dimensions string to parse
   * @returns {number|null} The aspect ratio (width/height) or null if invalid
   */
  parseAspectRatio(dimensionsString) {
    // Input validation: check for null, undefined, non-string types
    if (!dimensionsString || typeof dimensionsString !== 'string') {
      return null;
    }

    // Trim and validate non-empty
    const trimmed = dimensionsString.trim();
    if (trimmed.length === 0) {
      return null;
    }

    // Match patterns like "20 x 16 in" or "20x16"
    const match = trimmed.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/i);

    if (!match) {
      return null;
    }

    const width = parseFloat(match[1]);
    const height = parseFloat(match[2]);

    // Comprehensive validation: NaN, zero, negative, infinity
    if (isNaN(width) || isNaN(height) ||
        width <= 0 || height <= 0 ||
        !isFinite(width) || !isFinite(height)) {
      return null;
    }

    // Calculate ratio and clamp to reasonable bounds (0.1 to 10)
    // Prevents extreme aspect ratios from breaking layout
    const ratio = width / height;
    return Math.max(0.1, Math.min(10, ratio));
  }


  /**
   * Create SVG element using namespace
   *
   * @param {string} viewBox - SVG viewBox attribute
   * @param {string[]} paths - Array of path data strings
   * @returns {SVGElement} The created SVG element
   */
  createSVG(viewBox, paths) {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', ARTWORK_CARD.SVG_STROKE_WIDTH);
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    paths.forEach(pathData => {
      const path = document.createElementNS(SVG_NAMESPACE, 'path');
      path.setAttribute('d', pathData);
      svg.appendChild(path);
    });

    return svg;
  }

  /**
   * Calculate and apply aspect ratio to artwork card
   *
   * @param {HTMLElement} article - The article element
   * @param {Object} artwork - The artwork data
   * @param {string} sizeClass - The size class (small, medium, large)
   */
  applyAspectRatio(article, artwork, sizeClass) {
    const aspectRatio = this.parseAspectRatio(artwork.dimensions);
    if (aspectRatio !== null) {
      // Apply dynamic aspect ratio from actual artwork dimensions
      article.style.aspectRatio = aspectRatio.toString();
    } else {
      // Fallback: use default aspect ratio based on size
      const fallbackRatio = (sizeClass === 'medium')
        ? GALLERY.DEFAULT_ASPECT_RATIO_MEDIUM
        : GALLERY.DEFAULT_ASPECT_RATIO_OTHER;
      article.style.aspectRatio = fallbackRatio.toString();
    }
  }

  /**
   * Create and attach badges (sold, highlighted) to artwork card
   *
   * @param {HTMLElement} article - The article element
   * @param {Object} artwork - The artwork data
   */
  createBadges(article, artwork) {
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
  }

  /**
   * Create main image element for artwork card
   *
   * @param {Object} artwork - The artwork data
   * @returns {HTMLImageElement} The image element
   */
  createArtworkImage(artwork) {
    const img = document.createElement('img');
    const imagePath = artwork.main_image.startsWith('img/')
      ? artwork.main_image
      : `img/${artwork.main_image}`;

    img.src = imagePath;
    img.alt = sanitizeText(artwork.name);
    img.className = 'artwork-card__image';
    img.loading = ARTWORK_CARD.IMAGE_LOADING;

    // Set loading state
    img.setAttribute('data-loading', '');

    // Load handler - size is driven by data-size attribute
    img.addEventListener('load', () => {
      img.removeAttribute('data-loading');
      img.classList.add('loaded');
    });

    // Error handler
    img.addEventListener('error', () => {
      img.removeAttribute('data-loading');
      console.error(`Failed to load image: ${imagePath}`);
    });

    return img;
  }

  /**
   * Create action buttons (inquire, favorite) for artwork card
   *
   * @param {string} artworkId - The unique artwork ID
   * @param {string} artworkName - The artwork name (for accessibility)
   * @returns {Object} Object containing inquire and favorite button elements
   */
  createActionButtons(artworkId, artworkName) {
    // Inquire button
    const inquireBtn = document.createElement('button');
    inquireBtn.className = 'artwork-card__inquire';
    inquireBtn.setAttribute('aria-label', `Inquire about ${sanitizeText(artworkName)}`);
    inquireBtn.setAttribute('data-artwork-id', artworkId);
    inquireBtn.setAttribute('title', 'Inquire about this artwork');

    const inquireSvg = this.createSVG(ARTWORK_CARD.SVG_VIEWBOX_DEFAULT,
      ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']);
    inquireSvg.setAttribute('class', 'artwork-card__inquire-icon');
    inquireBtn.appendChild(inquireSvg);

    // Favorite button
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'artwork-card__favorite';
    favoriteBtn.setAttribute('aria-label', 'Add to favorites');
    favoriteBtn.setAttribute('data-artwork-id', artworkId);

    const favoriteSvg = this.createSVG(ARTWORK_CARD.SVG_VIEWBOX_DEFAULT,
      ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z']);
    favoriteSvg.setAttribute('class', 'artwork-card__favorite-icon');
    favoriteBtn.appendChild(favoriteSvg);

    return { inquireBtn, favoriteBtn };
  }

  /**
   * Create content section (title, collection, description, price) for artwork card
   *
   * @param {Object} artwork - The artwork data
   * @returns {HTMLDivElement} The content div element
   */
  createCardContent(artwork) {
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

    return content;
  }

  /**
   * Create artwork card HTML element using safe DOM methods
   *
   * @param {Object} artwork - The artwork data object
   * @param {number} index - The index in the artworks array
   * @returns {HTMLElement} The created article element
   */
  createArtworkCard(artwork, index) {
    const article = document.createElement('article');
    const sizeClass = this.getSizeClass(artwork);
    const collectionSlug = this.collectionToSlug(artwork.collection);
    const artworkId = `artwork-${this.collectionToSlug(artwork.name)}`;

    // Set article class and attributes
    article.className = 'artwork-card';
    if (artwork.sold) {
      article.classList.add('artwork-card--sold');
    }

    article.setAttribute('data-size', sizeClass);
    article.setAttribute('data-collection', collectionSlug);
    if (artwork.prints) {
      article.setAttribute('data-prints-available', 'true');
    }
    if (artwork.dimensions) {
      article.setAttribute('data-dimensions', artwork.dimensions);
    }
    if (artwork.materials) {
      article.setAttribute('data-materials', artwork.materials);
    }
    if (artwork.year) {
      article.setAttribute('data-year', artwork.year);
    }

    // Store all image paths for modal carousel
    if (artwork.main_image) {
      const allImagePaths = this.buildImagePaths(artwork);
      if (allImagePaths.length > 0) {
        article.setAttribute('data-images', JSON.stringify(allImagePaths));
      }
    }

    // Apply aspect ratio (extracted method)
    this.applyAspectRatio(article, artwork, sizeClass);

    // Create and append badges (extracted method)
    this.createBadges(article, artwork);

    // Create and append main image (extracted method)
    const img = this.createArtworkImage(artwork);
    article.appendChild(img);

    // Create and append action buttons (extracted method)
    const { inquireBtn, favoriteBtn } = this.createActionButtons(artworkId, artwork.name);
    article.appendChild(inquireBtn);
    article.appendChild(favoriteBtn);

    // Create and append content section (extracted method)
    const content = this.createCardContent(artwork);
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

    button.className = isActive ? 'tag is-active' : 'tag';
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
      await this.loadCollectionsMetadata();
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
