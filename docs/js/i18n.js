/**
 * Internationalization (i18n) Module
 * Handles translations and language switching
 * @module i18n
 */

import { $$ } from './utils/dom.js';
import { getStorageItem, setStorageItem } from './utils/storage.js';
import { translationsAPI } from './services/api.js';
import CONFIG from './config.js';

class I18n {
  constructor() {
    this.translations = {};
    this.currentLang = getStorageItem(CONFIG.storage.language) || CONFIG.language.default;
    this.init();
  }

  /**
   * Initialize i18n
   * @private
   */
  async init() {
    try {
      this.translations = await translationsAPI.getAll();
      this.applyTranslations();
      this.setupLanguageToggle();
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  /**
   * Get translation value
   * @param {string} key - Translation key (dot notation)
   * @param {string} lang - Language code (optional)
   * @returns {string|null} Translation value
   */
  get(key, lang = this.currentLang) {
    const keys = key.split('.');
    let value = this.translations[lang];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return null;
      }
    }

    return value || null;
  }

  /**
   * Apply translations to all elements with data-translate attribute
   * @private
   */
  applyTranslations() {
    const elements = $$('[data-translate]');

    elements.forEach(element => {
      const key = element.getAttribute('data-translate');
      const translation = this.get(key);

      if (!translation) return;

      // Handle different element types
      if (key === 'home.title') {
        // Multi-line title - use safe DOM methods to prevent XSS
        const lines = translation.split('\n');
        element.textContent = ''; // Clear existing content
        lines.forEach((line, index) => {
          const textNode = document.createTextNode(line.trim());
          element.appendChild(textNode);
          if (index < lines.length - 1) {
            element.appendChild(document.createElement('br'));
          }
        });
      } else if (element.tagName === 'INPUT' && element.type === 'submit') {
        element.value = translation;
      } else if (element.tagName === 'BUTTON' && !element.querySelector('svg')) {
        element.textContent = translation;
      } else if (element.hasAttribute('placeholder')) {
        element.placeholder = translation;
      } else {
        // Check for line breaks
        if (translation.includes('\n')) {
          // For elements with <p> tags, preserve structure
          if (element.querySelector('p')) {
            const paragraphs = translation.split('\n').filter(p => p.trim());
            const existingParagraphs = element.querySelectorAll('p');
            paragraphs.forEach((text, index) => {
              if (existingParagraphs[index]) {
                existingParagraphs[index].textContent = text.trim();
              }
            });
          } else {
            // Use safe DOM methods to create paragraphs - prevent XSS
            element.textContent = ''; // Clear existing content
            const paragraphs = translation.split('\n').filter(p => p.trim());
            paragraphs.forEach(text => {
              const p = document.createElement('p');
              p.textContent = text.trim();
              element.appendChild(p);
            });
          }
        } else {
          element.textContent = translation;
        }
      }
    });

    // Handle placeholder translations separately
    const placeholderElements = $$('[data-translate-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-translate-placeholder');
      const translation = this.get(key);
      if (translation) {
        element.placeholder = translation;
      }
    });

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLang;
  }

  /**
   * Switch language
   * @param {string} lang - Language code
   */
  switch(lang) {
    if (!CONFIG.language.supported.includes(lang)) {
      console.warn(`Unsupported language: ${lang}`);
      return;
    }

    this.currentLang = lang;
    setStorageItem(CONFIG.storage.language, lang);
    this.applyTranslations();
  }

  /**
   * Setup language toggle button
   * @private
   */
  setupLanguageToggle() {
    const langToggle = document.getElementById('lang-toggle');
    if (!langToggle) return;

    this.updateLanguageToggle(langToggle);

    langToggle.addEventListener('click', () => {
      const newLang = this.currentLang === 'en' ? 'ua' : 'en';
      this.switch(newLang);
      this.updateLanguageToggle(langToggle);
    });
  }

  /**
   * Update language toggle button
   * @private
   * @param {Element} toggle - Toggle button
   */
  updateLanguageToggle(toggle) {
    const langName = this.currentLang === 'en' ? 'English' : 'Ukrainian';
    toggle.setAttribute('aria-label', `Switch language (current: ${langName})`);

    const options = toggle.querySelectorAll('.lang-option');
    options.forEach(option => {
      const isActive = option.dataset.lang === this.currentLang;
      option.classList.toggle('active-lang', isActive);
    });
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLang;
  }
}

// Create singleton instance
const i18n = new I18n();

// Export for global access (backwards compatibility)
window.getTranslation = (key) => i18n.get(key);
window.switchLanguage = (lang) => i18n.switch(lang);
Object.defineProperty(window, 'currentLang', {
  get: () => i18n.getCurrentLanguage(),
});

export default i18n;
