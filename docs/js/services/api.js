/**
 * API Service
 * Handles all data fetching with error handling and caching
 * @module services/api
 */

import CONFIG from '../config.js';

/**
 * Fetch JSON data with error handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} If request fails
 */
async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
}

/**
 * Artworks API
 */
export const artworksAPI = {
  /**
   * Fetch all artworks
   * @returns {Promise<Array>} Array of artwork objects
   */
  async getAll() {
    return fetchJSON(CONFIG.api.artworks);
  },

  /**
   * Fetch featured artworks
   * @param {number} count - Number of artworks to fetch
   * @returns {Promise<Array>} Array of featured artwork objects
   */
  async getFeatured(count = CONFIG.ui.gallery.featuredCount) {
    const artworks = await this.getAll();
    return artworks.slice(0, count);
  },

  /**
   * Find artwork by ID
   * @param {number} id - Artwork ID
   * @returns {Promise<Object|null>} Artwork object or null
   */
  async getById(id) {
    const artworks = await this.getAll();
    return artworks.find(artwork => artwork.id === id) || null;
  },
};

/**
 * Translations API
 */
export const translationsAPI = {
  /**
   * Fetch all translations
   * @returns {Promise<Object>} Translations object
   */
  async getAll() {
    return fetchJSON(CONFIG.api.translations);
  },

  /**
   * Fetch translations for specific language
   * @param {string} lang - Language code
   * @returns {Promise<Object>} Language translations
   */
  async getLanguage(lang) {
    const translations = await this.getAll();
    return translations[lang] || translations[CONFIG.language.default];
  },
};

/**
 * Contact Form API
 */
export const contactAPI = {
  /**
   * Submit contact form
   * @param {Object} data - Form data
   * @returns {Promise<Object>} Response data
   */
  async submit(data) {
    try {
      const response = await fetch(CONFIG.api.contactForm, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Contact form error:', error);
      throw error;
    }
  },
};

export default {
  artworks: artworksAPI,
  translations: translationsAPI,
  contact: contactAPI,
};
