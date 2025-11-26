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
      this.render(artworks);
      if (this.onLoadCallback) {
        this.onLoadCallback();
      }
    } catch (error) {
      this.renderError();
    }
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

    const img = createElement('img', {
      src: artwork.image,
      alt: artwork.title,
      loading: index < CONFIG.ui.gallery.lazyLoadThreshold ? 'eager' : 'lazy',
    });

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
        ...(artwork.images && artwork.images.length > 0 && {
          images: JSON.stringify(artwork.images),
        }),
      },
    });

    const img = createElement('img', {
      src: artwork.image,
      alt: artwork.title,
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
      ? 'Unable to load artworks. Please refresh the page.'
      : 'Unable to load gallery. Please refresh the page.';

    const errorElement = createElement('p', {
      style: 'text-align: center; padding: 4rem 2rem;',
    }, message);

    this.container.innerHTML = '';
    this.container.appendChild(errorElement);
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
    await this.init();
  }
}

export default Gallery;
