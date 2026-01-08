/**
 * Masonry Layout Module
 * Implements efficient masonry-style grid packing for the gallery
 * Falls back from CSS Grid Masonry when not supported
 */

export class MasonryLayout {
  constructor(containerSelector = '.bento-grid', options = {}) {
    this.container = document.querySelector(containerSelector);
    this.options = {
      columnGap: 20,
      rowGap: 16,
      minColumnWidth: 250,
      enableResize: true,
      transitionDuration: 300,
      ...options
    };

    this.items = [];
    this.columns = 1;
    this.columnHeights = [];
    this.resizeTimeout = null;
    this.isNativeMasonrySupported = this.checkNativeMasonrySupport();
  }

  /**
   * Check if browser supports CSS Grid Masonry
   */
  checkNativeMasonrySupport() {
    if (typeof CSS === 'undefined' || !CSS.supports) {
      return false;
    }
    return CSS.supports('grid-template-rows', 'masonry');
  }

  /**
   * Initialize masonry layout
   */
  async init() {
    if (!this.container) {
      console.warn('[Masonry] Container not found');
      return false;
    }

    // If native masonry is supported, no JS layout needed
    if (this.isNativeMasonrySupported) {
      console.log('[Masonry] Using native CSS Grid Masonry');
      return true;
    }

    console.log('[Masonry] Initializing JavaScript masonry layout');

    // Wait for images to load before calculating layout
    await this.waitForImages();

    // Calculate and apply layout
    this.calculateLayout();
    this.applyLayout();

    // Setup resize observer
    if (this.options.enableResize) {
      this.setupResizeObserver();
    }

    return true;
  }

