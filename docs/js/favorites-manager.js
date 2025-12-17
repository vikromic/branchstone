/**
 * FavoritesManager - Favorites system functionality
 * Handles adding/removing favorites, persistence, and UI updates
 */

import { STORAGE_KEYS } from './constants.js';
import * as storage from './storage.js';

export class FavoritesManager {
  constructor() {
    this.storageKey = STORAGE_KEYS.FAVORITES;
    this.toastContainer = null;
  }

  /**
   * Initialize the favorites system
   */
  init() {
    this._createToastContainer();
    this._initializeFavoriteButtons();
    this._cleanupOrphanedFavorites();
    this._updateFavoritesCount();
  }

  /**
   * Get favorites from localStorage
   * @returns {Array<string>} Array of favorite artwork IDs
   */
  getFavorites() {
    return storage.getItem(this.storageKey) || [];
  }

  /**
   * Clean up orphaned favorites (IDs that don't exist in DOM)
   * @private
   * @returns {Array<string>} Valid favorites
   */
  _cleanupOrphanedFavorites() {
    const favorites = this.getFavorites();
    const validFavorites = favorites.filter(id => {
      return document.querySelector(`[data-artwork-id="${id}"]`) !== null;
    });

    if (validFavorites.length !== favorites.length) {
      this._saveFavorites(validFavorites);
      return validFavorites;
    }

    return favorites;
  }

  /**
   * Save favorites to localStorage
   * @private
   * @param {Array<string>} favorites - Array of favorite artwork IDs
   */
  _saveFavorites(favorites) {
    storage.setItem(this.storageKey, favorites);
    this._updateFavoritesCount(favorites.length);
  }

  /**
   * Toggle favorite status
   * @param {string} artworkId - Artwork ID to toggle
   * @returns {boolean} True if now favorited, false if unfavorited
   */
  toggleFavorite(artworkId) {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(artworkId);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(artworkId);
    }

    this._saveFavorites(favorites);
    return index === -1; // Returns true if now favorited
  }

  /**
   * Update UI count with animation
   * @private
   * @param {number} [count] - Favorites count (optional, will be calculated if not provided)
   */
  _updateFavoritesCount(count) {
    if (count === undefined) {
      const favorites = this.getFavorites();
      count = favorites.length;
    }

    const countEl = document.querySelector('.header__favorites-count');
    if (countEl) {
      const oldCount = parseInt(countEl.textContent) || 0;
      countEl.textContent = count;
      countEl.classList.toggle('has-items', count > 0);

      // Pulse animation when count changes
      if (oldCount !== count && count > 0) {
        countEl.classList.remove('pulse');
        void countEl.offsetWidth; // Force reflow
        countEl.classList.add('pulse');

        setTimeout(() => {
          countEl.classList.remove('pulse');
        }, 300);
      }
    }
  }

  /**
   * Initialize favorite buttons
   * @private
   */
  _initializeFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.artwork-card__favorite');
    const favorites = this.getFavorites();

    favoriteButtons.forEach(btn => {
      const artworkId = btn.dataset.artworkId;

      // Set initial state
      if (favorites.includes(artworkId)) {
        btn.classList.add('is-favorited');
        btn.setAttribute('aria-label', 'Remove from favorites');
      }

      // Handle click
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isFavorited = this.toggleFavorite(artworkId);
        btn.classList.toggle('is-favorited', isFavorited);
        btn.setAttribute('aria-label', isFavorited ? 'Remove from favorites' : 'Add to favorites');

        // Show toast notification
        const message = isFavorited ? 'Added to favorites' : 'Removed from favorites';
        this._showToast(message);
      });
    });
  }

  /**
   * Create toast container for notifications
   * @private
   */
  _createToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    this.toastContainer = container;
  }

  /**
   * Show toast notification - Safe DOM creation
   * @private
   * @param {string} message - Message to display
   * @param {number} [duration=2000] - Display duration in milliseconds
   */
  _showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');

    // Create SVG icon using namespace-aware methods
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('toast__icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const path1 = document.createElementNS(svgNS, 'path');
    path1.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14');
    svg.appendChild(path1);

    const polyline = document.createElementNS(svgNS, 'polyline');
    polyline.setAttribute('points', '22 4 12 14.01 9 11.01');
    svg.appendChild(polyline);

    // Create message span with safe textContent
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast__message';
    messageSpan.textContent = message;

    // Assemble toast
    toast.appendChild(svg);
    toast.appendChild(messageSpan);
    this.toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
    });

    // Auto-dismiss
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
}
