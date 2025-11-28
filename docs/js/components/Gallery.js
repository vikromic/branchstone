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

    this.init();
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
   * @private
   * @param {Array} artworks - Artworks to render
   */
  render(artworks) {
    const items = artworks.map((artwork, index) => {
      return this.type === 'featured'
        ? this.createFeaturedItem(artwork, index)
        : this.createGalleryItem(artwork);
    });

    items.forEach(item => this.container.appendChild(item));
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

    const imgAttributes = {
      src: artwork.image,
      alt: artwork.title,
      loading: index < CONFIG.ui.gallery.lazyLoadThreshold ? 'eager' : 'lazy',
    };

    // Add srcset if available, otherwise add placeholder for future optimization
    if (artwork.srcset) {
      imgAttributes.srcset = artwork.srcset;
      imgAttributes.sizes = artwork.sizes || '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    } else {
      // TODO: Generate multiple image sizes (400w, 800w, 1200w) for optimal responsive loading
      // When available, add srcset like: "img/artwork-400.jpg 400w, img/artwork-800.jpg 800w, img/artwork.jpg 1200w"
      imgAttributes.sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }

    const img = createElement('img', imgAttributes);

    const info = createElement('div', { className: 'featured-item-info' }, [
      createElement('h3', {}, artwork.title),
      createElement('p', {}, artwork.size),
    ]);

    item.appendChild(img);
    item.appendChild(info);
    wrapper.appendChild(item);

    return wrapper;
  }

  /**
   * Create gallery item
   * @private
   * @param {Object} artwork - Artwork data
   * @returns {Element} Gallery item element
   */
  createGalleryItem(artwork) {
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
        ...(artwork.images && artwork.images.length > 0 && {
          images: JSON.stringify(artwork.images),
        }),
      },
    });

    const imgAttributes = {
      src: artwork.image,
      alt: artwork.title,
      loading: 'lazy', // Gallery items are below the fold
    };

    // Add srcset if available, otherwise add placeholder for future optimization
    if (artwork.srcset) {
      imgAttributes.srcset = artwork.srcset;
      imgAttributes.sizes = artwork.sizes || '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    } else {
      // TODO: Generate multiple image sizes (400w, 800w, 1200w) for optimal responsive loading
      imgAttributes.sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }

    const img = createElement('img', imgAttributes);

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

    // Keyboard support
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });

    item.appendChild(img);
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

    // Add 8 skeleton items
    const skeletonCount = 8;
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