  /**
   * Wait for all images in the grid to load
   */
  waitForImages() {
    return new Promise((resolve) => {
      const images = this.container.querySelectorAll('img');
      if (images.length === 0) {
        resolve();
        return;
      }

      let loadedCount = 0;
      const totalImages = images.length;

      const imageLoaded = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
      };

      images.forEach(img => {
        if (img.complete) {
          imageLoaded();
        } else {
          img.addEventListener('load', imageLoaded);
          img.addEventListener('error', imageLoaded); // Count errors too
        }
      });

      // Timeout fallback
      setTimeout(() => {
        if (loadedCount < totalImages) {
          console.warn('[Masonry] Image loading timeout, proceeding anyway');
          resolve();
        }
      }, 5000);
    });
  }

  /**
   * Calculate number of columns based on container width
   */
  calculateColumns() {
    const containerWidth = this.container.offsetWidth;
    const { minColumnWidth, columnGap } = this.options;

    // Calculate optimal number of columns
    let cols = Math.floor((containerWidth + columnGap) / (minColumnWidth + columnGap));
    cols = Math.max(1, Math.min(cols, 4)); // Between 1 and 4 columns

    // Match breakpoints from CSS
    if (containerWidth < 640) {
      cols = 1;
    } else if (containerWidth >= 640 && containerWidth < 768) {
      cols = 2;
    } else if (containerWidth >= 768 && containerWidth < 1024) {
      cols = 3;
    } else {
      cols = 4;
    }

    return cols;
  }

  /**
   * Calculate column width based on container and column count
   */
  calculateColumnWidth(columns) {
    const containerWidth = this.container.offsetWidth;
    const totalGap = this.options.columnGap * (columns - 1);
    return (containerWidth - totalGap) / columns;
  }

  /**
   * Get all artwork cards (excluding labels and dividers)
   */
  getArtworkCards() {
    // Only get artwork cards, not section labels or dividers
    return Array.from(this.container.querySelectorAll('.artwork-card'));
  }

  /**
   * Get section dividers and labels that should stay in flow
   */
  getSectionElements() {
    return Array.from(this.container.querySelectorAll('.gallery-section-label, .gallery-section-divider'));
  }

  /**
   * Calculate layout positions for all items
   */
  calculateLayout() {
    this.items = this.getArtworkCards();
    if (this.items.length === 0) {
      return;
    }

    this.columns = this.calculateColumns();
    this.columnWidth = this.calculateColumnWidth(this.columns);

    // Initialize column heights
    this.columnHeights = new Array(this.columns).fill(0);

    // Calculate position for each item
    this.items.forEach((item, index) => {
      const position = this.calculateItemPosition(item, index);
      item.dataset.masonryPosition = JSON.stringify(position);
    });

    // Set container height
    const maxHeight = Math.max(...this.columnHeights);
    this.container.style.height = `${maxHeight}px`;
  }

  /**
   * Calculate position for a single item
   */
  calculateItemPosition(item, index) {
    // Find shortest column
    const shortestColumn = this.columnHeights.indexOf(Math.min(...this.columnHeights));

    // Calculate position
    const x = shortestColumn * (this.columnWidth + this.options.columnGap);
    const y = this.columnHeights[shortestColumn];

    // Get item height (including content, padding, etc)
    const itemHeight = item.offsetHeight;

    // Update column height
    this.columnHeights[shortestColumn] += itemHeight + this.options.rowGap;

    return { x, y, width: this.columnWidth };
  }

  /**
   * Apply calculated layout to DOM
   */
  applyLayout() {
    // Add masonry class to container
    this.container.classList.add('bento-grid--masonry-js');

    // Set CSS custom properties
    this.container.style.setProperty('--grid-columns', this.columns);
    this.container.style.setProperty('--space-4', `${this.options.columnGap}px`);

    // Position each item
    this.items.forEach(item => {
      const positionData = item.dataset.masonryPosition;
      if (!positionData) return;

      const { x, y, width } = JSON.parse(positionData);

      // Apply position using transform for better performance
      item.style.width = `${width}px`;
      item.style.transform = `translate(${x}px, ${y}px)`;
      item.style.opacity = '1';
    });
  }

  /**
   * Setup resize observer to recalculate layout on window resize
   */
  setupResizeObserver() {
    const handleResize = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.recalculate();
      }, 150); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);

    // Store reference for cleanup
    this.handleResize = handleResize;
  }

  /**
   * Recalculate and reapply layout
   */
  recalculate() {
    const newColumns = this.calculateColumns();

    // Only recalculate if column count changed
    if (newColumns !== this.columns) {
      console.log('[Masonry] Recalculating layout:', newColumns, 'columns');
      this.calculateLayout();
      this.applyLayout();
    }
  }

  /**
   * Refresh layout (useful after filtering or adding items)
   */
  refresh() {
    if (this.isNativeMasonrySupported) {
      return; // Native masonry handles this automatically
    }

    console.log('[Masonry] Refreshing layout');
    this.waitForImages().then(() => {
      this.calculateLayout();
      this.applyLayout();
    });
  }

  /**
   * Destroy masonry layout and cleanup
   */
  destroy() {
    if (!this.container) return;

    // Remove event listeners
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }

    // Remove masonry class and styles
    this.container.classList.remove('bento-grid--masonry-js');
    this.container.style.height = '';

    // Reset item styles
    this.items.forEach(item => {
      item.style.width = '';
      item.style.transform = '';
      item.style.opacity = '';
      delete item.dataset.masonryPosition;
    });

    console.log('[Masonry] Destroyed');
  }
}

/**
 * Auto-initialize masonry on gallery pages
 */
export function initGalleryMasonry() {
  // Only initialize on pages with gallery grid
  const galleryContainer = document.querySelector('.bento-grid');
  if (!galleryContainer) {
    return null;
  }

  const masonry = new MasonryLayout('.bento-grid', {
    columnGap: 20,
    rowGap: 16,
    minColumnWidth: 250,
    enableResize: true
  });

  // Wait for gallery to be rendered, then initialize
  document.addEventListener('galleryRendered', () => {
    console.log('[Masonry] Gallery rendered, initializing masonry');
    masonry.init();
  });

  return masonry;
}
