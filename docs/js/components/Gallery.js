/**
 * Gallery Component
 * Manages artwork gallery loading and display
 * @module components/Gallery
 */

import { $, createElement, setAttributes } from '../utils/dom.js';
import { artworksAPI } from '../services/api.js';
import CONFIG from '../config.js';

export class Gallery {
  /**
   * @param {Object} options - Gallery options
   * @param {string} options.containerSelector - Gallery container selector
   * @param {string} options.type - Gallery type ('featured' or 'full')
   * @param {Function} options.onLoad - Callback after loading
   */
  constructor(options = {}) {
    this.container = $(options.containerSelector);
    this.type = options.type || 'full';
    this.onLoadCallback = options.onLoad;

    if (!this.container) return;

    // Setup delegated keyboard handler once
    this.setupKeyboardNavigation();
    this.init();
  }

  /**
   * Setup delegated keyboard navigation for gallery items
   * Single listener on container instead of per-item listeners
   * @private
   */
  setupKeyboardNavigation() {
    this.container.addEventListener('keydown', (e) => {
      const item = e.target.closest('.gallery-item');
      if (!item) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  }

  /**
   * Initialize gallery
   * @private
   */
  async init() {
    try {
      const artworks = await this.fetchArtworks();
      this.hideSkeletons();
      this.render(artworks);
      this.markGalleryLoaded();
      if (this.onLoadCallback) {
        this.onLoadCallback();
      }
    } catch (error) {
      this.hideSkeletons();
      this.renderError();
    }
  }

  /**
   * Hide skeleton loading placeholders
   * @private
   */
  hideSkeletons() {
    const skeletons = this.container.querySelectorAll('.skeleton-item');
    skeletons.forEach(skeleton => {
      skeleton.remove();
    });
  }

  /**
   * Mark gallery as loaded
   * @private
   */
  markGalleryLoaded() {
    this.container.classList.add('gallery-loaded');
  }

  /**
   * Fetch artworks based on gallery type
   * @private
   * @returns {Promise<Array>} Artworks array
   */
  async fetchArtworks() {
    if (this.type === 'featured') {
      return artworksAPI.getFeatured();
    }
    return artworksAPI.getAll();
  }

  /**
   * Render gallery items
   * Uses DocumentFragment for batched DOM insertion (single reflow)
   * @private
   * @param {Array} artworks - Artworks to render
   */
  render(artworks) {
    const fragment = document.createDocumentFragment();

    artworks.forEach((artwork, index) => {
      const item = this.type === 'featured'
        ? this.createFeaturedItem(artwork, index)
        : this.createGalleryItem(artwork, index);
      fragment.appendChild(item);
    });

    // Single DOM operation instead of N operations
    this.container.appendChild(fragment);
  }

  /**
   * Create responsive picture element with WebP and JPEG fallback
   * @private
   * @param {Object} artwork - Artwork data
   * @param {Object} options - Picture options
   * @param {string} options.loading - Loading attribute (lazy/eager)
   * @param {string} options.sizes - Sizes attribute for responsive images
   * @param {boolean} options.useThumbnail - Use thumbnail for src (grid view)
   * @returns {Element} Picture element
   */
  createResponsivePicture(artwork, options = {}) {
    const {
      loading = 'lazy',
      sizes = '(max-width: 768px) 100vw, 50vw',
      useThumbnail = false,
      priority = false // fetchpriority="high" for above-fold images
    } = options;

    const picture = createElement('picture');

    // Helper: convert JPEG path to WebP path
    const toWebP = (jpegPath) => jpegPath.replace(/\.(jpg|jpeg)$/i, '.webp');

    // Final fallback img element source
    // Use thumbnail for grid view, full image for featured/lightbox
    const imgSrc = useThumbnail ? (artwork.thumb || artwork.image) : artwork.image;

    // WebP source (preferred format) - auto-generate from JPEG if not provided
    if (artwork.srcset?.webp) {
      const webpSource = createElement('source', {
        type: 'image/webp',
        srcset: artwork.srcset.webp,
        sizes,
      });
      picture.appendChild(webpSource);
    } else if (imgSrc && /\.(jpg|jpeg)$/i.test(imgSrc)) {
      // Auto-generate WebP source from JPEG path
      const webpSource = createElement('source', {
        type: 'image/webp',
        srcset: toWebP(imgSrc),
      });
      picture.appendChild(webpSource);
    }

    // JPEG source (fallback for browsers without WebP support)
    if (artwork.srcset?.jpeg) {
      const jpegSource = createElement('source', {
        type: 'image/jpeg',
        srcset: artwork.srcset.jpeg,
        sizes,
      });
      picture.appendChild(jpegSource);
    }

    const imgAttributes = {
      src: imgSrc,
      alt: artwork.title,
      loading,
      decoding: 'async', // Don't block main thread
      // Explicit dimensions prevent CLS (Cumulative Layout Shift)
      width: artwork.width || 400,
      height: artwork.height || 500,
    };

    // Prioritize above-fold images
    if (priority) {
      imgAttributes.fetchpriority = 'high';
    }

    // Add srcset to img as additional fallback if no separate sources provided
    if (artwork.srcset?.jpeg && !useThumbnail) {
      imgAttributes.srcset = artwork.srcset.jpeg;
      imgAttributes.sizes = sizes;
    } else if (artwork.srcset && typeof artwork.srcset === 'string') {
      // Backwards compatibility: if srcset is a string (old format)
      imgAttributes.srcset = artwork.srcset;
      imgAttributes.sizes = sizes;
    }

    const img = createElement('img', imgAttributes);

    // LQIP (Low-Quality Image Placeholder) support
    // If base64 placeholder exists, show it first with blur effect
    if (artwork.lqip) {
      // Set initial blurred placeholder
      img.classList.add('lqip-loading');
      img.src = artwork.lqip;

      // Load full-quality image in background
      const fullImg = new Image();
      fullImg.onload = () => {
        // Replace with full image and trigger fade-in transition
        img.src = fullImg.src;
        img.classList.remove('lqip-loading');
        img.classList.add('lqip-loaded');

        // Clean up class after transition completes
        setTimeout(() => {
          img.classList.remove('lqip-loaded');
        }, 500);
      };

      // Set full image source based on options
      fullImg.src = imgSrc;

      // If image has srcset, use it for responsive loading
      if (imgAttributes.srcset) {
        fullImg.srcset = imgAttributes.srcset;
        fullImg.sizes = sizes;
      }
    }

    picture.appendChild(img);

    return picture;
  }

  /**
   * Create featured gallery item
   * @private
   * @param {Object} artwork - Artwork data
   * @param {number} index - Item index
   * @returns {Element} Featured item element
   */
  createFeaturedItem(artwork, index) {
    const wrapper = createElement('div', {
      className: 'carousel-item',
    });

    const item = createElement('a', {
      href: 'gallery.html',
      className: 'featured-item animate-on-scroll',
      'aria-label': `View ${artwork.title} in gallery`,
    });

    // Use picture element for responsive images with WebP support
    const picture = this.createResponsivePicture(artwork, {
      loading: index < CONFIG.ui.gallery.lazyLoadThreshold ? 'eager' : 'lazy',
      sizes: artwork.sizes || '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    });

    const info = createElement('div', { className: 'featured-item-info' }, [
      createElement('h3', {}, artwork.title),
      createElement('p', {}, artwork.size),
    ]);

    item.appendChild(picture);
    item.appendChild(info);
    wrapper.appendChild(item);

    return wrapper;
  }

  /**
   * Create gallery item
   * @private
   * @param {Object} artwork - Artwork data
   * @param {number} index - Item index for priority loading
   * @returns {Element} Gallery item element
   */
  createGalleryItem(artwork, index = 0) {
    const item = createElement('div', {
      className: `gallery-item ${artwork.layout || ''} animate-on-scroll`,
      role: 'button',
      tabindex: '0',
      'aria-label': `View ${artwork.title}, ${artwork.size}`,
      dataset: {
        title: artwork.title,
        size: artwork.size,
        materials: artwork.materials,
        description: artwork.description,
        img: artwork.image,
        available: artwork.available.toString(),
        category: artwork.category || 'uncategorized',
        ...(artwork.price && { price: artwork.price }),
        ...(artwork.images && artwork.images.length > 0 && {
          images: JSON.stringify(artwork.images),
        }),
      },
    });

    // Above fold: 8 on desktop (4×2 grid), 4 on mobile (2×2 grid)
    const aboveFoldCount = window.innerWidth >= 768 ? 8 : 4;
    const isAboveFold = index < aboveFoldCount;
    const picture = this.createResponsivePicture(artwork, {
      loading: isAboveFold ? 'eager' : 'lazy',
      sizes: artwork.sizes || '(max-width: 768px) 50vw, 25vw',
      useThumbnail: true,
      priority: isAboveFold,
    });

    const soldDot = !artwork.available
      ? createElement('span', {
          className: 'sold-dot',
          'aria-label': 'Sold',
        })
      : null;

    const title = createElement('h3', {});
    title.textContent = artwork.title + ' ';
    if (soldDot) {
      title.appendChild(soldDot);
    }

    const size = createElement('p', {}, artwork.size);

    const info = createElement('div', { className: 'gallery-item-info' }, [title, size]);

    // Keyboard support handled via event delegation in setupKeyboardNavigation()

    item.appendChild(picture);
    item.appendChild(info);

    return item;
  }

  /**
   * Render error message
   * @private
   */
  renderError() {
    const message = this.type === 'featured'
      ? 'Unable to load artworks. Please try again.'
      : 'Unable to load gallery. Please try again.';

    const errorContainer = createElement('div', {
      className: 'gallery-error',
    });

    const errorText = createElement('p', {}, message);

    const retryButton = createElement('button', {}, 'Retry');
    retryButton.addEventListener('click', () => {
      this.reload();
    });

    errorContainer.appendChild(errorText);
    errorContainer.appendChild(retryButton);

    this.container.innerHTML = '';
    this.container.appendChild(errorContainer);
  }

  /**
   * Clear gallery
   */
  clear() {
    this.container.innerHTML = '';
  }

  /**
   * Reload gallery
   */
  async reload() {
    this.clear();
    this.showSkeletons();
    await this.init();
  }

  /**
   * Show skeleton loading placeholders
   * @private
   */
  showSkeletons() {
    // Remove gallery-loaded class to show skeletons
    this.container.classList.remove('gallery-loaded');

    // Add 4 skeleton items (reduced from 8 for better performance)
    const skeletonCount = 4;
    for (let i = 0; i < skeletonCount; i++) {
      const skeletonItem = createElement('div', {
        className: 'skeleton-item',
        'aria-hidden': 'true',
      });

      const skeletonImage = createElement('div', {
        className: 'skeleton-image',
      });

      const skeletonInfo = createElement('div', {
        className: 'skeleton-info',
      });

      const skeletonTitle = createElement('div', {
        className: 'skeleton-title',
      });

      const skeletonSubtitle = createElement('div', {
        className: 'skeleton-subtitle',
      });

      skeletonInfo.appendChild(skeletonTitle);
      skeletonInfo.appendChild(skeletonSubtitle);
      skeletonItem.appendChild(skeletonImage);
      skeletonItem.appendChild(skeletonInfo);

      this.container.appendChild(skeletonItem);
    }
  }
}

export default Gallery;
